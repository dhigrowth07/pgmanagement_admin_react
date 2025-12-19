import api from './api';

export const getAlertHistory = () => {
    return api.get('/api/v1/fcm/history');
};

export const sendBroadcastAlert = (data) => {
    return api.post('/api/v1/fcm/send-to-all', data);
};

export const sendUserAlert = ({ user_id, ...data }) => {
    return api.post(`/api/v1/fcm/send-to-user/${user_id}`, data);
};

export const sendDeviceAlert = (data) => {
    return api.post('/api/v1/fcm/send-to-device', data);
};
