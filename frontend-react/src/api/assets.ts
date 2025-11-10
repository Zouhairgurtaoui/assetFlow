import api from './axios';
import {
  Asset,
  AssetFilters,
  CreateAssetData,
  AssignAssetData,
  AssetHistoryEntry,
  DepreciationInfo
} from '@/types/asset';

export const assetsApi = {
  getAssets: async (filters?: AssetFilters): Promise<Asset[]> => {
    const response = await api.get('/assets/', { params: filters });
    return response.data;
  },

  getAsset: async (id: number, includeDepreciation = false): Promise<Asset> => {
    const response = await api.get(`/assets/${id}`, {
      params: { include_depreciation: includeDepreciation }
    });
    return response.data;
  },

  createAsset: async (data: CreateAssetData): Promise<{ message: string; asset: Asset }> => {
    const response = await api.post('/assets/', data);
    return response.data;
  },

  updateAsset: async (id: number, data: Partial<CreateAssetData>): Promise<{ message: string; asset: Asset }> => {
    const response = await api.put(`/assets/${id}`, data);
    return response.data;
  },

  deleteAsset: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },

  assignAsset: async (id: number, data: AssignAssetData): Promise<{ message: string; asset: Asset }> => {
    const response = await api.post(`/assets/${id}/assign`, data);
    return response.data;
  },

  releaseAsset: async (id: number): Promise<{ message: string; asset: Asset }> => {
    const response = await api.post(`/assets/${id}/release`);
    return response.data;
  },

  getAssetHistory: async (id: number): Promise<AssetHistoryEntry[]> => {
    const response = await api.get(`/assets/${id}/history`);
    return response.data;
  },

  getAssetDepreciation: async (id: number): Promise<DepreciationInfo> => {
    const response = await api.get(`/assets/${id}/depreciation`);
    return response.data;
  },

  exportAssets: async (): Promise<Blob> => {
    const response = await api.get('/assets/export', {
      responseType: 'blob'
    });
    return response.data;
  },
};
