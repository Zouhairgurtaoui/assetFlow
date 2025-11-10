import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '@/api/assets';
import { AssetFilters, CreateAssetData, AssignAssetData } from '@/types/asset';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

export const useAssets = (filters?: AssetFilters) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.assets, filters],
    queryFn: () => assetsApi.getAssets(filters),
  });
};

export const useAsset = (id: number, includeDepreciation = false) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.asset(id), includeDepreciation],
    queryFn: () => assetsApi.getAsset(id, includeDepreciation),
    enabled: !!id,
  });
};

export const useAssetHistory = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.assetHistory(id),
    queryFn: () => assetsApi.getAssetHistory(id),
    enabled: !!id,
  });
};

export const useAssetMutations = () => {
  const queryClient = useQueryClient();

  const createAsset = useMutation({
    mutationFn: (data: CreateAssetData) => assetsApi.createAsset(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create asset');
    },
  });

  const updateAsset = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAssetData> }) =>
      assetsApi.updateAsset(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asset(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update asset');
    },
  });

  const deleteAsset = useMutation({
    mutationFn: (id: number) => assetsApi.deleteAsset(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete asset');
    },
  });

  const assignAsset = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignAssetData }) =>
      assetsApi.assignAsset(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asset(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign asset');
    },
  });

  const releaseAsset = useMutation({
    mutationFn: (id: number) => assetsApi.releaseAsset(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.asset(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to release asset');
    },
  });

  return {
    createAsset,
    updateAsset,
    deleteAsset,
    assignAsset,
    releaseAsset,
  };
};
