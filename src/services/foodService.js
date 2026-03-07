import api from "./api";

/**
 * @typedef {Object} FoodService
 */
const foodService = {
    // Config
    getPricing: () => api.get("/api/v1/food/pricing"),
    /** @param {any} data */
    updatePricing: (data) => api.post("/api/v1/food/pricing", data),
    getConfig: () => api.get("/api/v1/food/config"),
    /** @param {any} data */
    updateConfig: (data) => api.post("/api/v1/food/config", data),

    // Availability
    /** @param {any} data */
    markAvailability: (data) => api.post("/api/v1/food/availability", data),
    /** 
     * @param {string} startDate 
     * @param {string} endDate 
     */
    getWeeklyAvailability: (startDate, endDate) =>
        api.get(`/api/v1/food/availability/weekly?startDate=${startDate}&endDate=${endDate}`),

    // Polls
    getPollDeadline: () => api.get("/api/v1/food/poll/deadline"),
    /** 
     * @param {string} startDate 
     * @param {string} endDate 
     */
    getWeeklySummary: (startDate, endDate) =>
        api.get(`/api/v1/food/poll/weekly-summary?startDate=${startDate}&endDate=${endDate}`),
    /** @param {string} date */
    getDailySummary: (date) => api.get(`/api/v1/food/poll/summary/${date}`),
    getNextDaySummary: () => api.get("/api/v1/food/poll/summary"),

    // Billing
    getBillingSummary: () => api.get("/api/v1/food/billing/summary"),
    /** @param {any} data */
    generateBilling: (data) => api.post("/api/v1/food/billing/generate", data),

    // Notifications
    sendMealReminder: () => api.post("/api/v1/food/notifications/meal-reminder"),
    sendBillingReminder: () => api.post("/api/v1/food/notifications/billing-reminder"),
    sendKitchenPreparation: () => api.post("/api/v1/food/notifications/kitchen-preparation"),

    // Cron
    triggerCron: () => api.post("/api/v1/food/cron/trigger"),
};

export default foodService;
