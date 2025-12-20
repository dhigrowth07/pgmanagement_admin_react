import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as expenseService from "../../services/expenseService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  expenses: [],
  categories: [],
  summary: {},
  filters: {},
  meta: {},
  status: "idle",
  error: null,
};

// Expense thunks
export const fetchExpenses = createAsyncThunk("expense/fetchExpenses", async (filters = {}, { rejectWithValue }) => {
  try {
    const response = await expenseService.getAllExpenses(filters);
    return {
      expenses: response.data.data || [],
      meta: response.data.meta || {},
    };
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchExpenseById = createAsyncThunk("expense/fetchExpenseById", async (id, { rejectWithValue }) => {
  try {
    const response = await expenseService.getExpenseById(id);
    return response.data.data || null;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const createExpense = createAsyncThunk("expense/create", async (data, { dispatch, getState, rejectWithValue }) => {
  try {
    // If data is FormData, send it directly (amount_cents is already in FormData)
    // Otherwise, convert amount to amount_cents for JSON payload
    let payload = data;
    if (!(data instanceof FormData)) {
      payload = { ...data };
      if (payload.amount !== undefined && payload.amount_cents === undefined) {
        payload.amount_cents = Math.round(payload.amount * 100);
        delete payload.amount;
      }
    }

    const response = await expenseService.createExpense(payload);
    toast.success(response.data.msg || "Expense created successfully!");
    const currentFilters = getState().expense.filters || { page: 1, per_page: 25 };
    dispatch(fetchExpenses(currentFilters));
    return response.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to create expense.");
    return rejectWithValue(err);
  }
});

export const updateExpense = createAsyncThunk("expense/update", async ({ id, data }, { dispatch, getState, rejectWithValue }) => {
  try {
    // If data is FormData, send it directly (amount_cents is already in FormData)
    // Otherwise, convert amount to amount_cents for JSON payload
    let payload = data;
    if (!(data instanceof FormData)) {
      payload = { ...data };
      if (payload.amount !== undefined && payload.amount_cents === undefined) {
        payload.amount_cents = Math.round(payload.amount * 100);
        delete payload.amount;
      }
    }

    const response = await expenseService.updateExpense(id, payload);
    toast.success(response.data.msg || "Expense updated successfully!");
    const currentFilters = getState().expense.filters || { page: 1, per_page: 25 };
    dispatch(fetchExpenses(currentFilters));
    return response.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to update expense.");
    return rejectWithValue(err);
  }
});

export const deleteExpense = createAsyncThunk("expense/delete", async (id, { dispatch, getState, rejectWithValue }) => {
  try {
    await expenseService.deleteExpense(id);
    toast.success("Expense deleted successfully!");
    const currentFilters = getState().expense.filters || { page: 1, per_page: 25 };
    dispatch(fetchExpenses(currentFilters));
    return id;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to delete expense.");
    return rejectWithValue(err);
  }
});

export const fetchExpenseSummary = createAsyncThunk("expense/fetchSummary", async (filters = {}, { rejectWithValue }) => {
  try {
    const response = await expenseService.getExpenseSummary(filters);
    return response.data.data || {};
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

// Category thunks
export const fetchCategories = createAsyncThunk("expense/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    const response = await expenseService.getAllCategories();
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const createCategory = createAsyncThunk("expense/createCategory", async (data, { dispatch, rejectWithValue }) => {
  try {
    const response = await expenseService.createCategory(data);
    toast.success(response.data.msg || "Category created successfully!");
    dispatch(fetchCategories());
    return response.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to create category.");
    return rejectWithValue(err);
  }
});

export const updateCategory = createAsyncThunk("expense/updateCategory", async ({ id, data }, { dispatch, rejectWithValue }) => {
  try {
    const response = await expenseService.updateCategory(id, data);
    toast.success(response.data.msg || "Category updated successfully!");
    dispatch(fetchCategories());
    return response.data.data;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to update category.");
    return rejectWithValue(err);
  }
});

export const deleteCategory = createAsyncThunk("expense/deleteCategory", async (id, { dispatch, rejectWithValue }) => {
  try {
    await expenseService.deleteCategory(id);
    toast.success("Category deleted successfully!");
    dispatch(fetchCategories());
    return id;
  } catch (error) {
    const err = handleApiError(error);
    toast.error(err.msg || "Failed to delete category.");
    return rejectWithValue(err);
  }
});

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.expenses = action.payload.expenses;
        state.meta = action.payload.meta;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      .addCase(fetchExpenseById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchExpenseById.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(fetchExpenseById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      .addCase(fetchExpenseSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addMatcher(
        (action) => action.type.endsWith("/pending") && action.type.startsWith("expense/"),
        (state) => {
          if (state.status === "idle" || state.status === "succeeded" || state.status === "failed") {
            state.status = "loading_action";
          }
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled") && action.type.startsWith("expense/"),
        (state) => {
          state.status = "succeeded";
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected") && action.type.startsWith("expense/"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload?.msg || "An error occurred";
        }
      );
  },
});

export const { setFilters, clearFilters } = expenseSlice.actions;

export const selectExpenses = (state) => state.expense.expenses;
export const selectCategories = (state) => state.expense.categories;
export const selectExpenseSummary = (state) => state.expense.summary;
export const selectExpenseMeta = (state) => state.expense.meta;
export const selectExpenseStatus = (state) => state.expense.status;
export const selectExpenseError = (state) => state.expense.error;
export const selectExpenseFilters = (state) => state.expense.filters;

export default expenseSlice.reducer;
