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
}

interface DecodedToken extends JwtPayload {
  username: string;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUsername('');
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode<DecodedToken>(token);
      if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
        logout();
      } else {
        setIsLoggedIn(true);
        setUsername(decodedToken.username);
        setIsAdmin(decodedToken.isAdmin); 
      }
    }
  }, [logout]);

  const login = (user: User, token: string) => {
    setIsLoggedIn(true);
    setUsername(user.username);
    setIsAdmin(user.isAdmin);
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, username, isAdmin }}>
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