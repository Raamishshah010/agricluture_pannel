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
    getfarms: async (page, limit, query = '') => {
        const response = await apiClient.get(`/api/farm/pagination?page=${page}&limit=${limit}&search=${query}`);
        return response.data;
    },
    getAllfarms: async () => {
        const url = '/api/farm';
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
    getfarmById: async (id) => {
        const response = await apiClient.get('/api/farm/' + id);
        return response.data;
    },
    getFarmByIdWithoutPopulatingFields: async (id) => {
        const response = await apiClient.get('/api/farm//without-populating-fields/' + id);
        return response.data;
    },
    addFarm: async (payload) => {
        const response = await apiClient.post('/api/farm/add', payload);
        return response.data;
    },
    updateFarm: async (payload, id) => {
        const response = await apiClient.put('/api/farm/update/' + id, payload);
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete('/api/farm/' + id);
        return response.data;
    },
};

export default farmerService;