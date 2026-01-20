import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as bedService from "../../services/bedService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";
import { fetchRoomsData } from "../room/roomSlice";

const initialState = {
  beds: [],
  roomBeds: [],
  summary: null,
  status: "idle",
  error: null,
};

// --- Thunks ---

/** @type {any} */
export const fetchAllBeds = createAsyncThunk("bed/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await bedService.getAllBeds();
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

/** @type {any} */
export const fetchBedsByRoom = createAsyncThunk("bed/fetchByRoom", async (/** @type {string} */ roomId, { rejectWithValue }) => {
  try {
    if (!roomId) throw new Error("Room ID is required");
    const response = await bedService.getBedsByRoomId(roomId);
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

/** @type {any} */
export const fetchBedSummary = createAsyncThunk("bed/fetchSummary", async (/** @type {string | undefined} */ roomId, { rejectWithValue }) => {
  try {
    const response = roomId 
      ? await bedService.getBedAvailabilitySummary(roomId)
      : await bedService.getAllBedAvailabilitySummary();
    return response.data.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

/** @type {any} */
export const addBed = createAsyncThunk("bed/add", async (/** @type {any} */ bedData, { dispatch, rejectWithValue }) => {
  try {
    const response = await bedService.createBed(bedData);
    toast.success(response.data.msg || "Bed created successfully!");
    if (bedData && bedData.room_id) {
       dispatch(fetchBedsByRoom(bedData.room_id));
    }
    dispatch(fetchAllBeds());
    dispatch(/** @type {any} */ (fetchRoomsData())); // Refresh rooms to update bed counts
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to create bed.");
    return rejectWithValue(errorData);
  }
});

/** @type {any} */
export const updateBed = createAsyncThunk("bed/update", async (/** @type {{id: string, data: any, roomId?: string}} */ arg, { dispatch, rejectWithValue }) => {
  const { id, data, roomId } = arg;
  try {
    const response = await bedService.updateBed(id, data);
    toast.success(response.data.msg || "Bed updated successfully!");
    if (roomId) dispatch(fetchBedsByRoom(roomId));
    dispatch(fetchAllBeds());
    dispatch(/** @type {any} */ (fetchRoomsData())); // Refresh rooms to update bed counts
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update bed.");
    return rejectWithValue(errorData);
  }
});

/** @type {any} */
export const deleteBed = createAsyncThunk("bed/delete", async (/** @type {{id: string, roomId?: string}} */ arg, { dispatch, rejectWithValue }) => {
  const { id, roomId } = arg;
  try {
    const response = await bedService.deleteBed(id);
    toast.success(response.data.msg || "Bed deleted successfully!");
    if (roomId) dispatch(fetchBedsByRoom(roomId));
    dispatch(fetchAllBeds());
    dispatch(/** @type {any} */ (fetchRoomsData())); // Refresh rooms to update bed counts
    return id;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to delete bed.");
    return rejectWithValue(errorData);
  }
});

/** @type {any} */
export const changeBedStatus = createAsyncThunk("bed/changeStatus", async (/** @type {{id: string, statusData: any, roomId?: string}} */ arg, { dispatch, rejectWithValue }) => {
  const { id, statusData, roomId } = arg;
  try {
    const response = await bedService.changeBedStatus(id, statusData);
    toast.success(response.data.msg || "Bed status updated!");
    if (roomId) dispatch(fetchBedsByRoom(roomId));
    dispatch(fetchAllBeds());
    dispatch(/** @type {any} */ (fetchRoomsData())); // Refresh rooms to update bed counts
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to change bed status.");
    return rejectWithValue(errorData);
  }
});

/** @type {any} */
export const assignUserToBed = createAsyncThunk("bed/assignUser", async (/** @type {{id: string, userData: any, roomId?: string}} */ arg, { dispatch, rejectWithValue }) => {
  const { id, userData, roomId } = arg;
  try {
    const response = await bedService.assignUserToBed(id, userData);
    toast.success(response.data.msg || "User assigned to bed!");
    if (roomId) dispatch(fetchBedsByRoom(roomId));
    dispatch(fetchAllBeds());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to assign user.");
    return rejectWithValue(errorData);
  }
});

/** @type {any} */
export const unassignUserFromBed = createAsyncThunk("bed/unassignUser", async (/** @type {{id: string, roomId?: string}} */ arg, { dispatch, rejectWithValue }) => {
  const { id, roomId } = arg;
  try {
    const response = await bedService.unassignUserFromBed(id);
    toast.success(response.data.msg || "User unassigned from bed!");
    if (roomId) dispatch(fetchBedsByRoom(roomId));
    dispatch(fetchAllBeds());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to unassign user.");
    return rejectWithValue(errorData);
  }
});

const bedSlice = createSlice({
  name: "bed",
  initialState,
  reducers: {
    clearRoomBeds: (state) => {
      state.roomBeds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBeds.fulfilled, (state, action) => {
        state.beds = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchBedsByRoom.fulfilled, (state, action) => {
        state.roomBeds = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchBedSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
        state.status = "succeeded";
      })
      // Global Loading/Error handling using matchers
      .addMatcher(
        (action) => action.type.startsWith("bed/") && action.type.endsWith("/pending"),
        (state) => {
          state.status = "loading";
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("bed/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.status = "failed";
          state.error = (action.payload && typeof action.payload === 'object' && 'msg' in action.payload) 
            ? action.payload.msg 
            : "An error occurred";
        }
      );
  },
});

export const { clearRoomBeds } = bedSlice.actions;

/** @param {any} state */
export const selectAllBeds = (state) => state.bed.beds;
/** @param {any} state */
export const selectRoomBeds = (state) => state.bed.roomBeds;
/** @param {any} state */
export const selectBedSummary = (state) => state.bed.summary;
/** @param {any} state */
export const selectBedStatus = (state) => state.bed.status;
/** @param {any} state */
export const selectBedError = (state) => state.bed.error;

export default bedSlice.reducer;
