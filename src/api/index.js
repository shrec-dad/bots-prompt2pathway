import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ------- Request interceptor to add JWT token -------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // get JWT from localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------- Auth -------
export const loginAPI = (data) => API.post('/users/login', data);
export const signupAPI = (data) => API.post('/users/signup', data);
export const forgotPasswordAPI = (data) => API.post('/users/forgot-password', data);
export const resetPasswordAPI = (data) => API.post('/users/reset-password', data);

// ------- Users -------
export const getUsersAPI = () => API.get('/users');
export const addUserAPI = (data) => API.post('/users', data);
export const deleteUserAPI = (id) => API.delete(`/users/${id}`);
export const updateUserAPI = (id, data) => API.put(`/users/${id}`, data);

// ------- Bot Instances -------
export const getInstancesAPI = () => API.get('/bot_instances');
export const createInstanceAPI = (data) => API.post('/bot_instances', data);
export const updateInstanceAPI = (id, data) => API.put(`/bot_instances/${id}`, data);
export const deleteInstanceAPI = (id) => API.delete(`/bot_instances/${id}`);

// ------- Bots -------
export const getBotsAPI = () => API.get('/bots');
export const createBotAPI = (data) => API.post('/bots', data);
export const updateBotAPI = (id, data) => API.put(`/bots/${id}`, data);
export const deleteBotAPI = (id) => API.delete(`/bots/${id}`);
export const duplicateBotAPI = (id, data) => API.post(`/bots/${id}/duplicate`, data);

// ------- Voice Settings -------
export const getVoiceSettingsAPI = () => API.get('/voicesettings');
export const updateVoiceSettingsAPI = (data) => API.put('/voicesettings', data);

// ------- Metrics -------
export const getMetricsAPI = (key) => API.get(`/metrics/${key}`);
export const trackEventAPI = (data) => API.post('/metrics', data);
export const deleteMetricsAPI = (key) => API.delete(`/metrics/${key}`);

// ------- Clients -------
export const getClientsAPI = () => API.get('/clients');
export const createClientAPI = (data) => API.post('/clients', data);
export const updateClientAPI = (id, data) => API.put(`/clients/${id}`, data);
export const deleteClientAPI = (id) => API.delete(`/clients/${id}`);

// ------- Recipients ------- 
export const getRecipientsAPI = (instId) => API.get(`/recipients/${instId}`);
export const createRecipientsAPI = (instId, recipients) => API.post(`/recipients/${instId}`, { recipients });
export const deleteRecipientsAPI = (ids) => API.post(`/recipients`, { ids });

// ------- Knowledge Docs -------
export const getDocsAPI = (id) => API.get(`/docs/${id}`);
export const createDocAPI = (data) => API.post('/docs', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDocAPI = (id) => API.delete(`/docs/${id}`);

// ------- Settings -------
export const getSettingsAPI = (key) => API.get(`/settings/${key}`);
export const updateSettingsAPI = (key, data) => API.post(`/settings/${key}`, data);

export default API;