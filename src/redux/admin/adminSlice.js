import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as tenantAdminsService from "../../services/tenantAdminsService";
import { handleApiError } from "../../utils/APIErrorHandler";

const initialState = {
  admins: [],
  status: "idle",
  error: null,
};

export const fetchAllAdmins = createAsyncThunk("admin/fetchAllAdmins", async (tenantId, { rejectWithValue }) => {
  try {
    const response = await tenantAdminsService.getAllAdmins(tenantId);
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    return rejectWithValue(errorData.msg || "Failed to fetch admins");
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdmins: (state) => {
      state.admins = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAdmins.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAllAdmins.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admins = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchAllAdmins.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.admins = [];
      });
  },
});

export const { clearAdmins } = adminSlice.actions;

export const selectAllAdmins = (state) => state.admin.admins;
export const selectAdminStatus = (state) => state.admin.status;
export const selectAdminError = (state) => state.admin.error;

export default adminSlice.reducer;

