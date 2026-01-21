import api from "./api";

const attendanceService = {
  // Configuration
  getConfig: async () => {
    const response = await api.get("/api/v1/attendance/config");
    return response.data;
  },

  saveConfig: async (configData) => {
    const response = await api.post("/api/v1/attendance/config", configData);
    return response.data;
  },

  // Records
  getAllRecords: async (params) => {
    const response = await api.get("/api/v1/attendance/records", { params });
    return response.data;
  },

  getRecordById: async (id) => {
    const response = await api.get(`/api/v1/attendance/records/${id}`);
    return response.data;
  },

  overrideAttendance: async (id, overrideData) => {
    const response = await api.put(`/api/v1/attendance/records/${id}/override`, overrideData);
    return response.data;
  },

  // Statistics & Reports
  getStatistics: async (params) => {
    const response = await api.get("/api/v1/attendance/statistics", { params });
    return response.data;
  },

  getMonthlyReport: async (month, year) => {
    const response = await api.get("/api/v1/attendance/report/monthly", {
      params: { month, year },
    });
    return response.data;
  },

  // Status (for currently logged in user/admin)
  getStatus: async () => {
    const response = await api.get("/api/v1/attendance/status");
    return response.data;
  },
};

export default attendanceService;
