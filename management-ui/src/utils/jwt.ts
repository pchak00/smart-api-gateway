import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  sub: string;
  role: 'SUPER_ADMIN' | 'READ_ONLY_ADMIN';
  iat: number;
  exp: number;
}

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

export const getTokenRole = (token: string): 'SUPER_ADMIN' | 'READ_ONLY_ADMIN' | null => {
  const decoded = decodeToken(token);
  return decoded?.role || null;
};

