import api from "./api";

const BASE_URL = "/api/v1/dashboard";

export const getDashboardMetrics = () => {
  return api.get(`${BASE_URL}/metrics`);
};
