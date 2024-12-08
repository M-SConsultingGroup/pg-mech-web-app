'use client';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as jwtDecode from 'jwt-decode';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (username: string, token: string) => void;
  logout: () => void;
  username: string;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode.jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        logout();
      } else {
        setIsLoggedIn(true);
        setUsername(decodedToken.username);
        setIsAdmin(decodedToken.isAdmin); 
      }
    }
  }, []);

  const login = (username: string, token: string) => {
    const decodedToken: any = jwtDecode.jwtDecode(token);
    setIsLoggedIn(true);
    setUsername(username);
    setIsAdmin(decodedToken.isAdmin);
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
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