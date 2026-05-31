import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
export const BASE_URL = 'http://192.168.1.100:3000';

const api = axios.create({ baseURL: `${BASE_URL}/api` });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message;
    return Promise.reject(new Error(msg));
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateFcmToken: (fcmToken) => api.put('/auth/fcm-token', { fcmToken }),
};

// Stocks
export const stocksAPI = {
  list: (symbols) =>
    api.get('/stocks', { params: symbols ? { symbols: symbols.join(',') } : {} }),
  search: (q) => api.get('/stocks/search', { params: { q } }),
  quote: (symbol) => api.get(`/stocks/${symbol}/quote`),
  candles: (symbol, resolution = 'D', days = 30) =>
    api.get(`/stocks/${symbol}/candles`, { params: { resolution, days } }),
};

// Alerts
export const alertsAPI = {
  list: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
};
