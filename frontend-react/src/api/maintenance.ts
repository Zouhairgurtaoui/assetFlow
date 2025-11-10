import api from './axios';
import {
  MaintenanceTicket,
  CreateTicketData,
  UpdateTicketData,
  UpdateTicketStatusData,
  AssignTicketData,
  MaintenanceFilters
} from '@/types/maintenance';

export const maintenanceApi = {
  getTickets: async (filters?: MaintenanceFilters): Promise<MaintenanceTicket[]> => {
    const response = await api.get('/maintenance/', { params: filters });
    return response.data;
  },

  getTicket: async (id: number): Promise<MaintenanceTicket> => {
    const response = await api.get(`/maintenance/${id}`);
    return response.data;
  },

  createTicket: async (data: CreateTicketData): Promise<{ message: string; ticket: MaintenanceTicket }> => {
    const response = await api.post('/maintenance/', data);
    return response.data;
  },

  updateTicket: async (id: number, data: UpdateTicketData): Promise<{ message: string; ticket: MaintenanceTicket }> => {
    const response = await api.put(`/maintenance/${id}`, data);
    return response.data;
  },

  updateTicketStatus: async (id: number, data: UpdateTicketStatusData): Promise<{ message: string; ticket: MaintenanceTicket }> => {
    const response = await api.put(`/maintenance/${id}/status`, data);
    return response.data;
  },

  assignTicket: async (id: number, data: AssignTicketData): Promise<{ message: string; ticket: MaintenanceTicket }> => {
    const response = await api.put(`/maintenance/${id}/assign`, data);
    return response.data;
  },

  deleteTicket: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/maintenance/${id}`);
    return response.data;
  },

  uploadAttachment: async (id: number, file: File): Promise<{ message: string; file_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/maintenance/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
