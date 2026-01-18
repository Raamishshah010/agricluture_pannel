import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const farmingSystemService = {
  getAll: async () => {
    const response = await apiClient.get('/api/farming-system');
    return response.data;
  },
  addItem: async (payload) => {
    const response = await apiClient.post('/api/farming-system', payload);
    return response.data;
  },
  updateItem: async (id, payload) => {
    const response = await apiClient.put('/api/farming-system/' + id, payload);
    return response.data;
  },
  deleteItem: async (id) => {
    const response = await apiClient.delete('/api/farming-system/' + id);
    return response.data;
  },
};

export default farmingSystemService;