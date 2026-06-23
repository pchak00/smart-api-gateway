import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, api } from '../api/client';
import { getTokenExpiryMs, getTokenRole, getTokenUsername, isTokenExpired } from '../utils/jwt';
import { AdminRole, LoginRequest, LoginResponse } from '../types';
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

const REFRESH_BEFORE_EXPIRY_MS = 60_000;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((session: LoginResponse) => {
    const decodedRole = getTokenRole(session.token) ?? session.role;

    if (!decodedRole || isTokenExpired(session.token)) {
      throw new Error('Session returned an invalid token');
    }

    api.storeSession(session);
    setToken(session.token);
    setRole(decodedRole);
    setUsername(getTokenUsername(session.token) ?? session.username);
  }, []);

  const clearSession = useCallback(() => {
    api.clearStoredSession();
    setToken(null);
    setRole(null);
    setUsername(null);
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedRole = storedToken ? getTokenRole(storedToken) : null;

      if (storedToken && storedRole && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        setRole(storedRole);
        setUsername(getTokenUsername(storedToken));
      } else if (storedRefreshToken) {
        try {
          const refreshedSession = await api.refreshAccessToken();
          if (isMounted) {
            applySession(refreshedSession);
          }
        } catch (error) {
          console.error('Session refresh failed:', error);
          if (isMounted) {
            clearSession();
          }
        }
      } else if (storedToken) {
        clearSession();
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [applySession, clearSession]);

  useEffect(() => {
    api.setAuthCallbacks({
      onSessionRefreshed: (session) => {
        applySession(session);
      },
      onSessionExpired: () => {
        clearSession();
      }
    });

    return () => {
      api.setAuthCallbacks({});
    };
  }, [applySession, clearSession]);

  useEffect(() => {
    if (!token) return;

    const expiresAt = getTokenExpiryMs(token);
    if (!expiresAt) return;

    const remainingMs = expiresAt - Date.now();
    const refreshLeadTime = Math.min(REFRESH_BEFORE_EXPIRY_MS, Math.floor(remainingMs / 2));
    const delay = Math.max(remainingMs - refreshLeadTime, 1000);
    const timeoutId = window.setTimeout(() => {
      api.refreshAccessToken().catch((error) => {
        console.error('Session refresh failed:', error);
        clearSession();
      });
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [clearSession, token]);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await api.login(credentials);
      applySession(response);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    api.logout().catch((error) => {
      console.error('Logout request failed:', error);
    });
    clearSession();
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
