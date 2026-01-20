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
  /** @type {any} */
  bulkImportResult: null,
};

export const fetchAllCustomers = createAsyncThunk("customer/fetchAll", async (/** @type {any} */ _, { rejectWithValue }) => {
  try {
    const response = await customerService.getAllCustomers();
    // Ensure we return an array even if the API returns undefined
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const fetchPendingUsers = createAsyncThunk("customer/fetchPending", async (/** @type {any} */ _, { rejectWithValue }) => {
  try {
    const response = await customerService.getPendingUsers();
    // Ensure we return an array even if the API returns undefined
    return response.data.data || [];
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const addNewCustomer = createAsyncThunk("customer/addNew", async (/** @type {any} */ customerData, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.createCustomer(customerData);
    const customerId = response.data?.data?.user?.customer_id;
    const successMessage = customerId
      ? `${response.data.msg || "Customer created successfully!"} Customer ID: ${customerId}`
      : response.data.msg || "Customer created successfully!";
    toast.success(successMessage);
    dispatch(fetchAllCustomers(null));
    return response.data.data.user;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to create customer.");
    return rejectWithValue(errorData);
  }
});

export const updateCustomer = createAsyncThunk("customer/update", async (/** @type {any} */ { userId, customerData }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.updateCustomer({ userId, customerData });
    toast.success(response.data.msg || "Customer updated successfully!");
    dispatch(fetchAllCustomers(null));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update customer.");
    return rejectWithValue(errorData);
  }
});

export const deleteCustomer = createAsyncThunk("customer/delete", async (/** @type {string} */ userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.deleteCustomer(userId);
    toast.success(response.data.msg || "Customer deleted successfully!");
    dispatch(fetchAllCustomers(null));
    return userId;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to delete customer.");
    return rejectWithValue(errorData);
  }
});

export const updateUserTariff = createAsyncThunk("customer/updateTariff", async (/** @type {any} */ { userId, tariffId }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.updateUserTariff(userId, tariffId);
    toast.success(response.data.msg || "Tariff updated successfully!");
    dispatch(fetchAllCustomers(null));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update tariff.");
    return rejectWithValue(errorData);
  }
});

export const removeUserFromRoom = createAsyncThunk("customer/removeFromRoom", async (/** @type {string} */ userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.removeUserFromRoom(userId);
    toast.success(response.data.msg || "User removed from room.");
    dispatch(fetchAllCustomers(null));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to remove user from room.");
    return rejectWithValue(errorData);
  }
});

export const changeRoomCustomer = createAsyncThunk("customer/changeRoom", async (/** @type {any} */ { userId, roomId, bedId }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.changeRoomCustomer(userId, roomId, bedId);
    toast.success(response.data.msg || "Room changed successfully!");
    dispatch(fetchAllCustomers(null));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to change room.");
    return rejectWithValue(errorData);
  }
});

export const vacateUserRoom = createAsyncThunk("customer/vacateRoom", async (/** @type {any} */ { userId, vacatingDate = null }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.vacateUserRoom(userId, vacatingDate);
    toast.success(response.data.msg || "User scheduled to vacate successfully.");
    dispatch(fetchAllCustomers(null));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to vacate user room.");
    return rejectWithValue(errorData);
  }
});

export const cancelVacation = createAsyncThunk("customer/cancelVacation", async (/** @type {string} */ userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.cancelVacation(userId);
    toast.success(response.data.msg || "Vacation cancelled successfully.");
    dispatch(fetchAllCustomers(undefined));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to cancel vacation.");
    return rejectWithValue(errorData);
  }
});

