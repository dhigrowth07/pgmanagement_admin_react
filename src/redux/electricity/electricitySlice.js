import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as electricityService from "../../services/electricityService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  bills: [],
  selectedBill: null,
  unpaidShares: [],
  unpaidRequestId: null,
  statistics: {},
  userBills: [],
  userHistory: { history: [], total_paid: "0.00" },
  status: "idle",
  error: null,
};

// Admin
export const fetchBills = createAsyncThunk("electricity/fetchBills", async (params, { rejectWithValue }) => {
  try {
    const res = await electricityService.getBills(params);
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchBillById = createAsyncThunk("electricity/fetchBillById", async (id, { rejectWithValue }) => {
  try {
    const res = await electricityService.getBillById(id);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const createBill = createAsyncThunk("electricity/createBill", async (data, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.createBill(data);
    toast.success(res.data.msg || "Bill created successfully");
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    // Ensure Unpaid Shares section reflects the new bill immediately
    dispatch(fetchUnpaidShares());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to create bill");
    return rejectWithValue(err);
  }
});

export const updateBill = createAsyncThunk("electricity/updateBill", async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.updateBill(id, data);
    toast.success(res.data.msg || "Bill updated");
    dispatch(fetchBills());
    dispatch(fetchBillById(id));
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to update bill");
    return rejectWithValue(err);
  }
});

export const deleteBill = createAsyncThunk("electricity/deleteBill", async (id, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.deleteBill(id);
    toast.success(res.data.msg || "Bill deleted");
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
    return id;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to delete bill");
    return rejectWithValue(err);
  }
});

export const fetchUnpaidShares = createAsyncThunk("electricity/fetchUnpaidShares", async (_, { rejectWithValue }) => {
  try {
    const res = await electricityService.getUnpaidShares();
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchStatistics = createAsyncThunk("electricity/fetchStatistics", async (_, { rejectWithValue }) => {
  try {
    const res = await electricityService.getStatistics();
    return res.data.data || {};
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const markShareAsPaid = createAsyncThunk("electricity/markShareAsPaid", async (shareId, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.markSharePaid(shareId);
    toast.success(res.data.msg || "Share marked as paid");
    dispatch(fetchUnpaidShares());
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to mark share as paid");
    return rejectWithValue(err);
  }
});

// User
export const fetchUserBills = createAsyncThunk("electricity/fetchUserBills", async (userId, { rejectWithValue }) => {
  try {
    const res = await electricityService.getUserBills(userId);
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchUserPaymentHistory = createAsyncThunk("electricity/fetchUserPaymentHistory", async (userId, { rejectWithValue }) => {
  try {
    const res = await electricityService.getUserPaymentHistory(userId);
    return res.data.data || { history: [], total_paid: "0.00" };
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

const electricitySlice = createSlice({
  name: "electricity",
  initialState,
  reducers: {
    clearSelectedBill: (state) => {
      state.selectedBill = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bills = action.payload;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })

      .addCase(fetchBillById.fulfilled, (state, action) => {
        state.selectedBill = action.payload;
      })

      .addCase(fetchUnpaidShares.pending, (state, action) => {
        state.unpaidRequestId = action.meta.requestId;
      })
      .addCase(fetchUnpaidShares.fulfilled, (state, action) => {
        if (state.unpaidRequestId === action.meta.requestId) {
          state.unpaidShares = action.payload;
        }
      })
      .addCase(fetchUnpaidShares.rejected, (state, action) => {
        if (state.unpaidRequestId === action.meta.requestId) {
          // keep existing unpaidShares on error
        }
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })

      .addCase(fetchUserBills.fulfilled, (state, action) => {
        state.userBills = action.payload;
      })
      .addCase(fetchUserPaymentHistory.fulfilled, (state, action) => {
        state.userHistory = action.payload;
      })

      .addMatcher(
        (action) => action.type.startsWith("electricity/") && action.type.endsWith("/pending"),
        (state) => {
          state.status = "loading_action";
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("electricity/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.status = "succeeded";
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("electricity/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload?.msg;
        }
      );
  },
});

export const { clearSelectedBill } = electricitySlice.actions;

export const selectBills = (state) => state.electricity.bills;
export const selectSelectedBill = (state) => state.electricity.selectedBill;
export const selectUnpaidShares = (state) => state.electricity.unpaidShares;
export const selectStatistics = (state) => state.electricity.statistics;
export const selectUserBills = (state) => state.electricity.userBills;
export const selectUserHistory = (state) => state.electricity.userHistory;
export const selectElectricityStatus = (state) => state.electricity.status;

export default electricitySlice.reducer;
