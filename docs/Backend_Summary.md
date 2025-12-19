## PG Management Backend – Summary

### Tech Stack & Entry Point

- **Runtime**: Node.js (ES Modules) with **Express 5**.
- **Database**: PostgreSQL using the `pg` client, with **multi-tenant** architecture (one master DB + one DB per tenant).
- **Other libs**: JWT for auth, `multer` for uploads, S3 (`@aws-sdk/client-s3`) for file storage, Firebase Admin (FCM) for push notifications, `node-cron` for scheduled jobs, `pdfkit` for receipt PDFs, and QR/WhatsApp utilities.
- **Entry file**: `pgmanagement_be/index.js`
  - Loads env from `config/demo-dev.env` + optional root `.env`.
  - Sets up CORS, JSON parsing, request logging and error handling.
  - Mounts all API routers via `pgmanagement_be/setup_route.js` under `/api/v1/...`.
  - Serves static frontend from `pgmanagement_be/public`.
  - On startup: checks S3 connection, initializes Tapo smart switch, and starts multi-tenant cron jobs.

### Multi-Tenant Database Model

- **Master DB**:
  - Stores `tenants`, `tenant_admins`, provisioning state, and global metadata.
  - Connection managed by `src/helpers/db_connection.js` (`pool`).
- **Tenant DBs**:
  - Each tenant has its own Postgres database (`tenant_db_name` in `public.tenants`).
  - Tenant DBs contain domain tables like `pg_users`, `pg_room`, `pg_tariff_preset`, `pg_payments`, `food_*`, washing machine, electricity, etc.
- **Connection pattern**:
  - `getTenantDbConfig(tenantId)` looks up `tenant_db_name` in master DB.
  - `getTenantPool(tenantId)` caches a `Pool` per tenant.
  - `getPoolFromRequest(req)` returns `req.tenantPool` (tenant DB) or falls back to master pool.
  - Auth middleware resolves `tenantId`, `adminId`, sets `req.tenantPool`, and most controllers call `getPoolFromRequest(req)` to stay tenant-isolated.

### Authentication & Identity

- **Routers**: `pgmanagement_be/src/auth/router.js`
- **Main endpoints**:
  - `POST /auth/login/master-admin`
    - Master admin login using `MASTER_ADMIN_EMAIL` env + password.
    - Returns JWT with `is_master_admin: true` to manage tenants and provisioning.
  - `POST /auth/login/tenant-admin`
    - New tenant admin login (Phase 2.1).
    - Inputs: `tenant_id` (UUID), `email`, `password`.
    - Uses master DB function `verify_tenant_admin_login(...)` to validate tenant/admin.
    - Verifies bcrypt password from `tenant_admins`.
    - Computes **feature flags** as (tenant-level AND admin-level):
      - `is_washing_machine_enabled`, `is_food_enabled`, `is_payment_enabled`,
        `is_user_management_enabled`, `is_report_access_enabled`,
        `is_expense_management_enabled`, and a temporary `is_electricity_enabled`.
    - Returns JWT with `{ tenant_id, tenant_name, admin_id, is_admin: true }`
      plus feature permissions and color preferences.
  - `POST /auth/login` (user login)
    - Tenant-scoped: requires `tenant_id` in header or query.
    - Uses tenant DB pool to authenticate `pg_users` by email + bcrypt password.
    - Rejects admin accounts and inactive / room-less users.
    - Returns JWT with `{ email, user_id, is_admin, admin_id, tenant_id }`
      plus feature flags and branding colors resolved from master DB.
  - `POST /auth/signup`
    - Tenant-scoped user signup using `tenant_id` header.
    - Creates user in tenant DB under default active admin for that tenant.
    - Hashes password and syncs user to **central backend** (`CENTRAL_BACKEND_URL`) for cross-PG identity.
  - `GET /auth/user` / `GET /auth/admin`
    - Returns current authenticated user/admin info from DB + a refreshed JWT.
  - `POST /auth/refreshToken`
    - Creates a new token from the existing one (ignores expiration).

### Tenants & Provisioning

