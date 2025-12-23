import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../../services/authService";
import * as tenantAdminsService from "../../services/tenantAdminsService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  isMainAdmin: false,
  switchedFrom: null,
  originalAdmin: null,
  status: "idle",
  error: null,
};

export const loginUser = createAsyncThunk("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    const errorMsg = errorData.msg || "Login failed";
    // Don't show toast here - let the component handle error display
    // This prevents duplicate toast messages
    return rejectWithValue(errorMsg);
  }
});

export const fetchUser = createAsyncThunk("auth/fetchUser", async (_, { rejectWithValue }) => {
  try {
    const response = await authService.fetchAdminProfile();
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.msg || "Failed to fetch user";
    return rejectWithValue(errorMsg);
  }
});

export const updateUserProfile = createAsyncThunk("auth/updateProfile", async (userData, { rejectWithValue }) => {
  try {
    const response = await authService.updateAdminProfile(userData);
    toast.success("Profile updated successfully!");
    return response.data.data;
  } catch (error) {
    const errorData = handleApiError(error);
    toast.error(errorData.msg || "Failed to update profile.");
    return rejectWithValue(errorData);
  }
});

export const refreshToken = createAsyncThunk("auth/refreshToken", async (_, { rejectWithValue }) => {
  try {
    const response = await authService.refreshToken();
    return response.data;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const switchToAdmin = createAsyncThunk("auth/switchToAdmin", async (adminId, { rejectWithValue }) => {
  try {
    const response = await authService.switchToAdmin(adminId);
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    const errorMsg = errorData.msg || "Failed to switch admin";
    toast.error(errorMsg);
    return rejectWithValue(errorMsg);
  }
});

export const switchBack = createAsyncThunk("auth/switchBack", async (_, { rejectWithValue }) => {
  try {
    const response = await authService.switchBack();
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    const errorMsg = errorData.msg || "Failed to switch back";
    toast.error(errorMsg);
    return rejectWithValue(errorMsg);
  }
});

export const checkMainAdmin = createAsyncThunk("auth/checkMainAdmin", async (_, { rejectWithValue }) => {
  try {
    const response = await tenantAdminsService.checkMainAdmin();
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    return rejectWithValue(errorData.msg || "Failed to check main admin status");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isMainAdmin = false;
      state.switchedFrom = null;
      state.originalAdmin = null;
      state.status = "idle";
      state.error = null;
      // Clear tenant_id from localStorage on logout
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("admin_id");
    },
    tokenRefreshed: (state, action) => {
      state.token = action.payload.token;
    },
    setAuthStatus: (state, action) => {
      state.status = action.payload ?? "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload?.data || {};
        const admin = payload.admin || null;

        // Persist identifiers for downstream API calls
        if (admin?.tenant_id) {
          localStorage.setItem("tenant_id", admin.tenant_id);
        }
        if (admin?.admin_id) {
          localStorage.setItem("admin_id", admin.admin_id);
        }

        state.user = {
          ...admin,
          feature_permissions: payload.feature_permissions,
          color_preferences: payload.color_preferences,
        };
        state.token = payload.token ?? null;
        state.isAuthenticated = !!payload.token;
        state.isAdmin = true;
        state.switchedFrom = payload.switched_from || null;
        // Note: originalAdmin is only set when switching, not on login
        // If logging in with a switched token, we don't have original admin data here
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.user = null;
        state.token = null;
      })
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.data;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.data.is_admin;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.user = null;
        state.token = null;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.msg;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.isAdmin = false;
        state.user = null;
        state.token = null;
      })
      .addCase(switchToAdmin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(switchToAdmin.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload?.data || {};
        const admin = payload.admin || null;

        // Store original admin before switching if not already stored
        if (!state.originalAdmin && state.user) {
          state.originalAdmin = { ...state.user };
        }

        // Update localStorage with new admin ID
        if (admin?.tenant_id) {
          localStorage.setItem("tenant_id", admin.tenant_id);
        }
        if (admin?.admin_id) {
          localStorage.setItem("admin_id", admin.admin_id);
        }

        state.user = {
          ...admin,
          feature_permissions: payload.feature_permissions,
          color_preferences: payload.color_preferences,
        };
        state.token = payload.token ?? null;
        state.isAuthenticated = !!payload.token;
        state.isAdmin = true;
        state.switchedFrom = payload.switched_from || null;
        // Reset isMainAdmin since we're now viewing as a different admin
        state.isMainAdmin = false;
        toast.success("Successfully switched to admin account");
      })
      .addCase(switchToAdmin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(switchBack.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(switchBack.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload?.data || {};
        const admin = payload.admin || null;

        // Update localStorage with original admin ID
        if (admin?.tenant_id) {
          localStorage.setItem("tenant_id", admin.tenant_id);
        }
        if (admin?.admin_id) {
          localStorage.setItem("admin_id", admin.admin_id);
        }

        state.user = {
          ...admin,
          feature_permissions: payload.feature_permissions,
          color_preferences: payload.color_preferences,
        };
        state.token = payload.token ?? null;
        state.isAuthenticated = !!payload.token;
        state.isAdmin = true;
        state.switchedFrom = null;
        state.originalAdmin = null;
        // Check main admin status again after switching back
        // Note: This will be checked by AdminManagementPage if user navigates there
        toast.success("Successfully switched back to original account");
      })
      .addCase(switchBack.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(checkMainAdmin.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkMainAdmin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isMainAdmin = action.payload?.data?.isMainAdmin || false;
      })
      .addCase(checkMainAdmin.rejected, (state) => {
        state.status = "failed";
        state.isMainAdmin = false;
      });
  },
});

export const { logout, tokenRefreshed, setAuthStatus } = authSlice.actions;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.isAdmin;
export const selectIsMainAdmin = (state) => state.auth.isMainAdmin;
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectSwitchedFrom = (state) => state.auth.switchedFrom;
export const selectOriginalAdmin = (state) => state.auth.originalAdmin;

export default authSlice.reducer;
