import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const service = {
  getAll: async () => {
    const response = await apiClient.get('/api/season');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/season', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/season/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/season/' + id);
    return response.data;
  },
};

export default service;