- **Router**: `pgmanagement_be/src/tenants/router.js` mounted at `/api/v1/tenants`.
- **Core flows**:
  - Initial setup (no auth):
    - `POST /tenants/setup/master-database`
    - `POST /tenants/setup/create-master-admin`
  - Master-admin only:
    - `GET /tenants`, `GET /tenants/:id` – list/get tenants with filters + pagination.
    - `POST /tenants` – create tenant + optional admin.
    - `PUT /tenants/:id` – update tenant details and feature flags.
    - `POST /tenants/:id/activate` / `deactivate` – change tenant status.
    - `DELETE /tenants/:id` – soft delete (checks active admins first).
  - **Provisioning workflow**:
    - `POST /tenants/provision` (`provisionTenantComplete`)
      - 5 automated steps:
        1. Create tenant + admin in master DB.
        2. Create tenant DB and apply schema.
        3. Populate `admin_id` values in tenant DB.
        4. Update unique and foreign key constraints.
        5. Verify the final setup.
      - Returns detailed `steps.stepN.completed/error/data` + `connectionDetails`.
      - Handles full success (201), partial success (207), and errors with user-friendly messages
        (e.g. duplicate DB names, duplicate emails, constraint violations).
    - Additional provisioning endpoints: populate admin ids, update constraints, get status, retry, and cleanup (all master-admin protected).

### Users, Rooms & Lifecycle

- **Router**: `pgmanagement_be/src/users/router.js` mounted at `/api/v1/users`.
- **Admin-only endpoints** (require `auth` + `checkUserManagement`):

  - Listing & CRUD:
    - `GET /users/all` – all users for the logged-in admin.
    - `POST /users/create` – create user using service layer with correct `admin_id`.
    - `DELETE /users/:userId` – full delete with S3 cleanup and room occupancy updates.
  - Onboarding & room management:
    - `PUT /users/:userId/onboard` – attach room, gender, DOB, emergency contacts, ID proofs (S3), and auto-assign tariff from room preset; updates room occupancy + room logs.
    - `PUT /users/:userId/tariff` – change tariff for a room-assigned user.
    - `PUT /users/:userId/change-room` / `reassign-room`
      - Validates target room (capacity, ownership), updates tariff according to room preset, decrements old room occupancy and increments new, logs `pg_user_room_log`.
    - `PUT /users/:userId/remove-room`
      - Clears room and tariff, sets user inactive and unsubscribes meals.
      - Deletes payment transactions, payments, food polls, and prior room logs.
      - Logs a removal entry in `pg_user_room_log` and decrements room occupancy.
  - Password & profile:
    - `PUT /users/:userId/password` – admin password reset (with sync to central backend).
    - `PUT /users/:userId/update-profile` – updates profile fields, handles new profile images + additional ID proofs via S3.
    - `PUT /users/:userId/activate` – mark user active (with validation that user belongs to the admin).
  - Advance / deposit:
    - `POST /users/:userId/advance` – collect advance (must be room-assigned).
    - `GET /users/:userId/advance` – read current advance.
    - `PUT /users/:userId/advance` – adjust advance and optionally generate a receipt PDF, upload to S3, and return receipt info.
  - Vacation management:
    - `POST /users/:userId/vacation` – set `vacating_on` to last day of current month and notify user via FCM.
    - `DELETE /users/:userId/vacation` – cancel vacation and notify.
    - `PUT /users/:userId/vacate` – same final effect as setting vacation for end of month (separate, clearer semantics).
    - `GET /users/vacating` / `GET /users/vacating/room/:roomId` – list users scheduled to vacate.
    - `POST /users/process-vacated` – trigger cron-like flow to deactivate users whose vacation date is passed.
  - Bulk import:
    - `POST /users/bulk-import` – CSV/Excel-style user import with per-user DB transaction:
      - Validates room capacity and tariff ownership.
      - Increments room occupancy.
      - Optionally syncs each created user to central backend.

- **End-user endpoints** (require `auth` only):

  - `GET /users/profile` / `PUT /users/profile` – view and update own profile.
  - `GET /users/room` – current room details.
  - `GET /users/payments/summary` / `/history` – own payment overview.
  - `PUT /users/change-password` – change own password (also syncs to central backend).
  - `GET /users/admin/contact` – contact details for active tenant admin (from master DB).

