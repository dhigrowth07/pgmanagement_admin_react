import api from './api';

export const updateGoogleReviewLink = (blockId, data) =>
    api.put(`/api/v1/blocks/${blockId}/google-review-link`, data);


// --- Block APIs ---
export const getAllBlocks = () => api.get('/api/v1/blocks');
export const createBlock = (data) => api.post('/api/v1/blocks', data);
export const updateBlock = (id, data) => api.put(`/api/v1/blocks/${id}`, data);
export const deleteBlock = (id) => api.delete(`/api/v1/blocks/${id}`);

// --- Room APIs ---
export const getAllRooms = () => api.get('/api/v1/rooms');
export const getRoomById = (id) => api.get(`/api/v1/rooms/${id}`);
export const createRoom = (data) => api.post('/api/v1/rooms', data);
export const updateRoom = (id, data) => api.put(`/api/v1/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/api/v1/rooms/${id}`);

// --- Tariff APIs ---
export const getAllTariffs = () => api.get('/api/v1/tariffs');
export const createTariff = (data) => api.post('/api/v1/tariffs', data);
export const updateTariff = (id, data) => api.put(`/api/v1/tariffs/${id}`, data);
export const deleteTariff = (id) => api.delete(`/api/v1/tariffs/${id}`);

// --- Room Preset APIs ---
export const getAllRoomPresets = () => api.get('/api/v1/room-presets');
export const createRoomPreset = (data) => api.post('/api/v1/room-presets', data);
export const updateRoomPreset = (id, data) => api.put(`/api/v1/room-presets/${id}`, data);
export const deleteRoomPreset = (id) => api.delete(`/api/v1/room-presets/${id}`);