# Bed Management Integration Plan - Frontend

This document outlines the step-by-step sequence to integrate the new individual Bed Management functionality into the `pgmanagement_admin_react` dashboard.

## Overview
The goal is to transition from a simple "Room Capacity" count to a detailed "Bed-level" management system where each bed in a room can be tracked, assigned, and placed in maintenance.

---

## Sequence 1: Data Access Layer (Service)
**File**: `src/services/bedService.js`

1. Create a new service file to interface with the backend `/api/v1/beds` endpoints.
2. Implement functions for:
   - `getAllBeds()`
   - `getBedsByRoomId(roomId)`
   - `createBed(bedData)`
   - `updateBed(bedId, bedData)`
   - `changeBedStatus(bedId, status)`
   - `deleteBed(bedId)`
   - `getBedAvailabilitySummary()`

---

## Sequence 2: State Management (Redux)
**Files**: `src/redux/bed/bedSlice.js`, `src/redux/store.js`

1. Create `bedSlice.js` using `@reduxjs/toolkit`.
2. Define `createAsyncThunk` for all service operations.
3. Handle standard states: `loading`, `succeeded`, `failed`.
4. Register the `bedReducer` in `src/redux/store.js`.

---

## Sequence 3: Specialized Components
**Directory**: `src/pages/dashboard/room/components/`

1. **BedManagementModal.jsx**: A modal that opens when clicking "Manage Beds" for a specific room.
   - It should list all beds for that room.
   - Show status icons for each bed (Available, Occupied, Maintenance, etc.).
2. **BedFormModal.jsx**: Modal to Add or Edit a bed's code/notes.
3. **BedStatusActions**: Small action buttons/icons to toggle status (e.g., mark as Maintenance).

---

## Sequence 4: Enhancing Existing UI
**Files**: `src/pages/dashboard/room/RoomsTable.jsx`, `src/pages/dashboard/room/RoomManagementPage.jsx`

1. **RoomsTable.jsx**:
   - Add a "Bed" icon or "Manage Beds" button in the action column or beside the capacity count.
   - Pass the `roomId` to the parent handler when clicked.
2. **RoomManagementPage.jsx**:
   - Add state `const [bedModal, setBedModal] = useState({ visible: false, roomId: null });`.
   - Implement handlers to open/close the `BedManagementModal`.

---

## Sequence 5: User Assignment Integration
**File**: `src/pages/dashboard/customer/components/OnboardingFormModal.jsx`

1. Currently, onboarding likely just selects a room.
2. **Update**: Once a room is selected, fetch available beds for that room using `getBedsByRoomId`.
3. Add a "Select Bed" dropdown that only shows beds with `AVAILABLE` status.
4. Update the submission payload to include `bed_id`.

---

## Sequence 6: Dashboard Metrics
**File**: `src/pages/dashboard/DashboardContents.jsx`

1. Update the metric cards to show:
   - "Total Available Beds" instead of just "Vacant Rooms".
   - "Beds under Maintenance".
2. Use the `getBedAvailabilitySummary` API to drive these numbers.

---

## Integration Summary Checklist
- [ ] Service Layer Created
- [ ] Redux Store Updated
- [ ] Manage Beds button added to Room Table
- [ ] Bed Management Modal functional
- [ ] User Assignment updated to include specific beds
- [ ] Dashboard metrics aligned with bed-level data
