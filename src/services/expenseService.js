import api from "./api";

const BASE_URL = "/api/v1/expenses";
const CATEGORY_BASE_URL = "/api/v1/expense-categories";

// Expense endpoints
export const getAllExpenses = (filters = {}) => {
  return api.get(BASE_URL, { params: filters });
};

export const getExpenseById = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

export const createExpense = (data) => {
  // If data is FormData, axios will automatically set Content-Type with boundary
  // Otherwise, send as JSON (default Content-Type: application/json)
  return api.post(BASE_URL, data);
};

export const updateExpense = (id, data) => {
  // If data is FormData, axios will automatically set Content-Type with boundary
  // Otherwise, send as JSON (default Content-Type: application/json)
  return api.put(`${BASE_URL}/${id}`, data);
};

export const deleteExpense = (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

export const getExpenseSummary = (filters = {}) => {
  return api.get(`${BASE_URL}/summary`, { params: filters });
};

export const exportExpenses = (filters = {}, format = "xlsx") => {
  const config = {
    params: { ...filters, format },
  };

  if (format === "xlsx" || format === "excel") {
    config.responseType = "blob";
  }

  return api.get(`${BASE_URL}/export`, config);
};

// Category endpoints
export const getAllCategories = () => {
  return api.get(CATEGORY_BASE_URL);
};

export const getCategoryById = (id) => {
  return api.get(`${CATEGORY_BASE_URL}/${id}`);
};

export const createCategory = (data) => {
  return api.post(CATEGORY_BASE_URL, data);
};

export const updateCategory = (id, data) => {
  return api.put(`${CATEGORY_BASE_URL}/${id}`, data);
};

export const deleteCategory = (id) => {
  return api.delete(`${CATEGORY_BASE_URL}/${id}`);
};
