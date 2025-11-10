import api from './axios';
import { User } from '@/types/auth';
import { UpdateUserData } from '@/types/user';
import { Asset } from '@/types/asset';

export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/');
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserAssets: async (id: number): Promise<Asset[]> => {
    const response = await api.get(`/users/${id}/assets`);
    return response.data;
  },
};
