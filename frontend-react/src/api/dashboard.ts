import api from './axios';
import {
  DashboardStats,
  CategoryData,
  DepartmentData,
  StatusData,
  MaintenanceStats,
  AssetValueSummary
} from '@/types/dashboard';
import { Asset, AssetHistoryEntry } from '@/types/asset';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getAssetsByCategory: async (): Promise<CategoryData[]> => {
    const response = await api.get('/dashboard/assets-by-category');
    return response.data;
  },

  getAssetsByDepartment: async (): Promise<DepartmentData[]> => {
    const response = await api.get('/dashboard/assets-by-department');
    return response.data;
  },

  getAssetsByStatus: async (): Promise<StatusData[]> => {
    const response = await api.get('/dashboard/assets-by-status');
    return response.data;
  },

  getWarrantyExpiring: async (days = 30): Promise<Asset[]> => {
    const response = await api.get('/dashboard/warranty-expiring', { params: { days } });
    return response.data;
  },

  getRecentActivities: async (limit = 50): Promise<AssetHistoryEntry[]> => {
    const response = await api.get('/dashboard/recent-activities', { params: { limit } });
    return response.data;
  },

  getMaintenanceStats: async (): Promise<MaintenanceStats> => {
    const response = await api.get('/dashboard/maintenance-stats');
    return response.data;
  },

  getAssetValueSummary: async (): Promise<AssetValueSummary> => {
    const response = await api.get('/dashboard/asset-value-summary');
    return response.data;
  },
};
