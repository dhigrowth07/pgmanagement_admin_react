import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as paymentService from "../../services/paymentService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  payments: [],
  statistics: {},
  transactions: [],
  status: "idle",
  error: null,
};

export const fetchPayments = createAsyncThunk("payment/fetchPayments", async (params, { rejectWithValue }) => {
  try {
    // Use the combined endpoint that shows total EB amount (like Rent)
    const response = await paymentService.getAllPaymentsWithTotalEB(params);
    // Ensure we return an array even if the API returns undefined
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchStatistics = createAsyncThunk("payment/fetchStatistics", async (_, { rejectWithValue }) => {
  try {
    const response = await paymentService.getPaymentStatistics();
    // Ensure we return an object even if the API returns undefined
    return response.data.data || {};
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const createNewPayment = createAsyncThunk("payment/create", async (data, { dispatch, rejectWithValue }) => {
  try {
    const response = await paymentService.createPayment(data);
    toast.success(response.data.msg || "Payment created successfully!");
    dispatch(fetchPayments());
    dispatch(fetchStatistics());
    return response.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to create payment.");
    return rejectWithValue(err);
  }
});

export const processPayment = createAsyncThunk("payment/process", async ({ type, paymentId, data }, { dispatch, rejectWithValue }) => {
  try {
    // "full" uses full payment endpoint, "initial" uses partial payment endpoint
    const response = type === "full" 
      ? await paymentService.processFullPayment(paymentId, data) 
      : await paymentService.processPartialPayment(paymentId, data);
    toast.success(response.data.msg || "Payment processed successfully!");
    dispatch(fetchPayments());
    dispatch(fetchStatistics());
    return response.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to process payment.");
    return rejectWithValue(err);
  }
});

export const removePayment = createAsyncThunk("payment/delete", async (paymentId, { dispatch, rejectWithValue }) => {
  try {
    await paymentService.deletePayment(paymentId);
    toast.success("Payment deleted successfully!");
    dispatch(fetchPayments());
    dispatch(fetchStatistics());
    return paymentId;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to delete payment.");
    return rejectWithValue(err);
  }
});

export const generatePayments = createAsyncThunk("payment/generate", async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await paymentService.generateMonthlyPayments();
    const { created, updated } = response.data.data;
    toast.success(`Generated ${created} new payments and updated ${updated}.`);
    dispatch(fetchPayments());
    dispatch(fetchStatistics());
    return response.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Payment generation failed.");
    return rejectWithValue(err);
  }
});

export const fetchTransactions = createAsyncThunk("payment/fetchTransactions", async (paymentId, { rejectWithValue }) => {
  try {
    const response = await paymentService.getTransactionsForPayment(paymentId);
    // Ensure we return an array even if the API returns undefined
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearTransactions: (state) => {
      state.transactions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      .addCase(fetchTransactions.pending, (state) => {
        state.status = "loading_transactions";
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state) => {
        state.status = "failed";
        state.transactions = [];
      })
      .addMatcher(
        (action) => action.type.endsWith("/pending") && action.type.startsWith("payment/"),
        (state) => {
          state.status = "loading_action";
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled") && action.type.startsWith("payment/"),
        (state) => {
          state.status = "succeeded";
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected") && action.type.startsWith("payment/"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload?.msg;
        }
      );
  },
});

export const { clearTransactions } = paymentSlice.actions;

export const selectPayments = (state) => state.payment.payments;
export const selectPaymentStatistics = (state) => state.payment.statistics;
export const selectTransactions = (state) => state.payment.transactions;
export const selectPaymentStatus = (state) => state.payment.status;

export default paymentSlice.reducer;
