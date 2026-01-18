import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const regionService = {
  getAll: async () => {
    const response = await apiClient.get('/api/water-sources');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/water-sources', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/water-sources/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/water-sources/' + id);
    return response.data;
  },
};

export default regionService;