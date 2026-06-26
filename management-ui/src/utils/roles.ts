import { AdminRole } from '../types';

export const isOwnerRole = (role: AdminRole | string | null): role is 'OWNER' =>
  role === 'OWNER';

export const isSuperAdminRole = (role: AdminRole | string | null): role is 'SUPER_ADMIN' =>
  role === 'SUPER_ADMIN';

export const isOperationalAdminRole = (role: AdminRole | string | null) =>
  isOwnerRole(role) || isSuperAdminRole(role);

export const canMutate = (role: AdminRole | string | null) => isOperationalAdminRole(role);

export const canAccessAdminUsers = (role: AdminRole | string | null) => isOperationalAdminRole(role);

export const canManageAdminUser = (
  actorRole: AdminRole | string | null,
  targetRole: AdminRole | string | null
) => {
  if (isOwnerRole(actorRole)) return true;
  return isSuperAdminRole(actorRole) && targetRole === 'READ_ONLY_ADMIN';
};

export const getAssignableRoles = (role: AdminRole | string | null): AdminRole[] => {
  if (isOwnerRole(role)) return ['OWNER', 'SUPER_ADMIN', 'READ_ONLY_ADMIN'];
  if (isSuperAdminRole(role)) return ['READ_ONLY_ADMIN'];
  return [];
};

export const getRoleLabel = (role: AdminRole | string | null) => {
  if (role === 'OWNER') return 'Owner';
  if (role === 'SUPER_ADMIN') return 'Admin';
  if (role === 'READ_ONLY_ADMIN') return 'Viewer';
  return 'Unknown';
};
