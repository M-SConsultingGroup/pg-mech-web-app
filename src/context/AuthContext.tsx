'use client';
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { User } from '@/common/interfaces';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  username: string;
  isAdmin: boolean;
  isPermissionsLoading: boolean;
}

interface DecodedToken extends JwtPayload {
  username: string;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState({
    isLoggedIn: false,
    username: '',
    isAdmin: false,
    isPermissionsLoading: true
  });

  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('authState');
    router.push('/login');
  }, [router]);

  const initializeAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState(prev => ({ ...prev, isPermissionsLoading: false }));
      return;
    }

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);

      // Check for expired token
      if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
        logout();
        return;
      }

      // Try to get persisted state first
      const persistedState = localStorage.getItem('authState');
      const initialAuthState = persistedState
        ? JSON.parse(persistedState)
        : {
          isLoggedIn: true,
          username: decodedToken.username,
          isAdmin: decodedToken.isAdmin
        };

      setState({
        ...initialAuthState,
        isPermissionsLoading: false
      });

      // Persist the full state
      localStorage.setItem('authState', JSON.stringify(initialAuthState));
    } catch (error) {
      console.error('Auth initialization failed:', error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = (user: User, token: string) => {
    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      const authState = {
        isLoggedIn: true,
        username: decodedToken.username,
        isAdmin: decodedToken.isAdmin,
        isPermissionsLoading: false
      };

      setState(authState);
      localStorage.setItem('token', token);
      localStorage.setItem('authState', JSON.stringify(authState));
    } catch (error) {
      console.error('Login failed:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn: state.isLoggedIn,
      login,
      logout,
      username: state.username,
      isAdmin: state.isAdmin,
      isPermissionsLoading: state.isPermissionsLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};