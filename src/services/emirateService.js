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
  getEmirates: async () => {
    const response = await apiClient.get('/api/emirate');
    return response.data;
  },
  addEmirate: async (payload) => {
    const response = await apiClient.post('/api/emirate', payload);
    return response.data;
  },
  updateEmirate: async (id, payload) => {
    const response = await apiClient.put('/api/emirate/' + id, payload);
    return response.data;
  },
  deleteEmirate: async (id) => {
    const response = await apiClient.delete('/api/emirate/' + id);
    return response.data;
  },
};

export default cropService;