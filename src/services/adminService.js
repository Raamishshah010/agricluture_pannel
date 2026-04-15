import axios from 'axios';
import { API_BASE_URL } from '../utils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const inflightRequests = new Map();

const getInflightKey = (method, url) => `${method}:${url}`;

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
    const url = '/api/admin/master-data';
    const inflightKey = getInflightKey('GET', url);

    if (inflightRequests.has(inflightKey)) {
      return inflightRequests.get(inflightKey);
    }

    const request = apiClient.get(url)
      .then((response) => response.data)
      .finally(() => {
        inflightRequests.delete(inflightKey);
      });

    inflightRequests.set(inflightKey, request);
    return request;
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
    const url = '/api/admin/me';
    const inflightKey = getInflightKey('GET', url);

    if (inflightRequests.has(inflightKey)) {
      return inflightRequests.get(inflightKey);
    }

    const request = apiClient.get(url)
      .then((response) => response.data)
      .finally(() => {
        inflightRequests.delete(inflightKey);
      });

    inflightRequests.set(inflightKey, request);
    return request;
  },
};

export default adminService;