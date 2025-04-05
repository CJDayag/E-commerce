import api from '@/services/api';
import { User } from '@/context/AuthContext';

export interface LoginResponse {
  access: string;    // Access token
  refresh: string;   // Refresh token
  user: User;
}

export interface LoginCredentials {
  email: string;    // Djoser uses email instead of username
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/jwt/create/', credentials);

    if (response.data.access && response.data.refresh) {
      // Store tokens securely
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Set Authorization header for future requests
      api.defaults.headers.Authorization = `Bearer ${response.data.access}`;
    }

    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.Authorization;
  },

  async getUser() {
    const response = await api.get('/auth/users/me/');
    return response.data; // Returns the current user profile
  },

  async refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) throw new Error('Refresh token is missing');

    const response = await api.post('/auth/jwt/refresh/', { refresh });

    // Update access token
    localStorage.setItem('access_token', response.data.access);
    api.defaults.headers.Authorization = `Bearer ${response.data.access}`;

    return response.data;
  },
};
