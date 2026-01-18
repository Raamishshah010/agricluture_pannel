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

export const farmerService = {
    getAllFarmers: async () => {
        const response = await apiClient.get('/api/farmer');
        return response.data;
    },
    getCoders: async () => {
        const response = await apiClient.get('/api/farmer/coders');
        return response.data;
    },
    getFarmers: async (page, limit, query='') => {
        const response = await apiClient.get(`/api/farmer/farmers?page=${page}&limit=${limit}&search=${query}`);
        return response.data;
    },
    getFarmerFarms: async (id) => {
        const response = await apiClient.get('/api/farm/owner/' + id);
        return response.data;
    },
    getSearchUsers: async (query) => {
        const response = await apiClient.get('/api/farmer/search?query=' + query);
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
    update: async (id, payload, token) => {
        const response = await apiClient.put('/api/farmer/' + id, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
                "Authorization": "Bearer " + token
            },
        });
        return response.data;
    },
    delete: async (id, token) => {
        const response = await apiClient.delete('/api/farmer/' + id, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        return response.data;
    },
    assignFarm: async (id, payload) => {
        const response = await apiClient.post('/api/farmer/' + id + '/add-farm', payload);
        return response.data;
    },
};

export default farmerService;