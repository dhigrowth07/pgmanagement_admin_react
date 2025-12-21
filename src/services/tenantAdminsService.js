import api from "./api";

/**
 * Get terms and conditions for the current tenant
 * @returns {Promise} - API response containing terms and conditions
 */
export const getTermsAndConditions = () => {
  return api.get("/api/v1/tenant-admins/terms-and-conditions");
};
