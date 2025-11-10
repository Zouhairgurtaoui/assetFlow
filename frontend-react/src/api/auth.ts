import api from './axios';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth';
import { ChangePasswordData } from '@/types/user';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ message: string; user: User }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateMe: async (data: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};
