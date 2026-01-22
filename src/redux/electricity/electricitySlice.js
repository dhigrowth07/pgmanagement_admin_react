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
  draftBills: [],
  finalizedBills: [],
  billShares: [],
  editHistory: [],
  editStatistics: {},
  myRecentEdits: [],
  billEditHistory: [],
  activeUsers: [],
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

export const deleteAllBills = createAsyncThunk("electricity/deleteAllBills", async (_, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.deleteAllBills();
    toast.success(res.data.msg || "All bills deleted successfully");
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to delete all bills");
    return rejectWithValue(err);
  }
});

// Draft Status
export const fetchDraftBills = createAsyncThunk("electricity/fetchDraftBills", async (_, { rejectWithValue }) => {
  try {
    const res = await electricityService.getDraftBills();
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchFinalizedBills = createAsyncThunk("electricity/fetchFinalizedBills", async (_, { rejectWithValue }) => {
  try {
    const res = await electricityService.getFinalizedBills();
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const finalizeBill = createAsyncThunk("electricity/finalizeBill", async (id, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.finalizeBill(id);
    toast.success(res.data.msg || "Bill finalized successfully");
    dispatch(fetchBills());
    dispatch(fetchDraftBills());
    dispatch(fetchFinalizedBills());
    dispatch(fetchStatistics());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to finalize bill");
    return rejectWithValue(err);
  }
});

export const unfinalizeBill = createAsyncThunk("electricity/unfinalizeBill", async (id, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.unfinalizeBill(id);
    toast.success(res.data.msg || "Bill reverted to draft");
    dispatch(fetchBills());
    dispatch(fetchDraftBills());
    dispatch(fetchFinalizedBills());
    dispatch(fetchStatistics());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to unfinalize bill");
    return rejectWithValue(err);
  }
});

export const finalizeAllDraftBills = createAsyncThunk("electricity/finalizeAllDraftBills", async (_, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.finalizeAllDraftBills();
    toast.success(res.data.msg || "All draft bills finalized successfully");
    dispatch(fetchBills());
    dispatch(fetchDraftBills());
    dispatch(fetchFinalizedBills());
    dispatch(fetchStatistics());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to finalize all draft bills");
    return rejectWithValue(err);
  }
});

// Manual Override (Shares)
export const fetchBillShares = createAsyncThunk("electricity/fetchBillShares", async (billId, { rejectWithValue }) => {
  try {
    const res = await electricityService.getBillShares(billId);
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const addUserToBill = createAsyncThunk("electricity/addUserToBill", async ({ billId, data }, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.addUserToBill(billId, data);
    toast.success(res.data.msg || "User added to bill successfully");
    dispatch(fetchBillShares(billId));
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to add user to bill");
    return rejectWithValue(err);
  }
});

export const updateShareManually = createAsyncThunk("electricity/updateShareManually", async ({ billId, shareId, data }, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.updateShareManually(billId, shareId, data);
    toast.success(res.data.msg || "Share updated successfully");
    dispatch(fetchBillShares(billId));
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to update share");
    return rejectWithValue(err);
  }
});

export const removeUserFromBill = createAsyncThunk("electricity/removeUserFromBill", async ({ billId, shareId }, { dispatch, rejectWithValue }) => {
  try {
    const res = await electricityService.removeUserFromBill(billId, shareId);
    toast.success(res.data.msg || "User removed from bill successfully");
    dispatch(fetchBillShares(billId));
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
    return res.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to remove user from bill");
    return rejectWithValue(err);
  }
});

// Audit & History
export const fetchAllEditHistory = createAsyncThunk("electricity/fetchAllEditHistory", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await electricityService.getAllEditHistory(params);
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchEditStatistics = createAsyncThunk("electricity/fetchEditStatistics", async (_, { rejectWithValue }) => {
  try {
    const res = await electricityService.getEditStatistics();
    return res.data.data || {};
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchMyRecentEdits = createAsyncThunk("electricity/fetchMyRecentEdits", async (params = {}, { rejectWithValue }) => {
  try {
    const res = await electricityService.getMyRecentEdits(params);
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchBillEditHistory = createAsyncThunk("electricity/fetchBillEditHistory", async (billId, { rejectWithValue }) => {
  try {
    const res = await electricityService.getBillEditHistory(billId);
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
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
    // Show detailed error message including hint if available
    const errorMessage = err.hint ? `${err.msg} ${err.hint}` : (err.msg || "Failed to mark share as paid");
    toast.error(errorMessage, { duration: 5000 }); // Show for 5 seconds
    return rejectWithValue(err);
  }
});

// Active Users
export const fetchActiveUsers = createAsyncThunk("electricity/fetchActiveUsers", async (_, { rejectWithValue }) => {
  try {
    const res = await electricityService.getActiveUsers();
    return res.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
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

      // Draft Status
      .addCase(fetchDraftBills.fulfilled, (state, action) => {
        state.draftBills = action.payload;
      })
      .addCase(fetchFinalizedBills.fulfilled, (state, action) => {
        state.finalizedBills = action.payload;
      })

      // Manual Override (Shares)
      .addCase(fetchBillShares.fulfilled, (state, action) => {
        state.billShares = [...(action.payload.shares || [])];
      })
      .addCase(fetchBillShares.rejected, (state, action) => {
        // When fetching bill shares fails (e.g., 404 "No shares found"), set to empty array
        state.billShares = [];
      })

      // Audit & History
      .addCase(fetchAllEditHistory.fulfilled, (state, action) => {
        state.editHistory = action.payload;
      })
      .addCase(fetchEditStatistics.fulfilled, (state, action) => {
        state.editStatistics = action.payload;
      })
      .addCase(fetchMyRecentEdits.fulfilled, (state, action) => {
        state.myRecentEdits = action.payload;
      })
      .addCase(fetchBillEditHistory.fulfilled, (state, action) => {
        state.billEditHistory = action.payload;
      })

      .addCase(fetchUnpaidShares.pending, (state, action) => {
        state.unpaidRequestId = action.meta.requestId;
      })
      .addCase(fetchUnpaidShares.fulfilled, (state, action) => {
        // Always update unpaidShares when fetch succeeds, regardless of requestId
        // This ensures updates from manual share editing are reflected immediately
        state.unpaidShares = action.payload;
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

      // Active Users
      .addCase(fetchActiveUsers.fulfilled, (state, action) => {
        state.activeUsers = action.payload;
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

// Draft Status
export const selectDraftBills = (state) => state.electricity.draftBills;
export const selectFinalizedBills = (state) => state.electricity.finalizedBills;

// Manual Override (Shares)
export const selectBillShares = (state) => state.electricity.billShares;
export const selectActiveUsers = (state) => state.electricity.activeUsers;

// Audit & History
export const selectEditHistory = (state) => state.electricity.editHistory;
export const selectEditStatistics = (state) => state.electricity.editStatistics;
export const selectMyRecentEdits = (state) => state.electricity.myRecentEdits;
export const selectBillEditHistory = (state) => state.electricity.billEditHistory;

export default electricitySlice.reducer;
