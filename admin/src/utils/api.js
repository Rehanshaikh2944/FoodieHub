import axios from 'axios';
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const api = axios.create({ baseURL: API_URL, timeout: 15000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodiehub-admin-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && localStorage.getItem('foodiehub-admin-token')) {
    localStorage.removeItem('foodiehub-admin-token');
    if (typeof window !== 'undefined') window.location.reload();
  }
  return Promise.reject(error);
});
