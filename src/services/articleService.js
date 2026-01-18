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

export const articleService = {
    getCategories: async () => {
        const response = await apiClient.get('/api/category/categories');
        return response.data;
    },
    addCategory: async (payload) => {
        const response = await apiClient.post('/api/category/categories', payload);
        return response.data;
    },
    updateCategory: async (id, payload) => {
        const response = await apiClient.put('/api/category/categories/' + id, payload);
        return response.data;
    },
    deleteCategory: async (id) => {
        const response = await apiClient.delete('/api/category/categories/' + id);
        return response.data;
    },
    getSubCategories: async () => {
        const response = await apiClient.get('/api/sub-category');
        return response.data;
    },
    getSubCategoriesByCategory: async (id) => {
        const response = await apiClient.get('/api/sub-category/category/' + id);
        return response.data;
    },
    addSubCategory: async (payload) => {
        const response = await apiClient.post('/api/sub-category', payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    updateSubCategory: async (id, payload) => {
        const response = await apiClient.put('/api/sub-category/' + id, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    deleteSubCategory: async (id) => {
        const response = await apiClient.delete('/api/sub-category/' + id);
        return response.data;
    },
    getArticles: async () => {
        const response = await apiClient.get('/api/article');
        return response.data;
    },
    addArticle: async (payload) => {
        const response = await apiClient.post('/api/article', payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    updateArticle: async (id, payload) => {
        const response = await apiClient.put('/api/article/' + id, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    deleteArticle: async (id) => {
        const response = await apiClient.delete('/api/article/' + id);
        return response.data;
    },
};

export default articleService;