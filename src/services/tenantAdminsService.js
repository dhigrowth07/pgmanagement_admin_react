import api from "./api";

/**
 * Get terms and conditions for the current tenant
 * @returns {Promise} - API response containing terms and conditions
 */
export const getTermsAndConditions = () => {
  return api.get("/api/v1/tenant-admins/terms-and-conditions");
};

/**
 * Get all admins for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise} - API response containing list of admins
 */
export const getAllAdmins = (tenantId) => {
  return api.get(`/api/v1/tenant-admins?tenant_id=${tenantId}`);
};

/**
 * Check if current admin is the main admin
 * @returns {Promise} - API response containing isMainAdmin status
 */
export const checkMainAdmin = () => {
  return api.get("/api/v1/tenant-admins/check-main-admin");
};
