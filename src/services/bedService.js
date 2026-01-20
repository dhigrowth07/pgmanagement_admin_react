import api from "./api";

/**
 * Bed Management APIs
 * Handles all bed-related data operations
 */

// --- General Bed APIs ---
export const getAllBeds = () => api.get("/api/v1/beds");
/** @param {string} id */
export const getBedById = (id) => api.get(`/api/v1/beds/${id}`);
/** @param {any} data */
export const createBed = (data) => api.post("/api/v1/beds", data);
/** @param {string} id @param {any} data */
export const updateBed = (id, data) => api.put(`/api/v1/beds/${id}`, data);
/** @param {string} id */
export const deleteBed = (id) => api.delete(`/api/v1/beds/${id}`);

// --- Room-specific Bed APIs ---
/** @param {string} roomId */
export const getBedsByRoomId = (roomId) => api.get(`/api/v1/beds/room/${roomId}`);
/** @param {string} roomId */
export const getAvailableBeds = (roomId) => api.get(`/api/v1/beds/room/${roomId}/available`);
/** @param {string} roomId @param {string} tenantId @param {string} adminId */
export const getPublicAvailableBeds = (roomId, tenantId, adminId) =>
  api.get(`/api/v1/beds/room/${roomId}/available/public`, {
    headers: { tenant_id: tenantId, admin_id: adminId },
  });

// --- Bed Status & Assignment APIs ---
/** @param {string} id @param {any} statusData */
export const changeBedStatus = (id, statusData) => api.put(`/api/v1/beds/${id}/status`, statusData);
/** @param {string} id @param {any} userData */
export const assignUserToBed = (id, userData) => api.post(`/api/v1/beds/${id}/assign`, userData);
/** @param {string} id */
export const unassignUserFromBed = (id) => api.post(`/api/v1/beds/${id}/unassign`);

// --- Summary APIs ---
export const getAllBedAvailabilitySummary = () => api.get("/api/v1/beds/availability-summary");
/** @param {string} roomId */
export const getBedAvailabilitySummary = (roomId) => api.get(`/api/v1/beds/room/${roomId}/availability-summary`);
