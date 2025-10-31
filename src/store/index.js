import { configureStore } from '@reduxjs/toolkit';
import usersReducer from './usersSlice';
import botsReducer from './botsSlice';
import instancesReducer from './botInstancesSlice';
import clientsReducer from './clientsSlice';
import docsReducer from './docsSlice';
import settingsReducer from './settingsSlice';
import metricsReducer from './metricsSlice';
import recipientsReducer from './recipientsSlice';

export const store = configureStore({
  reducer: {
    users: usersReducer,
    clients: clientsReducer,
    bots: botsReducer,
    instances: instancesReducer,
    docs: docsReducer,
    settings: settingsReducer,
    metrics: metricsReducer,
    recipients: recipientsReducer
  },
});

export default store;
