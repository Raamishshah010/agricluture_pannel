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

export const adminService = {
  login: async (payload) => {
    const response = await apiClient.post('/api/admin/login', payload);
    return response.data;
  },
  getMasterData: async () => {
    const response = await apiClient.get('/api/admin/master-data');
    return response.data;
  },
  getAdmins: async () => {
    const response = await apiClient.get('/api/admin/admins');
    return response.data;
  },
  createAdmin: async (payload) => {
    const response = await apiClient.post('/api/admin/admins', payload);
    return response.data;
  },
  updateAdmin: async (id, payload) => {
    const response = await apiClient.put(`/api/admin/admins/${id}`, payload);
    return response.data;
  },
  deleteAdmin: async (id) => {
    const response = await apiClient.delete(`/api/admin/admins/${id}`);
    return response.data;
  },
};

export default adminService;