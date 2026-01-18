import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const cropService = {
  getAll: async () => {
    const response = await apiClient.get('/api/variety');
    return response.data;
  },
  add: async (payload) => {
    const response = await apiClient.post('/api/variety', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await apiClient.put('/api/variety/' + id, payload);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete('/api/variety/' + id);
    return response.data;
  },
};

export default cropService;