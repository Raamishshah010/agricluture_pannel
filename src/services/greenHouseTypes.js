import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const service = {
  getAll: async () => {
    const response = await apiClient.get('/api/green-house-types');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/green-house-types', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/green-house-types/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/green-house-types/' + id);
    return response.data;
  },
};

export default service;