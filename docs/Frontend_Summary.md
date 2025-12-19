## PG Management Admin Frontend – Summary

### Tech Stack & Bootstrapping

- **Framework**: React (Vite) using JSX.
- **Routing**: `react-router-dom` v6 with `useRoutes`.
- **State management**: Redux Toolkit + `redux-persist` (persisting only the `auth` slice).
- **UI**: Ant Design components, Tailwind-style utility classes, `lucide-react` and `react-icons` for icons.
- **HTTP**: `axios` with a custom instance and interceptors.
- **Notifications**: `react-hot-toast`.

**Entry flow**

- `src/main.jsx`
  - Wraps `<App />` with `<Provider store={store}>` and `<PersistGate>` to rehydrate auth state.
  - `FullScreenLoader` is shown while persisted state is being rehydrated.
- `src/config/envConfig.js`
  - Reads:
    - `VITE_PUBLIC_SITE_NAME` → `SITE_NAME`.
    - `VITE_PUBLIC_API_URL` → `API_URL` (base for all backend calls).
  - Throws if either env var is missing.

### Routing & Layouts

- **Top-level routing** (`src/App.jsx` + `src/routes.jsx`)
  - Uses `BrowserRouter` and `useRoutes(routesConfig)`.
  - Routes:
    - `/login` → `LoginPage` (admin login with tenant ID + password).
    - `/onboard` → `UserOnboardPage` (public resident onboarding form).
    - `/dashboard` → `AuthLayout` (protected) → `DashBoardLayout`.
    - `*` → redirects to `/dashboard`.
- **Auth layout** (`src/routes/AuthLayout.jsx`)
  - Reads `selectIsAuthenticated` + `selectIsAdmin` from `authSlice`.
  - If both true → renders nested routes via `<Outlet />`.
  - Otherwise → redirects to `/login`.
- **Dashboard layout** (`src/pages/dashboard/DashBoardLayout.jsx`)
  - Uses AntD `Layout` with:
    - Left `Sidebar` (`components/shared/SideNav.jsx`).
    - Top `Header` with “PG Management Dashboard”.
    - Main content area (`components/shared/Content.jsx`) that switches between dashboard sub-pages based on `selectedMenu`.
  - On mount: dispatches `fetchAllIssues()` to populate issues and sidebar badge.

### Auth Flow (Admin)

- **State** (`src/redux/auth/authSlice.js`)

  - Shape:
    - `user`, `token`, `isAuthenticated`, `isAdmin`, `status`, `error`.
  - Thunks:
    - `loginUser(credentials)` → `authService.login` → `/api/v1/auth/login/admin`.
    - `fetchUser()` → `authService.fetchAdminProfile` → admin profile from backend.
    - `updateUserProfile(userData)` → `authService.updateAdminProfile`.
    - `refreshToken()` → `authService.refreshToken`.
  - Reducers:
    - `logout()` → clears auth state and `localStorage.tenant_id`.
    - `tokenRefreshed({ token })` → updates token from refresh flow.
    - `setAuthStatus(status)` → sets status manually.

- **Login screen** (`src/pages/auth/LoginPage.jsx`)

  - Ant Design form with:
    - `tenantId` (UUID of tenant).
    - `password`.
  - On submit (`onFinish`):
    - Stores `tenantId` into `localStorage.tenant_id`.
    - Dispatches `loginUser({ password })` (service reads tenant from localStorage).
    - On success: toast “Login Successful!”; a `useEffect` redirects to `/dashboard` once `isAuthenticated && isAdmin`.

- **Auth service** (`src/services/authService.js`)
  - `login(credentials)`:
    - Reads `tenant_id` from `localStorage`.
    - Sends `{ tenant_id, password }` to `/api/v1/auth/login/admin` with `tenant_id` header.
  - `fetchAdminProfile` / `updateAdminProfile` → `/api/v1/users/admin/profile`.
  - `fetchUserProfile` / `updateUserProfile` → `/api/v1/users/profile`.
  - `updateUserProfileByAdmin(userId, formData)` → `/api/v1/users/:userId/update-profile` (multipart).
  - `refreshToken` → `/api/v1/auth/refreshToken`.

