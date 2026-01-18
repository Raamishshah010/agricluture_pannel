import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const regionService = {
  getAll: async () => {
    const response = await apiClient.get('/api/region');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/region', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/region/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/region/' + id);
    return response.data;
  },
};

export default regionService;