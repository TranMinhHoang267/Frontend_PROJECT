import { apiClient } from '../config/axios';

// Interfaces for response & request
export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  full_name: string;
  phone: string;
  email: string;
  password?: string;
  company_name?: string;
  address?: string;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};
