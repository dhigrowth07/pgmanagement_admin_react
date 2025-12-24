import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as dashboardService from "../../services/dashboardService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  metrics: [],
  vacatingUsersCount: 0,
  vacatingUsers: [],
  status: "idle",
  error: null,
};

export const fetchDashboardMetrics = createAsyncThunk("dashboard/fetchDashboardMetrics", async (_, { rejectWithValue }) => {
  try {
    const response = await dashboardService.getDashboardMetrics();
    return (
      response.data.data || {
        metrics: [],
        vacating_users_count: 0,
        vacating_users: [],
      }
    );
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.metrics = [];
      state.vacatingUsersCount = 0;
      state.vacatingUsers = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.metrics = action.payload.metrics || [];
        state.vacatingUsersCount = action.payload.vacating_users_count || 0;
        state.vacatingUsers = action.payload.vacating_users || [];
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg || "Failed to fetch dashboard metrics";
        toast.error(state.error);
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;

export const selectDashboardMetrics = (state) => state.dashboard.metrics;
export const selectVacatingUsersCount = (state) => state.dashboard.vacatingUsersCount;
export const selectVacatingUsers = (state) => state.dashboard.vacatingUsers;
export const selectDashboardStatus = (state) => state.dashboard.status;
export const selectDashboardError = (state) => state.dashboard.error;

export default dashboardSlice.reducer;
