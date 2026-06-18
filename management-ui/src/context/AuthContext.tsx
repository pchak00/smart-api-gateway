import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from '../api/client';
import { getTokenRole, getTokenUsername, isTokenExpired } from '../utils/jwt';
import { AdminRole, LoginRequest } from '../types';
import { canMutate as canRoleMutate } from '../utils/roles';

interface AuthContextType {
  token: string | null;
  role: AdminRole | null;
  username: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  canMutate: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('smart-gateway:token');
    const storedRole = storedToken ? getTokenRole(storedToken) : null;

    if (storedToken && storedRole && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setRole(storedRole);
      setUsername(getTokenUsername(storedToken));
    } else if (storedToken) {
      // Token expired or malformed, clear it.
      localStorage.removeItem('smart-gateway:token');
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await api.login(credentials);
      const newToken = response.token;
      const decodedRole = getTokenRole(newToken);

      if (!decodedRole || isTokenExpired(newToken)) {
        throw new Error('Login returned an invalid token');
      }

      // Store token
      localStorage.setItem('smart-gateway:token', newToken);
      setToken(newToken);
      setRole(decodedRole);
      setUsername(getTokenUsername(newToken));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('smart-gateway:token');
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  const isAuthenticated = !!token && !!role && !isTokenExpired(token);
  const canMutate = canRoleMutate(role);
  const isSuperAdmin = canMutate;

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        username,
        isAuthenticated,
        isSuperAdmin,
        canMutate,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
