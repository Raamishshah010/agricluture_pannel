import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const service = {
  getAll: async () => {
    const response = await apiClient.get('/api/cultivation-method');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/cultivation-method', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/cultivation-method/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/cultivation-method/' + id);
    return response.data;
  },
};

export default service;