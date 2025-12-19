import axios from "axios";
import api from "./api";
import { updateUserProfileByAdmin } from "./authService";

export const getAllCustomers = () => {
  return api.get("/api/v1/users/all");
};

export const createCustomer = (data) => {
  return api.post("/api/v1/auth/signup", data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const signupOnboardCustomer = (formData) => {
  return api.post("/api/v1/users/signup-onboard", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateCustomer = ({ userId, customerData }) => {
  console.log("%c Line:15 🥒 userId", "color:#4fff4B", userId);
  return api.put(`/api/v1/users/${userId}/onboard`, customerData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteCustomer = (userId) => {
  return api.delete(`/api/v1/users/${userId}`);
};

export const updateUserTariff = (userId, tariffId) => {
  return api.put(`/api/v1/users/${userId}/tariff`, { tariff_id: tariffId });
};

export const removeUserFromRoom = (userId) => {
  return api.put(`/api/v1/users/${userId}/remove-room`);
};

export const changePasswordForCustomer = (userId, new_password) => {
  return api.put(`/api/v1/users/${userId}/password`, { new_password });
};

export const bulkImportUsers = (users) => {
  return api.post("/api/v1/users/bulk-import", { users });
};

export const adminUpdateCustomerProfile = (userId, formData) => {
  return updateUserProfileByAdmin(userId, formData);
};

export const collectAdvancePayment = (userId, data) => {
  return api.post(`/api/v1/users/${userId}/advance`, data);
};

export const getAdvancePayment = (userId) => {
  return api.get(`/api/v1/users/${userId}/advance`);
};

export const updateAdvancePayment = (userId, data) => {
  return api.put(`/api/v1/users/${userId}/advance`, data);
};

// Profile Image APIs
export const uploadUserProfileImage = (userId, file) => {
  const formData = new FormData();
  formData.append("profile_image", file);
  return api.post(`/api/v1/users/${userId}/profile/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteUserProfileImage = (userId) => {
  return api.delete(`/api/v1/users/${userId}/profile/image`);
};

export const activateUser = (userId) => {
  return api.put(`/api/v1/users/${userId}/activate`);
};

export const changeRoomCustomer = (userId, roomId) => {
  return api.put(`/api/v1/users/${userId}/change-room`, { room_id: roomId });
};

export const vacateUserRoom = (userId) => {
  return api.put(`/api/v1/users/${userId}/vacate`);
};