export const changeCustomerPassword = createAsyncThunk("customer/changePassword", async (/** @type {any} */ { userId, newPassword }, { rejectWithValue }) => {
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

export const bulkImportCustomers = createAsyncThunk("customer/bulkImport", async (/** @type {any[]} */ users, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.bulkImportUsers(users);
    const { successful, failed } = response.data;
    toast.success(`Import complete: ${successful.length} succeeded, ${failed.length} failed.`);
    if (successful.length > 0) {
      dispatch(fetchAllCustomers(null));
    }
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Bulk import failed.");
    return rejectWithValue(errorData);
  }
});

export const adminUpdateCustomerProfileThunk = createAsyncThunk("customers/adminUpdateCustomerProfile", async (/** @type {any} */ { userId, formData }, { dispatch, rejectWithValue }) => {
  try {
    // Use api instance (already imported) to ensure auth token and headers are added via interceptor
    const response = await api.put(`/api/v1/users/${userId}/update-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    dispatch(fetchAllCustomers(undefined));

    return response.data;
  } catch (/** @type {any} */ err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const collectAdvancePayment = createAsyncThunk("customer/collectAdvance", async (/** @type {any} */ { userId, amount }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.collectAdvancePayment(userId, { amount });
    toast.success(response.data.msg || "Advance collected successfully!");
    dispatch(fetchAllCustomers(undefined));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to collect advance.");
    return rejectWithValue(errorData);
  }
});

export const updateAdvancePayment = createAsyncThunk("customer/updateAdvance", async (/** @type {any} */ { userId, data }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.updateAdvancePayment(userId, data);
    toast.success(response.data.msg || "Advance updated successfully!");
    dispatch(fetchAllCustomers(undefined));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update advance.");
    return rejectWithValue(errorData);
  }
});

export const getAdvancePayment = createAsyncThunk("customer/getAdvance", async (/** @type {string} */ userId, { rejectWithValue }) => {
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

export const uploadProfileImage = createAsyncThunk("customer/uploadProfileImage", async (/** @type {any} */ { userId, file }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.uploadUserProfileImage(userId, file);
    toast.success(response.data.msg || "Profile image uploaded successfully!");
    dispatch(fetchAllCustomers(undefined));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to upload profile image.");
    return rejectWithValue(errorData);
  }
});

export const deleteProfileImage = createAsyncThunk("customer/deleteProfileImage", async (/** @type {string} */ userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.deleteUserProfileImage(userId);
    toast.success(response.data.msg || "Profile image deleted successfully!");
    dispatch(fetchAllCustomers(undefined));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to delete profile image.");
    return rejectWithValue(errorData);
  }
});

export const activateCustomer = createAsyncThunk("customer/activate", async (/** @type {string} */ userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.activateUser(userId);
    toast.success(response.data.msg || "User activated successfully!");
    dispatch(fetchAllCustomers(undefined));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to activate user.");
    return rejectWithValue(errorData);
  }
});

export const rejectCustomer = createAsyncThunk("customer/reject", async (/** @type {string} */ userId, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.rejectUser(userId);
    toast.success(response.data.msg || "User registration rejected successfully!");
    dispatch(fetchAllCustomers(undefined));
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to reject user.");
    return rejectWithValue(errorData);
  }
});

export const updateCustomerId = createAsyncThunk("customer/updateCustomerId", async (/** @type {any} */ { userId, customerId }, { dispatch, rejectWithValue }) => {
  try {
    const response = await customerService.updateCustomerId(userId, customerId);
    toast.success(response.data.msg || "Customer ID updated successfully!");
    dispatch(fetchAllCustomers());
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update customer ID.");
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
        state.error = (/** @type {any} */ (action.payload)).msg;
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
        state.error = (/** @type {any} */ (action.payload))?.msg;
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
        state.error = (/** @type {any} */ (action.payload))?.msg;
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
        state.error = (/** @type {any} */ (action.payload))?.msg || (/** @type {any} */ (action.payload))?.message || "Failed to update profile";
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
          state.error = (/** @type {any} */ (action.payload))?.msg;
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
export const selectAllCustomers = (/** @type {any} */ state) => state.customer.customers;
export const selectPendingUsers = (/** @type {any} */ state) => state.customer.pendingUsers;
export const selectCustomerStatus = (/** @type {any} */ state) => state.customer.status;
export const selectCustomerError = (/** @type {any} */ state) => state.customer.error;
export const selectBulkImportResult = (/** @type {any} */ state) => state.customer.bulkImportResult;
export default customerSlice.reducer;
