export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const USER_ROLES = ['Admin', 'Asset Manager', 'HR', 'Employee'] as const;
export const ROLES = USER_ROLES; // Alias for compatibility

export const ASSET_CATEGORIES = [
  'Computer',
  'Laptop',
  'Monitor',
  'Printer',
  'Phone',
  'Tablet',
  'Server',
  'Network Equipment',
  'Furniture',
  'Software',
  'Other'
];

export const ASSET_STATUSES = [
  'Available',
  'Assigned',
  'Under Maintenance',
  'In Repair',
  'Retired'
] as const;

export const ASSET_CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor'
] as const;

export const TICKET_STATUSES = [
  'New',
  'Under Review',
  'In Progress',
  'Resolved',
  'Closed'
] as const;

export const TICKET_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Critical'
] as const;

export const QUERY_KEYS = {
  auth: ['auth'],
  users: ['users'],
  user: (id: number) => ['user', id],
  assets: ['assets'],
  asset: (id: number) => ['asset', id],
  assetHistory: (id: number) => ['assetHistory', id],
  maintenance: ['maintenance'],
  ticket: (id: number) => ['ticket', id],
  dashboard: ['dashboard'],
  dashboardStats: ['dashboard', 'stats'],
  assetsByCategory: ['dashboard', 'assetsByCategory'],
  assetsByDepartment: ['dashboard', 'assetsByDepartment'],
  assetsByStatus: ['dashboard', 'assetsByStatus'],
  warrantyExpiring: ['dashboard', 'warrantyExpiring'],
  recentActivities: ['dashboard', 'recentActivities'],
  maintenanceStats: ['dashboard', 'maintenanceStats']
};
