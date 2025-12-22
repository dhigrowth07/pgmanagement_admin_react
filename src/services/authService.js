import api from "./api";
import { store } from "../redux/store";
import { setAuthStatus } from "../redux/auth/authSlice";

const baseURL = `/api/v1/auth`;
const usersURL = `/api/v1/users`;

export const login = async (credentials) => {
  const loginWithoutTenantId = credentials?.loginWithoutTenantId || false;
  const email = credentials?.email?.trim();
  const password = credentials?.password?.trim();

  if (!email) {
    store.dispatch(setAuthStatus("failed"));
    throw new Error("Email is required");
  }

  if (!password) {
    store.dispatch(setAuthStatus("failed"));
    throw new Error("Password is required");
  }

  // If login without tenant_id is enabled, use the endpoint that resolves tenant_id from email
  // DO NOT include tenant_id in payload - backend will resolve it from email
  if (loginWithoutTenantId) {
    const loginPayload = {
      email,
      password,
      // Explicitly do NOT include tenant_id - backend will resolve it from email
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    console.log("[AuthService] Tenant admin login without tenant_id request:", {
      body: {
        email: loginPayload.email,
        hasPassword: !!loginPayload.password,
      },
      headers: config.headers,
    });

    try {
      return await api.post(`${baseURL}/login/tenant-admin-without-tenant-id`, loginPayload, config);
    } catch (error) {
      store.dispatch(setAuthStatus("failed"));
      throw error;
    }
  }

  // Original login flow with tenant_id (when loginWithoutTenantId is false)
  // Prefer tenantId from form payload, fallback to localStorage
  const rawTenantId = credentials?.tenantId || localStorage.getItem("tenant_id");
  const tenantId = rawTenantId?.trim();

  // Original login flow with tenant_id
  if (!tenantId) {
    console.warn("[AuthService] No tenant_id provided for login");
    store.dispatch(setAuthStatus("failed"));
    throw new Error("Tenant ID is required");
  }

  const loginPayload = {
    tenant_id: tenantId,
    email,
    password,
  };

  const config = {
    headers: {
      "Content-Type": "application/json",
      tenant_id: tenantId,
    },
  };

  console.log("[AuthService] Tenant admin login request:", {
    body: {
      tenant_id: loginPayload.tenant_id,
      email: loginPayload.email,
      hasPassword: !!loginPayload.password,
    },
    headers: config.headers,
  });

  try {
    return await api.post(`${baseURL}/login/tenant-admin`, loginPayload, config);
  } catch (error) {
    store.dispatch(setAuthStatus("failed"));
    throw error;
  }
};

export const fetchUserProfile = () => {
  return api.get(`${usersURL}/profile`);
};

export const updateUserProfile = (data) => {
  return api.put(`${usersURL}/profile`, data);
};

export const fetchAdminProfile = () => {
  return api.get(`${usersURL}/admin/profile`);
};

export const updateAdminProfile = (data) => {
  return api.put(`${usersURL}/admin/profile`, data);
};

export const updateUserProfileByAdmin = (userId, formData) => {
  return api.put(`${usersURL}/${userId}/update-profile`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const refreshToken = () => {
  return api.post(`${baseURL}/refreshToken`);
};
