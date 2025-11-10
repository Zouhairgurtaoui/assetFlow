export type AssetStatus = 'Available' | 'Assigned' | 'Under Maintenance' | 'In Repair' | 'Retired';
export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface Asset {
  id: number;
  name: string;
  description: string;
  category: string;
  serial_number: string;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiration: string | null;
  status: AssetStatus;
  condition: AssetCondition;
  assigned_to_user_id: number | null;
  location: string;
  created_at: string;
  updated_at: string;
  depreciation?: DepreciationInfo;
}

export interface DepreciationInfo {
  purchase_price: number;
  current_value: number;
  total_depreciation: number;
  depreciation_rate: number;
  years_elapsed: number;
  useful_life_years: number;
}

export interface AssetFilters {
  category?: string;
  status?: AssetStatus;
  assigned_to?: number;
  department?: string;
  purchase_date_from?: string;
  purchase_date_to?: string;
  warranty_expiring_days?: number;
  search?: string;
  include_depreciation?: boolean;
}

export interface CreateAssetData {
  name: string;
  description?: string;
  category: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiration?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  location?: string;
}

export interface AssignAssetData {
  user_id: number;
}

export interface AssetHistoryEntry {
  id: number;
  asset_id: number;
  action: string;
  details: string;
  performed_by_user_id: number;
  performed_by?: string;
  from_user_id: number | null;
  from_user?: string;
  to_user_id: number | null;
  to_user?: string;
  metadata: any;
  created_at: string;
}
