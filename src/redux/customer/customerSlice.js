import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as customerService from "../../services/customerService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../../services/api";
import { API_URL } from "../../config/envConfig";

const initialState = {
  customers: [],
  pendingUsers: [],
  status: "idle",
  error: null,
  bulkImportResult: null,
};

export const fetchAllCustomers = createAsyncThunk("customer/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await customerService.getAllCustomers();
    // Ensure we return an array even if the API returns undefined
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchPendingUsers = createAsyncThunk("customer/fetchPending", async (_, { rejectWithValue }) => {
  try {
    const response = await customerService.getPendingUsers();
    // Ensure we return an array even if the API returns undefined
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const addNewCustomer = createAsyncThunk("customer/addNew", async (customerData, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.createCustomer(customerData);
    toast.success(response.data.msg || "Customer created successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data.user;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to create customer.");
    return rejectWithValue(errorData);
  }
});

export const updateCustomer = createAsyncThunk("customer/update", async ({ userId, customerData }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.updateCustomer({ userId, customerData });
    toast.success(response.data.msg || "Customer updated successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update customer.");
    return rejectWithValue(errorData);
  }
});

export const deleteCustomer = createAsyncThunk("customer/delete", async (userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.deleteCustomer(userId);
    toast.success(response.data.msg || "Customer deleted successfully!");
    dispatch(fetchAllCustomers());
    return userId;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to delete customer.");
    return rejectWithValue(errorData);
  }
});

export const updateUserTariff = createAsyncThunk("customer/updateTariff", async ({ userId, tariffId }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.updateUserTariff(userId, tariffId);
    toast.success(response.data.msg || "Tariff updated successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update tariff.");
    return rejectWithValue(errorData);
  }
});

export const removeUserFromRoom = createAsyncThunk("customer/removeFromRoom", async (userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.removeUserFromRoom(userId);
    toast.success(response.data.msg || "User removed from room.");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to remove user from room.");
    return rejectWithValue(errorData);
  }
});

export const changeRoomCustomer = createAsyncThunk("customer/changeRoom", async ({ userId, roomId }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.changeRoomCustomer(userId, roomId);
    toast.success(response.data.msg || "Room changed successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to change room.");
    return rejectWithValue(errorData);
  }
});

export const vacateUserRoom = createAsyncThunk("customer/vacateRoom", async (userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.vacateUserRoom(userId);
    toast.success(response.data.msg || "User scheduled to vacate at end of current month.");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to vacate user room.");
    return rejectWithValue(errorData);
  }
});

export const cancelVacation = createAsyncThunk("customer/cancelVacation", async (userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.cancelVacation(userId);
    toast.success(response.data.msg || "Vacation cancelled successfully.");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to cancel vacation.");
    return rejectWithValue(errorData);
  }
});

export const changeCustomerPassword = createAsyncThunk("customer/changePassword", async ({ userId, newPassword }, { rejectWithValue }) => {
  try {
    const response = await customerService.changePasswordForCustomer(userId, newPassword);
    toast.success(response.data.msg || "Password updated successfully!");
    return { userId };
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to change password.");
    return rejectWithValue(errorData);
  }
});

export const bulkImportCustomers = createAsyncThunk("customer/bulkImport", async (users, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.bulkImportUsers(users);
    const { successful, failed } = response.data;
    toast.success(`Import complete: ${successful.length} succeeded, ${failed.length} failed.`);
    if (successful.length > 0) {
      dispatch(fetchAllCustomers());
    }
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Bulk import failed.");
    return rejectWithValue(errorData);
  }
});

