import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from '../api/client';
import { decodeToken, getTokenRole, isTokenExpired } from '../utils/jwt';
import { LoginRequest } from '../types';

interface AuthContextType {
  token: string | null;
  role: 'SUPER_ADMIN' | 'READ_ONLY_ADMIN' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'SUPER_ADMIN' | 'READ_ONLY_ADMIN' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('smart-gateway:token');
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      const decodedRole = getTokenRole(storedToken);
      setRole(decodedRole);
    } else if (storedToken) {
      // Token expired, clear it
      localStorage.removeItem('smart-gateway:token');
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await api.login(credentials);
      const newToken = response.token;

      // Store token
      localStorage.setItem('smart-gateway:token', newToken);
      setToken(newToken);

      // Decode and set role
      const decodedRole = getTokenRole(newToken);
      setRole(decodedRole);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('smart-gateway:token');
    setToken(null);
    setRole(null);
  };

  const isAuthenticated = !!token && !isTokenExpired(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

