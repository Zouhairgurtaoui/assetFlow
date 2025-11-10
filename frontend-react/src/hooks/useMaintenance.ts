import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '@/api/maintenance';
import {
  CreateTicketData,
  UpdateTicketData,
  UpdateTicketStatusData,
  AssignTicketData,
  MaintenanceFilters
} from '@/types/maintenance';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

export const useMaintenance = (filters?: MaintenanceFilters) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.maintenance, filters],
    queryFn: () => maintenanceApi.getTickets(filters),
  });
};

export const useMaintenanceTicket = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticket(id),
    queryFn: () => maintenanceApi.getTicket(id),
    enabled: !!id,
  });
};

export const useMaintenanceMutations = () => {
  const queryClient = useQueryClient();

  const createTicket = useMutation({
    mutationFn: (data: CreateTicketData) => maintenanceApi.createTicket(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create ticket');
    },
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketData }) =>
      maintenanceApi.updateTicket(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update ticket');
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketStatusData }) =>
      maintenanceApi.updateTicketStatus(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const assignTicket = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignTicketData }) =>
      maintenanceApi.assignTicket(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(variables.id) });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign ticket');
    },
  });

  const deleteTicket = useMutation({
    mutationFn: (id: number) => maintenanceApi.deleteTicket(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assets });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete ticket');
    },
  });

  return {
    createTicket,
    updateTicket,
    updateTicketStatus,
    assignTicket,
    deleteTicket,
  };
};
