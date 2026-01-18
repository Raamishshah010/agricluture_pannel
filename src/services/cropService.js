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
  getCrops: async () => {
    const response = await apiClient.get('/api/crop');
    return response.data;
  },
  addCrop: async (payload) => {
    const response = await apiClient.post('/api/crop', payload);
    return response.data;
  },
  updateCrop: async (id, payload) => {
    const response = await apiClient.put('/api/crop/' + id, payload);
    return response.data;
  },
  deleteCrop: async (id) => {
    const response = await apiClient.delete('/api/crop/' + id);
    return response.data;
  },
};

export default cropService;