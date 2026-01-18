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

export const centerService = {
  getCenters: async () => {
    const response = await apiClient.get('/api/center');
    return response.data;
  },
  getCentersByEmirate: async (id) => {
    const response = await apiClient.get('/api/center/emirate/' + id);
    return response.data;
  },
  addCenter: async (payload) => {
    const response = await apiClient.post('/api/center', payload);
    return response.data;
  },
  updateCenter: async (id, payload) => {
    const response = await apiClient.put('/api/center/' + id, payload);
    return response.data;
  },
  deleteCenter: async (id) => {
    const response = await apiClient.delete('/api/center/' + id);
    return response.data;
  },
};

export default centerService;