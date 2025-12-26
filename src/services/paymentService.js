import api from './api';

const BASE_URL = '/api/v1/payments';

export const getAllPayments = (params) => {
    return api.get(BASE_URL, { params });
};

export const getAllPaymentsWithTotalEB = (params) => {
    return api.get(`${BASE_URL}/combined`, { params });
};

export const getPaymentById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

export const createPayment = (data) => {
    return api.post(BASE_URL, data);
};

export const processFullPayment = (paymentId, data) => {
    return api.put(`${BASE_URL}/${paymentId}/process`, data);
};

export const processPartialPayment = (paymentId, data) => {
    return api.put(`${BASE_URL}/${paymentId}/partial`, data);
};

export const deletePayment = (id) => {
    return api.delete(`${BASE_URL}/${id}`);
};

export const getPaymentStatistics = () => {
    return api.get(`${BASE_URL}/statistics`);
};

export const generateMonthlyPayments = () => {
    return api.post(`${BASE_URL}/generate`);
};

export const getTransactionsForPayment = (paymentId) => {
    return api.get(`${BASE_URL}/${paymentId}/transactions`);
};

export const getAllTransactions = () => {
    return api.get(`${BASE_URL}/transactions/all`);
};