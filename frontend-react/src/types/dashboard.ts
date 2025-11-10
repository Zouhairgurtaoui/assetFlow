export interface DashboardStats {
  assets: {
    total: number;
    available: number;
    assigned: number;
    under_maintenance: number;
    retired: number;
    total_value: number;
  };
  maintenance: {
    total: number;
    open: number;
    resolved: number;
  };
  users: {
    total: number;
  };
  licenses: {
    total: number;
    active: number;
    expired: number;
  };
}

export interface CategoryData {
  category: string;
  count: number;
}

export interface DepartmentData {
  department: string;
  count: number;
}

export interface StatusData {
  status: string;
  count: number;
}

export interface MaintenanceStats {
  by_status: { status: string; count: number }[];
  by_priority: { priority: string; count: number }[];
  avg_resolution_hours: number;
  recent_tickets_30days: number;
}

export interface AssetValueSummary {
  total_purchase_value: number;
  total_current_value: number;
  total_depreciation: number;
  depreciation_rate: number;
}
