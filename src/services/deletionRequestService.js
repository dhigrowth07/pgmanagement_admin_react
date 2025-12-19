import api from "./api";

const baseURL = `/api/v1/users`;

export const getPendingDeletionRequests = () => {
  return api.get(`${baseURL}/deletion-requests/pending`);
};

export const approveDeletionRequest = (requestId) => {
  return api.put(`${baseURL}/deletion-requests/${requestId}/approve`);
};

export const rejectDeletionRequest = (requestId, rejectionReason) => {
  return api.put(`${baseURL}/deletion-requests/${requestId}/reject`, {
    rejection_reason: rejectionReason,
  });
};
