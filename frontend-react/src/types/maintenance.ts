import { Asset } from './asset';
import { User } from './auth';

export type TicketStatus = 'New' | 'Under Review' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface MaintenanceTicket {
  id: number;
  asset_id: number;
  reported_by_user_id: number;
  assigned_to_user_id: number | null;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  resolution_notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  asset?: Asset;
  reporter?: User;
  assignee?: User;
}

export interface CreateTicketData {
  asset_id: number;
  title: string;
  description: string;
  priority?: TicketPriority;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  resolution_notes?: string;
}

export interface UpdateTicketStatusData {
  status: TicketStatus;
}

export interface AssignTicketData {
  user_id: number;
}

export interface MaintenanceFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  asset_id?: number;
  reported_by?: number;
  assigned_to?: number;
}
