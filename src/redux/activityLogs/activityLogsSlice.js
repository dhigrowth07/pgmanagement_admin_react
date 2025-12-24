import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as activityLogsService from "../../services/activityLogsService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  logs: [],
  selectedLog: null,
  statistics: null,
  filters: {
    user_type: undefined,
    user_id: undefined,
    activity_type: undefined,
    activity_category: undefined,
    start_date: undefined,
    end_date: undefined,
    limit: 50,
    offset: 0,
  },
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false,
  },
  status: "idle",
  error: null,
};

export const fetchActivityLogs = createAsyncThunk(
  "activityLogs/fetchActivityLogs",
  async (params, { rejectWithValue }) => {
    try {
      const response = await activityLogsService.getActivityLogs(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchActivityLogById = createAsyncThunk(
  "activityLogs/fetchActivityLogById",
  async (logId, { rejectWithValue }) => {
    try {
      const response = await activityLogsService.getActivityLogById(logId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchActivityStats = createAsyncThunk(
  "activityLogs/fetchActivityStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await activityLogsService.getActivityStats();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchUserActivityLogs = createAsyncThunk(
  "activityLogs/fetchUserActivityLogs",
  async ({ userId, params }, { rejectWithValue }) => {
    try {
      const response = await activityLogsService.getUserActivityLogs(userId, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteAllActivityLogs = createAsyncThunk(
  "activityLogs/deleteAllActivityLogs",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await activityLogsService.deleteAllActivityLogs();
      toast.success(response.data.msg || "All activity logs deleted successfully");
      // Refresh logs and stats after deletion
      dispatch(fetchActivityLogs({ limit: 50, offset: 0 }));
      dispatch(fetchActivityStats());
      return response.data;
    } catch (error) {
      const err = handleApiError(error);
      toast.error(err.msg || "Failed to delete activity logs");
      return rejectWithValue(err);
    }
  }
);

const activityLogsSlice = createSlice({
  name: "activityLogs",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedLog: (state, action) => {
      state.selectedLog = action.payload;
    },
    clearSelectedLog: (state) => {
      state.selectedLog = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.logs = action.payload.data?.logs || [];
        state.pagination = action.payload.data?.pagination || initialState.pagination;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg || "Failed to fetch activity logs";
        toast.error(state.error);
      })
      .addCase(fetchActivityLogById.fulfilled, (state, action) => {
        state.selectedLog = action.payload;
      })
      .addCase(fetchActivityStats.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setSelectedLog, clearSelectedLog } = activityLogsSlice.actions;

export const selectActivityLogs = (state) => state.activityLogs.logs;
export const selectSelectedLog = (state) => state.activityLogs.selectedLog;
export const selectActivityLogsStatus = (state) => state.activityLogs.status;
export const selectActivityLogsError = (state) => state.activityLogs.error;
export const selectActivityLogsFilters = (state) => state.activityLogs.filters;
export const selectActivityLogsPagination = (state) => state.activityLogs.pagination;
export const selectActivityLogsStatistics = (state) => state.activityLogs.statistics;

export default activityLogsSlice.reducer;

