import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { QUERY_KEYS } from '@/lib/constants';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboardStats,
    queryFn: () => dashboardApi.getStats(),
  });
};

export const useAssetsByCategory = () => {
  return useQuery({
    queryKey: QUERY_KEYS.assetsByCategory,
    queryFn: () => dashboardApi.getAssetsByCategory(),
  });
};

export const useAssetsByDepartment = () => {
  return useQuery({
    queryKey: QUERY_KEYS.assetsByDepartment,
    queryFn: () => dashboardApi.getAssetsByDepartment(),
  });
};

export const useAssetsByStatus = () => {
  return useQuery({
    queryKey: QUERY_KEYS.assetsByStatus,
    queryFn: () => dashboardApi.getAssetsByStatus(),
  });
};

export const useWarrantyExpiring = (days = 30) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.warrantyExpiring, days],
    queryFn: () => dashboardApi.getWarrantyExpiring(days),
  });
};

export const useRecentActivities = (limit = 50) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.recentActivities, limit],
    queryFn: () => dashboardApi.getRecentActivities(limit),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMaintenanceStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.maintenanceStats,
    queryFn: () => dashboardApi.getMaintenanceStats(),
  });
};