export const adminUpdateCustomerProfileThunk = createAsyncThunk("customers/adminUpdateCustomerProfile", async ({ userId, formData }, { dispatch, rejectWithValue }) => {
  try {
    // Use api instance (already imported) to ensure auth token and headers are added via interceptor
    const response = await api.put(`/api/v1/users/${userId}/update-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    dispatch(fetchAllCustomers());

    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const collectAdvancePayment = createAsyncThunk("customer/collectAdvance", async ({ userId, amount }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.collectAdvancePayment(userId, { amount });
    toast.success(response.data.msg || "Advance collected successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to collect advance.");
    return rejectWithValue(errorData);
  }
});

export const updateAdvancePayment = createAsyncThunk("customer/updateAdvance", async ({ userId, data }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.updateAdvancePayment(userId, data);
    toast.success(response.data.msg || "Advance updated successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update advance.");
    return rejectWithValue(errorData);
  }
});

export const getAdvancePayment = createAsyncThunk("customer/getAdvance", async (userId, { rejectWithValue }) => {
  try {
    const response = await customerService.getAdvancePayment(userId);
    console.log("response: ", response);
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to fetch advance.");
    return rejectWithValue(errorData);
  }
});

export const uploadProfileImage = createAsyncThunk("customer/uploadProfileImage", async ({ userId, file }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.uploadUserProfileImage(userId, file);
    toast.success(response.data.msg || "Profile image uploaded successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to upload profile image.");
    return rejectWithValue(errorData);
  }
});

export const deleteProfileImage = createAsyncThunk("customer/deleteProfileImage", async (userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.deleteUserProfileImage(userId);
    toast.success(response.data.msg || "Profile image deleted successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to delete profile image.");
    return rejectWithValue(errorData);
  }
});

export const activateCustomer = createAsyncThunk("customer/activate", async (userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.activateUser(userId);
    toast.success(response.data.msg || "User activated successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to activate user.");
    return rejectWithValue(errorData);
  }
});

export const rejectCustomer = createAsyncThunk("customer/reject", async (userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.rejectUser(userId);
    toast.success(response.data.msg || "User registration rejected successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to reject user.");
    return rejectWithValue(errorData);
  }
});

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    clearBulkImportResult: (state) => {
      state.bulkImportResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCustomers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.customers = action.payload;
        state.error = null;
      })
      .addCase(fetchAllCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload.msg;
      })
      .addCase(fetchPendingUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPendingUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pendingUsers = action.payload;
        state.error = null;
      })
      .addCase(fetchPendingUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      .addCase(bulkImportCustomers.pending, (state) => {
        state.status = "loading_action";
        state.bulkImportResult = null;
      })
      .addCase(bulkImportCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bulkImportResult = action.payload;
      })
      .addCase(bulkImportCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
        state.bulkImportResult = { successful: [], failed: [] };
      })
      .addCase(adminUpdateCustomerProfileThunk.pending, (state) => {
        state.status = "loading_action";
        state.error = null;
      })
      .addCase(adminUpdateCustomerProfileThunk.fulfilled, (state) => {
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(adminUpdateCustomerProfileThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg || action.payload?.message || "Failed to update profile";
      })

      .addMatcher(
        (action) => action.type.startsWith("customer/") && action.type.endsWith("/pending") && !action.type.includes("fetchAll") && !action.type.includes("bulkImport"),
        (state) => {
          state.status = "loading_action";
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("customer/") && action.type.endsWith("/rejected") && !action.type.includes("fetchAll") && !action.type.includes("bulkImport"),
        (state, action) => {
          state.status = "failed";
          state.error = action.payload?.msg;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("customer/") && action.type.endsWith("/fulfilled") && !action.type.includes("fetchAll") && !action.type.includes("bulkImport"),
        (state) => {
          state.status = "succeeded";
        }
      );
  },
});

export const { clearBulkImportResult } = customerSlice.actions;
export const selectAllCustomers = (state) => state.customer.customers;
export const selectPendingUsers = (state) => state.customer.pendingUsers;
export const selectCustomerStatus = (state) => state.customer.status;
export const selectCustomerError = (state) => state.customer.error;
export const selectBulkImportResult = (state) => state.customer.bulkImportResult;
export default customerSlice.reducer;
