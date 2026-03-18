import axios from 'axios';

const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const api = axios.create({
  baseURL: base.endsWith('/api') ? base : `${base.replace(/\/$/, '')}/api`,
});

// Add interceptor to include JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
