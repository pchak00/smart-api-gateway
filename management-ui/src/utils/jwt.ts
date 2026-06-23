import { jwtDecode } from 'jwt-decode';
import { AdminRole } from '../types';

export interface DecodedToken {
  sub: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

const isAdminRole = (role: unknown): role is AdminRole =>
  role === 'SUPER_ADMIN' || role === 'READ_ONLY_ADMIN';

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const now = Date.now() / 1000;
  return decoded.exp < now;
};

export const getTokenExpiryMs = (token: string): number | null => {
  const decoded = decodeToken(token);
  return decoded ? decoded.exp * 1000 : null;
};

export const getTokenRole = (token: string): AdminRole | null => {
  const decoded = decodeToken(token);
  return isAdminRole(decoded?.role) ? decoded.role : null;
};

export const getTokenUsername = (token: string): string | null => {
  const decoded = decodeToken(token);
  return decoded?.sub || null;
};
