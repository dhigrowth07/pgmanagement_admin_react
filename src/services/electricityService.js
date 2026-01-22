import api from "./api";

const BASE_URL = "/api/v1/electricity";

// Admin - Bills
export const createBill = (data) => api.post(BASE_URL, data);
export const getBills = (params) => api.get(BASE_URL, { params });
export const getBillById = (id) => api.get(`${BASE_URL}/${id}`);
export const updateBill = (id, data) => api.put(`${BASE_URL}/${id}`, data);
export const deleteBill = (id) => api.delete(`${BASE_URL}/${id}`);
export const deleteAllBills = () => api.delete(`${BASE_URL}/all`);

// Admin - Draft Status
export const getDraftBills = () => api.get(`${BASE_URL}/drafts`);
export const getFinalizedBills = () => api.get(`${BASE_URL}/finalized`);
export const finalizeBill = (id) => api.post(`${BASE_URL}/${id}/finalize`);
export const unfinalizeBill = (id) => api.post(`${BASE_URL}/${id}/unfinalize`);
export const finalizeAllDraftBills = () => api.post(`${BASE_URL}/finalize-all`);

// Admin - Manual Override (Shares)
export const getBillShares = (billId) => api.get(`${BASE_URL}/${billId}/shares`);
export const addUserToBill = (billId, data) => api.post(`${BASE_URL}/${billId}/shares`, data);
export const updateShareManually = (billId, shareId, data) => api.put(`${BASE_URL}/${billId}/shares/${shareId}`, data);
export const removeUserFromBill = (billId, shareId) => api.delete(`${BASE_URL}/${billId}/shares/${shareId}`);

// Admin - Shares & Stats
export const getUnpaidShares = () => api.get(`${BASE_URL}/unpaid`);
export const getStatistics = () => api.get(`${BASE_URL}/statistics`);
export const markSharePaid = (shareId) => api.put(`${BASE_URL}/share/${shareId}/paid`);

// Admin - Audit & History
export const getAllEditHistory = (params = {}) => api.get(`${BASE_URL}/history`, { params });
export const getEditStatistics = () => api.get(`${BASE_URL}/history/statistics`);
export const getMyRecentEdits = (params = {}) => api.get(`${BASE_URL}/history/my-edits`, { params });
export const getBillEditHistory = (billId) => api.get(`${BASE_URL}/${billId}/history`);

// User
export const getUserBills = (userId) => api.get(`${BASE_URL}/user/${userId}`);
export const getUserPaymentHistory = (userId) => api.get(`${BASE_URL}/user/${userId}/history`);

// Active Users (for bill management)
export const getActiveUsers = () => api.get("/api/v1/users/all");