### Axios API Layer & Tenant Handling

- **Axios instance** (`src/services/api.js`)

  - `baseURL: API_URL`.
  - **Request interceptor**:
    - Detects _public_ endpoints:
      - `/api/v1/users/signup-onboard`
      - `/api/v1/rooms/public`
    - For non-public endpoints:
      - Reads `auth.token` from Redux store and sets `Authorization: <token>` header (no `Bearer` prefix).
    - Always adds tenant headers from `localStorage.tenant_id`:
      - `tenant-id` and `tenant_id` (for proxies that strip underscores).
  - **Response interceptor**:
    - Handles timeouts and network errors with user-friendly toasts.
    - For `401` on non-auth, non-public endpoints:
      - Runs a centralized **refresh token** flow:
        - Calls `POST /api/v1/auth/refreshToken`.
        - Dispatches `tokenRefreshed` with new token.
        - Replays queued requests with updated token and tenant headers.
      - On refresh failure:
        - Shows “session expired” toast.
        - Dispatches `logout()` to force user back to login.

- **Error normalization** (`src/utils/APIErrorHandler.js`)
  - `handleApiError(error)`:
    - Always returns an object with a `msg` field derived from `data.msg`, `data.message`, or the raw string body.
    - All slices use this so toast and error UI have consistent messages.

### Public User Onboarding Flow

- **Page** (`src/pages/auth/UserOnboardPage.jsx`)
  - Self-service onboarding for residents (no login required).
  - On mount:
    - Sets a predefined `tenant_id` in `localStorage` (current implementation uses a hard-coded UUID).
    - Fetches `GET /api/v1/rooms/public` to list rooms for that tenant.
    - Filters rooms to `current_occupancy < capacity` → dropdown options.
  - Form fields:
    - Basics: name, email, password, phone, DOB, gender.
    - Optional: emergency contacts, advance amount, profile image, preferred room number.
    - ID proofs: at least one required; uploaded as multiple files (`id_proofs` in `FormData`).
  - On submit:
    - Builds `FormData` with all fields + files.
    - Sends `POST /api/v1/users/signup-onboard` with `multipart/form-data`.
    - Uses shared `api` instance, so tenant headers are attached automatically.
    - On success: shows success toast and resets form and file list.

### Dashboard & Navigation

- **Sidebar** (`src/components/shared/SideNav.jsx`)

  - Renders main navigation using AntD `Sider` + `Menu` and a static `MENU_ITEMS` array:
    - `dashboard`, `customers`, `alerts`, `rooms`, `issues`, `payments`, `electricity`, `reports`, `settings` (group with `edit-profile`).
  - Uses Redux (`selectAllIssues`, `selectIssueStatus`) to compute `unresolvedIssuesCount` and shows a red `Badge` on “Issues Management”.
  - Logout button:
    - Dispatches `logout()`.
    - Shows toast and navigates to `/`.

- **Dashboard contents** (`src/pages/dashboard/DashboardContents.jsx`)
  - On mount: dispatches:
    - `fetchAllCustomers()`
    - `fetchRoomsData()`
    - `fetchAllIssues()`
    - `fetchStatistics()` (payment stats)
  - Computes:
    - `totalCustomers` (Active status).
    - `occupiedRooms` (rooms at full capacity).
    - `unresolvedIssues`.
    - `totalCollected` from payment statistics.
  - UI:
    - Metric cards (Active Customers, Fully Occupied Rooms, Unresolved Issues, Total Collected) that, when clicked, call `onMenuChange("customers" | "rooms" | "issues" | "payments")`.
    - “Quick Actions” cards (Add Customer, Add Room, View Issues, Payment Records) that switch the selected dashboard section.

