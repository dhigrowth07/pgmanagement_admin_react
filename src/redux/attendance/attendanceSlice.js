import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import attendanceService from "../../services/attendanceService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  records: [],
  pagination: {
    total: 0,
    limit: 30,
    offset: 0
  },
  config: null,
  statistics: null,
  monthlyReport: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Async Thunks
export const fetchAttendanceConfig = createAsyncThunk(
  "attendance/fetchConfig",
  async (_, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getConfig();
      return response.data.config;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const saveAttendanceConfig = createAsyncThunk(
  "attendance/saveConfig",
  async (configData, { dispatch, rejectWithValue }) => {
    try {
      const response = await attendanceService.saveConfig(configData);
      toast.success(response.msg || "Configuration saved successfully");
      dispatch(fetchAttendanceConfig());
      return response.data;
    } catch (error) {
      const errorData = handleApiError(error);
      toast.error(errorData.msg || "Failed to save configuration");
      return rejectWithValue(errorData);
    }
  }
);

export const fetchAllAttendanceRecords = createAsyncThunk(
  "attendance/fetchAllRecords",
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getAllRecords(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const overrideAttendance = createAsyncThunk(
  "attendance/override",
  async ({ id, overrideData, searchParams }, { dispatch, rejectWithValue }) => {
    try {
      const response = await attendanceService.overrideAttendance(id, overrideData);
      toast.success(response.msg || "Attendance overridden successfully");
      dispatch(fetchAllAttendanceRecords(searchParams));
      return response.data;
    } catch (error) {
      const errorData = handleApiError(error);
      toast.error(errorData.msg || "Failed to override attendance");
      return rejectWithValue(errorData);
    }
  }
);

export const fetchAttendanceStatistics = createAsyncThunk(
  "attendance/fetchStatistics",
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getStatistics(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchMonthlyAttendanceReport = createAsyncThunk(
  "attendance/fetchMonthlyReport",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const response = await attendanceService.getMonthlyReport(month, year);
      return response.data.users;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Config
      .addCase(fetchAttendanceConfig.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAttendanceConfig.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.config = action.payload;
      })
      .addCase(fetchAttendanceConfig.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      // Records
      .addCase(fetchAllAttendanceRecords.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllAttendanceRecords.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.records = action.payload.records;
        state.pagination = {
          total: action.payload.total || 0,
          limit: action.payload.limit || 10,
          offset: action.payload.offset || 0,
        };
      })
      .addCase(fetchAllAttendanceRecords.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      // Statistics
      .addCase(fetchAttendanceStatistics.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAttendanceStatistics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.statistics = action.payload;
      })
      .addCase(fetchAttendanceStatistics.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      // Monthly Report
      .addCase(fetchMonthlyAttendanceReport.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMonthlyAttendanceReport.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.monthlyReport = action.payload;
      })
      .addCase(fetchMonthlyAttendanceReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      });
  },
});

export const selectAttendanceRecords = (state) => state.attendance.records;
export const selectAttendancePagination = (state) => state.attendance.pagination;
export const selectAttendanceConfig = (state) => state.attendance.config;
export const selectAttendanceStatistics = (state) => state.attendance.statistics;
export const selectMonthlyAttendanceReport = (state) => state.attendance.monthlyReport;
export const selectAttendanceStatus = (state) => state.attendance.status;
export const selectAttendanceLoading = (state) => state.attendance.status === "loading";

export default attendanceSlice.reducer;
