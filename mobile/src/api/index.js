import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Resolve the backend host dynamically so the app works on both
// iOS simulator (localhost) and physical device (LAN IP) without
// any manual changes.
//
// Expo sets `hostUri` to "<machine-ip>:<metro-port>" when the app
// is running via Expo Go or a dev build. We strip the port and use
// that IP to reach the backend on port 3000.
function getBackendUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  // Fallback for production / standalone builds
  return 'http://localhost:3000';
}

export const BASE_URL = getBackendUrl();

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
  },
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
  list: (symbols) => api.get('/stocks', { params: symbols ? { symbols: symbols.join(',') } : {} }),
  search: (q) => api.get('/stocks/search', { params: { q } }),
  quote: (symbol) => api.get(`/stocks/${symbol}/quote`),
  candles: (symbol, resolution = 'D', days = 30) => api.get(`/stocks/${symbol}/candles`, { params: { resolution, days } }),
};

// Alerts
export const alertsAPI = {
  list: () => api.get('/alerts'),
  create: (data) => api.post('/alerts', data),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
};
