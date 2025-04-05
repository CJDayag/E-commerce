import api from '@/services/api';

export interface RegisterData {
  email: string;
  password: string;
  re_password: string; // Ensure to match Djoser naming
  first_name: string;
  last_name: string;// Optional additional fields
}

export interface RegisterResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export const registerService = {
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/api/auth/users/', data);
    return response.data;
  },
};
