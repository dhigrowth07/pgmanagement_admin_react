import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as alertService from '../../services/alertService';
import { handleApiError } from '../../utils/APIErrorHandler';
import toast from 'react-hot-toast';

const initialState = {
    alerts: [],
    status: 'idle',
    error: null,
};

export const fetchAllAlerts = createAsyncThunk('alerts/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const response = await alertService.getAlertHistory();
        return response.data.data;
    } catch (error) {
        return rejectWithValue(handleApiError(error));
    }
});

export const sendAlert = createAsyncThunk('alerts/send', async ({ target, userId, title, body }, { dispatch, rejectWithValue }) => {
    const data = { title, body };
    try {
        let response;
        if (target === 'all') {
            response = await alertService.sendBroadcastAlert(data);
        } else {
            response = await alertService.sendUserAlert({ ...data, user_id: userId });
        }
        toast.success(response.data.msg || 'Alert sent successfully!');
        dispatch(fetchAllAlerts());
        return response.data;
    } catch (error) {
        const errorData = handleApiError(error);
        toast.error(errorData.msg || 'Failed to send alert.');
        return rejectWithValue(errorData);
    }
});

const alertsSlice = createSlice({
    name: 'alerts',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllAlerts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAllAlerts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.alerts = action.payload;
            })
            .addCase(fetchAllAlerts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload.msg;
            })
            .addCase(sendAlert.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(sendAlert.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(sendAlert.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload.msg;
            });
    },
});

export const selectAllAlerts = (state) => state.alerts.alerts;
export const selectAlertsStatus = (state) => state.alerts.status;

export default alertsSlice.reducer;