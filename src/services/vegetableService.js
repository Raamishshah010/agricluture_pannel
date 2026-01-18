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

export const itemService = {
  getItems: async () => {
    const response = await apiClient.get('/api/vegetable-type');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/vegetable-type', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/vegetable-type/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/vegetable-type/' + id);
    return response.data;
  },
};

export default itemService;