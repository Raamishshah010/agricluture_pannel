import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const possessionService = {
  getAll: async () => {
    const response = await apiClient.get('/api/possession');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/possession', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/possession/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/possession/' + id);
    return response.data;
  },
};

export default possessionService;