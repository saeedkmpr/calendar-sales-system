import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isOperator: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore user synchronously from localStorage so the app renders immediately without any black-screen delay
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  // Never block the initial render with a full-screen loader
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Check session in background with a 6-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } else if (res.status === 401) {
          // Token is genuinely invalid/expired, log out
          if (isMounted) {
            logout();
          }
        }
      } catch (error) {
        // If server is warming up or network was aborted, keep cached user session so app doesn't freeze
        console.warn('Session verification notice (using cached session):', error);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isOperator = user?.role === 'OPERATOR';
  const canEdit = isAdmin || isOperator;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin,
        isOperator,
        canEdit,
      }}
    >
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
