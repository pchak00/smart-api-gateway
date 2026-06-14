import { AdminRole } from '../types';

export const getRoleLabel = (role: AdminRole | string | null) => {
  if (role === 'SUPER_ADMIN') return 'Admin';
  if (role === 'READ_ONLY_ADMIN') return 'Viewer';
  return 'Unknown';
};
