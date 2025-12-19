import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as roomService from "../../services/roomService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  rooms: [],
  blocks: [],
  presets: [],
  tariffs: [],
  status: "idle",
  error: null,
};

// --- Thunks ---
export const fetchRoomsData = createAsyncThunk("room/fetchData", async (_, { rejectWithValue }) => {
  try {
    const [roomsRes, blocksRes, presetsRes, tariffsRes] = await Promise.all([roomService.getAllRooms(), roomService.getAllBlocks(), roomService.getAllRoomPresets(), roomService.getAllTariffs()]);
    return {
      rooms: roomsRes.data.data || [],
      blocks: blocksRes.data.data || [],
      presets: presetsRes.data.data || [],
      tariffs: tariffsRes.data.data || [],
    };
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const addBlock = createAsyncThunk("room/addBlock", async (blockData, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.createBlock(blockData);
    toast.success(response.data.msg || "Block created successfully!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to create block.");
    return rejectWithValue(errorData);
  }
});

export const updateBlock = createAsyncThunk("room/updateBlock", async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.updateBlock(id, data);
    toast.success(response.data.msg || "Block updated successfully!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update block.");
    return rejectWithValue(errorData);
  }
});

export const deleteBlock = createAsyncThunk("room/deleteBlock", async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.deleteBlock(id);
    toast.success(response.data.msg || "Block deleted successfully!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Block has rooms, cannot delete.");
    return rejectWithValue(errorData);
  }
});

export const addRoom = createAsyncThunk("room/addRoom", async (roomData, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.createRoom(roomData);
    toast.success(response.data.msg || "Room created successfully!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to create room.");
    return rejectWithValue(errorData);
  }
});

export const updateRoom = createAsyncThunk("room/updateRoom", async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.updateRoom(id, data);
    toast.success(response.data.msg || "Room updated successfully!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update room.");
    return rejectWithValue(errorData);
  }
});

export const deleteRoom = createAsyncThunk("room/deleteRoom", async (id, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.deleteRoom(id);
    toast.success(response.data.msg || "Room deleted successfully!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to delete room.");
    return rejectWithValue(errorData);
  }
});

// Tariff Thunks
export const addTariff = createAsyncThunk("room/addTariff", async (data, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.createTariff(data);
    toast.success(response.data.msg || "Tariff created!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});
export const updateTariff = createAsyncThunk("room/updateTariff", async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.updateTariff(id, data);
    toast.success(response.data.msg || "Tariff updated!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});
export const deleteTariff = createAsyncThunk("room/deleteTariff", async (id, { dispatch, rejectWithValue }) => {
  try {
    await roomService.deleteTariff(id);
    toast.success("Tariff deleted!");
    dispatch(fetchRoomsData());
    return id;
  } catch (err) {
    toast.error("Tariff is in use by a Room Preset and cannot be deleted.");
    return rejectWithValue(handleApiError(err));
  }
});

// Room Preset Thunks
export const addRoomPreset = createAsyncThunk("room/addRoomPreset", async (data, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.createRoomPreset(data);
    toast.success(response.data.msg || "Room Preset created!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});
export const updateRoomPreset = createAsyncThunk("room/updateRoomPreset", async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const response = await roomService.updateRoomPreset(id, data);
    toast.success(response.data.msg || "Room Preset updated!");
    dispatch(fetchRoomsData());
    return response.data.data;
  } catch (err) {
    return rejectWithValue(handleApiError(err));
  }
});
export const deleteRoomPreset = createAsyncThunk("room/deleteRoomPreset", async (id, { dispatch, rejectWithValue }) => {
  try {
    await roomService.deleteRoomPreset(id);
    toast.success("Room Preset deleted!");
    dispatch(fetchRoomsData());
    return id;
  } catch (err) {
    toast.error("Preset is in use by a Room and cannot be deleted.");
    return rejectWithValue(handleApiError(err));
  }
});

// Google Review
export const updateBlockGoogleReview = createAsyncThunk("room/updateGoogleReview", async ({ blockId, google_review_link }, { dispatch, rejectWithValue }) => {
  try {
    const res = await roomService.updateGoogleReviewLink(blockId, { google_review_link });
    toast.success(res.data.msg || "Review link updated!");
    dispatch(fetchRoomsData());
    return res.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update review link.");
    return rejectWithValue(errorData);
  }
});

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomsData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRoomsData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.rooms = action.payload.rooms;
        state.blocks = action.payload.blocks;
        state.presets = action.payload.presets;
        state.tariffs = action.payload.tariffs;
      })
      .addCase(fetchRoomsData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.msg;
      })
      .addMatcher(
        (action) => action.type.startsWith("room/") && action.type.endsWith("/pending"),
        (state) => {
          state.status = "loading";
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("room/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload?.msg || "An error occurred";
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("room/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.status = "succeeded";
        }
      );
  },
});

export const selectAllRooms = (state) => state.room.rooms;
export const selectAllBlocks = (state) => state.room.blocks;
export const selectAllPresets = (state) => state.room.presets;
export const selectRoomStatus = (state) => state.room.status;
export const selectAllTariffs = (state) => state.room.tariffs;

export default roomSlice.reducer;
