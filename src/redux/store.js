import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./auth/authSlice";
import customerReducer from "./customer/customerSlice";
import roomReducer from "./room/roomSlice";
import alertsReducer from "./alerts/alertsSlice";
import issueReducer from "./issue/issueSlice";
import paymentReducer from "./payment/paymentSlice";
import electricityReducer from "./electricity/electricitySlice";
import deletionRequestReducer from "./deletionRequest/deletionRequestSlice";
import expenseReducer from "./expense/expenseSlice";
import adminReducer from "./admin/adminSlice";
import activityLogsReducer from "./activityLogs/activityLogsSlice";
import dashboardReducer from "./dashboard/dashboardSlice";
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  customer: customerReducer,
  room: roomReducer,
  alerts: alertsReducer,
  issue: issueReducer,
  payment: paymentReducer,
  electricity: electricityReducer,
  deletionRequest: deletionRequestReducer,
  expense: expenseReducer,
  admin: adminReducer,
  activityLogs: activityLogsReducer,
  dashboard: dashboardReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