- **Public QR-based signup + onboarding**:
  - `POST /users/signup-onboard`
    - Accepts `tenant_id` (from headers/query/token) and optional `admin_id`.
    - Validates:
      - Name/email/password/phone, gender, DOB (16–120 years old), emergency numbers.
      - Optional `room_number` (maps to a room, possibly under a different admin).
      - Optional `advance_amount`.
    - Resolves effective `admin_id` via `resolveAdminId` and room ownership.
    - Handles uploads:
      - `profile_image` (single file) and `id_proofs` (multiple) using S3.
      - Or reuses pre-uploaded URLs from body.
    - Creates a user with:
      - Optional room assignment from `room_number` with automatic `tariff_id`.
      - `is_active = true`, adjusts occupancy, logs `pg_user_room_log`.
    - Syncs to central backend and returns a rich user object for the frontend.

### Payments (Rent) & Transactions

- **Router**: `pgmanagement_be/src/payments/router.js` mounted at `/api/v1/payments`, protected by `auth` + `checkPayment`.
- **Payment records vs transactions**:
  - `pg_payments`:
    - One row per billing cycle per user.
    - Stores `tariff_id`, `amount_due`, `stored_amount_due`, `status` (`due`, `paid`, `rolled_over`), cycle start & due dates.
  - `pg_payment_transactions`:
    - One row per actual payment or partial payment.
    - Stores `amount_paid`, `payment_method`, `transaction_reference`, `admin_id`, and links to `payment_id` + `user_id`.
- **Key endpoints**:

  - Listing & insights:
    - `GET /payments/` – all payments for admin.
    - `GET /payments/combined/details-all` – same data shape used by frontend combined views.
    - `GET /payments/user/:user_id`, `/payments/:id`, `/payments/overdue`, `/payments/due-today`.
    - `GET /payments/summary/:user_id`, `/payments/total-due/:user_id`, `/payments/statistics`.
  - Mutations:
    - `POST /payments/` – create a payment record for a user:
      - Verifies user exists, has a valid room, and belongs to admin.
      - Verifies tariff belongs to same admin.
    - `PUT /payments/:payment_id/process`
      - Full payment:
        - Uses `stored_amount_due` (actual remaining balance) rather than computed tariff amount, to honor prior partials.
        - Refuses if amount due is ≤ 0.
        - Marks payment as `paid` and creates a transaction row.
    - `PUT /payments/:payment_id/partial`
      - Partial payment:
        - Validates `amount_paid > 0` and not greater than remaining stored due.
        - Updates `stored_amount_due` and status accordingly (`paid` or `due`).
        - Records a transaction row.
    - `DELETE /payments/:id` – delete payment by id if it belongs to admin.
  - Transaction history:
    - `GET /payments/:payment_id/transactions`, `/payments/user/:user_id/transactions`,
      `/payments/transactions/all`, `/payments/transaction/:id`,
      `/payments/transactions/summary`.
  - Tools:
    - `POST /payments/sync-amounts` – recalculates `amount_due` for all `status='due'` payments
      based on current tariff values for an admin.

- **Monthly payment generation** (rent):
  - Implemented by `generateMonthlyPayments(req?, tenantId?)` in `src/payments/controller.js`.
  - Uses:
    - `PAYMENT_CYCLE_START_DAY` and `PAYMENT_DUE_DAY` env vars.
    - IST (Asia/Kolkata) timezone for cycle start and due date calculations.
  - Flow (per admin):
    1. Selects all users with active tariffs (`getUsersWithActiveTariffsQuery`).
    2. Ensures each user has a valid room (joins `pg_room`); otherwise skips.
    3. For each user:
       - If payment for this cycle exists:
         - If it has any transactions: keep `amount_due` as-is, only update `tariff_id` if changed.
         - If it has no transactions: update `tariff_id` and `amount_due` if fees changed.
       - If no payment exists:
         - Sums all previous unpaid (`status='due'`) payments to compute arrears.
         - Marks them as `rolled_over`.
         - Creates new payment with `amount_due = arrears + currentCycleAmount`.
    4. Commits all changes in a single transaction per run and returns `{created, updated}` counts.
  - Exposed via:
    - `POST /payments/generate` – manual trigger (per tenant/admin) used from admin UI.

