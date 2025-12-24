import api from './api';

const BASE_URL = '/api/v1/activity-logs';

export const getActivityLogs = (params) => {
  return api.get(BASE_URL, { params });
};

export const getActivityLogById = (logId) => {
  return api.get(`${BASE_URL}/${logId}`);
};

export const getActivityStats = () => {
  return api.get(`${BASE_URL}/stats`);
};

export const getUserActivityLogs = (userId, params) => {
  return api.get(`${BASE_URL}/users/${userId}`, { params });
};

export const deleteAllActivityLogs = () => {
  return api.delete(BASE_URL);
};