### Domain Modules & Backend Mapping (High-Level)

- **Customers (Resident Management)**

  - Redux: `src/redux/customer/customerSlice.js`.
  - Service: `src/services/customerService.js`.
  - Main backend endpoints (via `api`):
    - `GET /api/v1/users/all` – list customers.
    - `POST /api/v1/auth/signup` – create new user (admin-created).
    - `PUT /api/v1/users/:userId/onboard` – admin onboarding / update of user.
    - `DELETE /api/v1/users/:userId` – delete user.
    - `PUT /api/v1/users/:userId/tariff` – change tariff.
    - `PUT /api/v1/users/:userId/remove-room` – remove from room.
    - `PUT /api/v1/users/:userId/password` – change user password.
    - `POST /api/v1/users/bulk-import` – bulk import.
    - `POST/GET/PUT /api/v1/users/:userId/advance` – advance collection / read / update.
    - `/api/v1/users/:userId/profile/image` – upload/delete profile image.
    - `PUT /api/v1/users/:userId/activate` – activate user.

- **Rooms & Tariffs**

  - Redux: `src/redux/room/roomSlice.js`.
  - Service: `src/services/roomService.js`.
  - Backend endpoints:
    - Blocks: `/api/v1/blocks` (list/create/update/delete) and `/blocks/:id/google-review-link`.
    - Rooms: `/api/v1/rooms` CRUD.
    - Tariffs: `/api/v1/tariffs` CRUD.
    - Room presets: `/api/v1/room-presets` CRUD.

- **Payments (Rent)**

  - Redux: `src/redux/payment/paymentSlice.js`.
  - Service: `src/services/paymentService.js`.
  - Backend endpoints:
    - `GET /api/v1/payments` – list all payments.
    - `POST /api/v1/payments` – create payment.
    - `PUT /api/v1/payments/:paymentId/process` – full payment.
    - `PUT /api/v1/payments/:paymentId/partial` – partial payment.
    - `DELETE /api/v1/payments/:id` – delete payment.
    - `GET /api/v1/payments/statistics` – aggregated stats.
    - `POST /api/v1/payments/generate` – trigger monthly payment generation.
    - `GET /api/v1/payments/:paymentId/transactions` – transaction history.

- **Issues**

  - Redux: `src/redux/issue/issueSlice.js`.
  - Service: `src/services/issueService.js`.
  - Backend endpoints:
    - `GET /api/v1/issues/all` – list issues.
    - `PUT /api/v1/issues/:issueId/status` – update issue status.

- **Electricity & Food**
  - Electricity:
    - Redux: `src/redux/electricity/electricitySlice.js`.
    - Service: `src/services/electricityService.js`.
    - Pages: `ElectricityManagementPage`, `BillsTable`, `UnpaidSharesTable`, `StatisticsPanel`, plus user views (`MyElectricityBills`, `PaymentHistory`).
    - Uses `/api/v1/electricity/...` endpoints for bills, shares and stats.
  - Food:
    - Redux: `food` slice (similar pattern).
    - Service: `exportService`/`foodService` style modules.
    - Pages: `FoodManagementPage`, `FoodTable`.
    - Uses `/api/v1/food/...` endpoints for meal polls, pricing, and billing as documented in the backend summary.

### Persistence & Session Behavior

- **Redux persist**:
  - Only `auth` slice is persisted under the `root` key in `localStorage`.
  - On logout, reducer also clears `tenant_id` to avoid accidentally sending old tenant headers.
- **Tenant selection**:
  - For admin login, tenant is chosen by entering `tenantId` on the login page.
  - For public onboarding, `tenant_id` is currently set programmatically (for a specific PG) before calling public room and onboarding APIs.

---

This summary is intended for frontend developers and QA to quickly understand:

- how the React app is structured,
- how auth and tenant routing work,
- and which Redux slices/services map to which backend modules and endpoints.
