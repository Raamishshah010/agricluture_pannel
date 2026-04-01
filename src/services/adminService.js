import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');
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
  // cached getAdmins (30s TTL) to avoid repeated network calls when components mount/unmount
  _cachedAdmins: null,
  _cachedAdminsAt: 0,
  getAdmins: async (force = false) => {
    try {
      const now = Date.now();
      const ttl = 30 * 1000; // 30 seconds
      if (!force && adminService._cachedAdmins && (now - adminService._cachedAdminsAt) < ttl) {
        return adminService._cachedAdmins;
      }
      const response = await apiClient.get('/api/admin/admins');
      adminService._cachedAdmins = response.data;
      adminService._cachedAdminsAt = Date.now();
      return response.data;
    } catch (err) {
      throw err;
    }
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
  getCurrentAdmin: async () => {
    const response = await apiClient.get('/api/admin/me');
    return response.data;
  },
};

export default adminService;