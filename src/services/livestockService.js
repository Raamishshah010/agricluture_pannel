import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const livestockService = {
  getAll: async () => {
    const response = await apiClient.get('/api/livestock');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/livestock', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/livestock/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/livestock/' + id);
    return response.data;
  },
};

export default livestockService;