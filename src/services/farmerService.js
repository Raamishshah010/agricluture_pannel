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

export const farmerService = {
    getAllFarmers: async () => {
        const url = '/api/farmer';
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
    getCoders: async () => {
        const response = await apiClient.get('/api/farmer/coders');
        return response.data;
    },
    getFarmers: async (page, limit, query = '', status = '') => {
        const normalizedQuery = String(query || '').trim();
        const normalizedStatus = String(status || '').trim();
        const url = `/api/farmer/farmers?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}&search=${encodeURIComponent(normalizedQuery)}&status=${encodeURIComponent(normalizedStatus)}`;
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
    getFarmerFarms: async (id) => {
        const response = await apiClient.get('/api/farm/owner/' + id);
        return response.data;
    },
    getSearchUsers: async (query) => {
        const response = await apiClient.get('/api/farmer/search?query=' + query);
        return response.data;
    },
    getPendingApprovals: async (limit = 100, status = 'pending_approval') => {
        const url = `/api/farmer/pending-approvals?limit=${encodeURIComponent(limit)}&status=${encodeURIComponent(status)}`;
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
    updateApprovalStatus: async (id, payload) => {
        const response = await apiClient.patch(`/api/farmer/${id}/approval`, payload);
        return response.data;
    },
    addCoder: async (payload) => {
        const response = await apiClient.post('/api/farmer/add-coder', payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    addFarmer: async (payload) => {
        const response = await apiClient.post('/api/farmer/register', payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    update: async (id, payload) => {
        const response = await apiClient.put('/api/farmer/' + id, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete('/api/farmer/' + id);
        return response.data;
    },
    assignFarm: async (id, payload) => {
        const response = await apiClient.post('/api/farmer/' + id + '/add-farm', payload);
        return response.data;
    },
};

export default farmerService;
