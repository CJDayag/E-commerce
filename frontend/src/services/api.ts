// src/services/api.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000', // or whatever your base URL is
  withCredentials: true,
});

// Add an interceptor to include the auth token with every request
API.interceptors.request.use(
    (config) => {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

export default API;