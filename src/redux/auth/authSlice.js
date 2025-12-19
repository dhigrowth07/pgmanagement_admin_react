import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../../services/authService";
import { handleApiError } from "../../utils/APIErrorHandler";
import toast from "react-hot-toast";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
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
    toast.error(errorMsg);
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
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
      });
  },
});

export const { logout, tokenRefreshed, setAuthStatus } = authSlice.actions;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin = (state) => state.auth.isAdmin;
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