### Food Module (Meal Polling & Food Billing)

- **Router**: `pgmanagement_be/src/foods/router.js` mounted at `/api/v1/food`.
- **Configuration**:

  - All config values are stored per admin in `meal_pricing_config` and `food_meal_pricing`:
    - `minimum_meal_price`, `poll_deadline_hour`, `poll_deadline_minute`, `billing_cycle_start_day`.
  - Endpoints:
    - `GET /food/config`, `POST /food/config` – read/update config (supports both single key and bulk update).
    - `GET /food/pricing`, `POST /food/pricing` – list and manage `(meal_count, price)` tiers.
    - `GET /food/config/summary`, `POST /food/config/calculate-price`, `POST /food/config/validate-preferences`.
  - Pricing calculation:
    - For a given `mealCount`, backend:
      - Tries to find an exact tier.
      - Else picks closest lower tier.
      - Enforces minimum price from config.

- **User polls**:

  - `GET /food/poll/deadline` – returns current deadline and whether now is before it.
  - `POST /food/poll` – user submits daily B/L/D:
    - Validates preferences.
    - Verifies user is meal-subscribed.
    - Ensures submission is before per-admin deadline for the `pollDate`.
    - Upserts into `food_polls` with admin scoping.
  - `GET /food/poll/:pollDate` – user’s poll for a specific day.
  - `GET /food/poll?startDate&endDate` – user’s polls over a date range.

- **Kitchen dashboards**:

  - `GET /food/poll/summary` – next-day global counts for breakfast/lunch/dinner.
  - `GET /food/poll/summary/:date` – counts + per-user details for a specific date.
  - `GET /food/poll/weekly-summary` – aggregated counts per day for a given range.

- **Food billing / payments**:

  - `GET /food/billing/summary/:userId` – per-user combined rent/food due.
  - `GET /food/billing/summary` – all users’ food dues.
  - `GET /food/payments/all` – unified list of food-related payments.
  - `POST /food/billing/generate` – generates monthly food billing:
    - Takes `{month, year}` (defaults to current month), computes `cycle_start_date` as first of month.
    - Deletes previous food billing for that cycle and re-inserts from polls and pricing.
  - `GET /food/billing/stats` – returns meal counts and calculated food price for a user in a date range.

- **Notifications & cron**:
  - `POST /food/notifications/meal-reminder` and `/meal-reminder/:userId` – send push notifications to fill polls.
  - `POST /food/notifications/billing-reminder` – remind users about food dues.
  - `POST /food/notifications/kitchen-preparation` – notify kitchen about upcoming meals.
  - `GET /food/cron/status`, `POST /food/cron/trigger` – view and manually trigger food cron jobs.

### Other Domains & Integrations (Short)

- **Other routers** (similar pattern; each has `controller.js` + `query.js` + `router.js`):
  - `/api/v1/tariffs` – tariff presets and rent configuration.
  - `/api/v1/room-presets`, `/api/v1/blocks`, `/api/v1/rooms` – room structure and configuration.
  - `/api/v1/expenses` & `/api/v1/expense-categories` – expense tracking and categories.
  - `/api/v1/electricity` – electricity bill tables and operations.
  - `/api/v1/issues` – issue tracking (tickets) with enums and a dedicated Postman collection.
  - `/api/v1/washing-machine` – washing machine schedules, cron-based automation, and tests.
  - `/api/v1/export` & `/api/v1/dashboard` – reporting and exports; `/reports` is just an alias to `exportRouter`.
  - `/api/v1/files` – general-purpose upload/download endpoints.
  - `/api/v1/fcm` – FCM device token management and notification helpers.
- **S3 integration**: `services/aws.services.js` offers simple helpers for uploading and deleting files; used by users, receipts, and ID proof uploads.
- **Central backend integration**:
  - Some user endpoints sync signups and password changes to a central auth service (`CENTRAL_BACKEND_URL`) to keep global identities in sync across PGs.

---

This summary is meant as a high-level reference for the admin React app, so frontend developers can understand which backend endpoints exist, what they do, and how multi-tenancy, billing, and feature flags work end-to-end.
