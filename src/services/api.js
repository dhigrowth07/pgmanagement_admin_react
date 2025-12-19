import axios from "axios";
import { API_URL } from "../config/envConfig";
import { store } from "../redux/store";
import { logout, tokenRefreshed } from "../redux/auth/authSlice";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

api.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const isPublicEndpoint = url.includes("/users/signup-onboard") || url.includes("/rooms/public");

    // Attach auth token only for non-public endpoints
    if (!isPublicEndpoint) {
      const token = store.getState().auth.token;
      if (token) {
        config.headers["Authorization"] = `${token}`;
      }
    }

    // Add tenant_id and admin_id headers from localStorage if available
    const tenantId = localStorage.getItem("tenant_id");
    const adminId = localStorage.getItem("admin_id");

    if (tenantId && tenantId.trim()) {
      const trimmedTenantId = tenantId.trim();

      // Some proxies (e.g. nginx) drop headers with underscores.
      // Send BOTH "tenant-id" and "tenant_id" for maximum compatibility.
      config.headers["tenant-id"] = trimmedTenantId;
      config.headers["tenant_id"] = trimmedTenantId;
    }

    if (adminId && adminId.trim()) {
      const trimmedAdminId = adminId.trim();
      config.headers["admin-id"] = trimmedAdminId;
      config.headers["admin_id"] = trimmedAdminId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle timeout errors
    if (error.code === "ECONNABORTED" || error.message === "timeout of 30000ms exceeded") {
      console.error("[API] Request timeout:", error.config?.url);
      toast.error("Request timeout. Please check your connection and try again.");
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      console.error("[API] Network error:", error.message);
      toast.error("Network error. Please check your connection and try again.");
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Do NOT run refresh-token logic for auth endpoints themselves
    const url = originalRequest?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/signup") || url.includes("/auth/refreshToken");

    // Also skip refresh-token logic for public endpoints (no auth required)
    const isPublicEndpoint = url.includes("/users/signup-onboard") || url.includes("/rooms/public");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isPublicEndpoint) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `${token}`;
            // Ensure tenant_id is included in retry
            const tenantId = localStorage.getItem("tenant_id");
            if (tenantId) {
              originalRequest.headers["tenant_id"] = tenantId;
            }
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const rs = await api.post("/api/v1/auth/refreshToken");
        const { token: newToken } = rs.data;

        store.dispatch(tokenRefreshed({ token: newToken }));

        api.defaults.headers.common["Authorization"] = `${newToken}`;
        originalRequest.headers["Authorization"] = `${newToken}`;

        // Ensure tenant_id is included in retry
        const tenantId = localStorage.getItem("tenant_id");
        if (tenantId) {
          originalRequest.headers["tenant_id"] = tenantId;
        }

        processQueue(null, newToken);

        return axios(originalRequest);
      } catch (_error) {
        processQueue(_error, null);

        // Check if this is a refresh token error
        const isRefreshTokenError = _error.config?.url?.includes("/refreshToken");
        const errorMessage = _error.response?.data?.msg || _error.message;

        // Show specific toast for token expiration
        if (isRefreshTokenError || errorMessage?.toLowerCase().includes("token") || errorMessage?.toLowerCase().includes("expired") || errorMessage?.toLowerCase().includes("invalid token")) {
          toast.error("Your session has expired. Please log in again.");
        } else {
          toast.error("Session expired. Please log in again.");
        }

        store.dispatch(logout());
        return Promise.reject(_error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
