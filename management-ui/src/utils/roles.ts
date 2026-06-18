import { AdminRole } from '../types';

export const isSuperAdminRole = (role: AdminRole | string | null): role is 'SUPER_ADMIN' =>
  role === 'SUPER_ADMIN';

export const canMutate = (role: AdminRole | string | null) => isSuperAdminRole(role);

export const getRoleLabel = (role: AdminRole | string | null) => {
  if (role === 'SUPER_ADMIN') return 'Admin';
  if (role === 'READ_ONLY_ADMIN') return 'Viewer';
  return 'Unknown';
};
