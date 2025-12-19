import api from "./api";

const BASE_URL = "/api/v1/electricity";

// Admin - Bills
export const createBill = (data) => api.post(BASE_URL, data);
export const getBills = (params) => api.get(BASE_URL, { params });
export const getBillById = (id) => api.get(`${BASE_URL}/${id}`);
export const updateBill = (id, data) => api.put(`${BASE_URL}/${id}`, data);
export const deleteBill = (id) => api.delete(`${BASE_URL}/${id}`);

// Admin - Shares & Stats
export const getUnpaidShares = () => api.get(`${BASE_URL}/unpaid`);
export const getStatistics = () => api.get(`${BASE_URL}/statistics`);
export const markSharePaid = (shareId) => api.put(`${BASE_URL}/share/${shareId}/paid`);

// User
export const getUserBills = (userId) => api.get(`${BASE_URL}/user/${userId}`);
export const getUserPaymentHistory = (userId) => api.get(`${BASE_URL}/user/${userId}/history`);
