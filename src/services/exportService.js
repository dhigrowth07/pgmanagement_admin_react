import api from "./api";

export const fetchUserSummary = async ({ active_only = true, tenant_id = null } = {}) => {
  const params = new URLSearchParams();
  params.set("active_only", String(active_only));
  if (tenant_id) {
    params.set("tenant_id", tenant_id);
  }
  const { data } = await api.get(`/api/v1/export/user-summary?${params.toString()}`);
  return data?.data || [];
};


