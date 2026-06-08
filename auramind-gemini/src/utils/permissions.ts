import { UserRole } from '../types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.OWNER]: 100,
  [UserRole.CEO]: 90,
  [UserRole.ADMIN]: 80,
  [UserRole.EMPLOYEE]: 50,
  [UserRole.USER]: 10
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.OWNER]: 'Owner',
  [UserRole.CEO]: 'CEO',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.EMPLOYEE]: 'Employee',
  [UserRole.USER]: 'User'
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.OWNER]: 'Full system access, can manage all roles and settings',
  [UserRole.CEO]: 'Executive access, can manage admins and view all data',
  [UserRole.ADMIN]: 'Administrative access, can manage users and content',
  [UserRole.EMPLOYEE]: 'Staff access, can view analytics and manage basic operations',
  [UserRole.USER]: 'Standard user access'
};

export interface Permission {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewAnalytics: boolean;
  canManageCoupons: boolean;
  canManageSettings: boolean;
  canViewAllData: boolean;
  canDeleteUsers: boolean;
  canAccessAdminPanel: boolean;
  hasFreeAccess: boolean;
}

export const getPermissions = (role: UserRole = UserRole.USER): Permission => {
  const level = ROLE_HIERARCHY[role];

  return {
    canManageUsers: level >= ROLE_HIERARCHY[UserRole.ADMIN],
    canManageRoles: level >= ROLE_HIERARCHY[ROLE_HIERARCHY[UserRole.CEO] ? UserRole.CEO : UserRole.OWNER],
    canViewAnalytics: level >= ROLE_HIERARCHY[UserRole.EMPLOYEE],
    canManageCoupons: level >= ROLE_HIERARCHY[UserRole.ADMIN],
    canManageSettings: level >= ROLE_HIERARCHY[UserRole.CEO],
    canViewAllData: level >= ROLE_HIERARCHY[UserRole.CEO],
    canDeleteUsers: level >= ROLE_HIERARCHY[UserRole.OWNER],
    canAccessAdminPanel: level >= ROLE_HIERARCHY[UserRole.ADMIN],
    hasFreeAccess: level >= ROLE_HIERARCHY[UserRole.ADMIN]
  };
};

export const canManageRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
  const managerLevel = ROLE_HIERARCHY[managerRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  // Can only manage roles with lower or equal level
  // Owner can manage everyone
  if (managerRole === UserRole.OWNER) return true;
  
  // CEO can manage everyone except Owner
  if (managerRole === UserRole.CEO) return targetRole !== UserRole.OWNER;
  
  // Admin can manage employees and users
  if (managerRole === UserRole.ADMIN) {
    return targetLevel <= ROLE_HIERARCHY[UserRole.EMPLOYEE];
  }
  
  // Employees and users cannot manage roles
  return false;
};

export const getDefaultRole = (email?: string): UserRole => {
  if (email === 'matty.cigemp@gmail.com') return UserRole.OWNER;
  return UserRole.USER;
};

export const isAdminOrHigher = (role: UserRole): boolean => {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[UserRole.ADMIN];
};

export const isEmployeeOrHigher = (role: UserRole): boolean => {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[UserRole.EMPLOYEE];
};


