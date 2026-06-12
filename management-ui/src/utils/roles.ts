import { AdminRole } from '../types';

export const getRoleLabel = (role: AdminRole | null) => {
  if (role === 'SUPER_ADMIN') return 'Owner';
  if (role === 'READ_ONLY_ADMIN') return 'Viewer';
  return 'Unknown';
};
