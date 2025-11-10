import { UserRole } from './auth';

export interface UpdateUserData {
  role?: UserRole;
  department?: string;
  email?: string;
  is_active?: boolean;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}
