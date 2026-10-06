import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/index.js';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  users: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('taskflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch team users', err);
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      await fetchUsers();

      const savedToken = localStorage.getItem('taskflow_token');
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const json = await res.json();
          if (json.success) {
            setCurrentUser(json.data);
            setToken(savedToken);
          } else {
            localStorage.removeItem('taskflow_token');
            setToken(null);
            setCurrentUser(null);
          }
        } catch {
          localStorage.removeItem('taskflow_token');
          setToken(null);
          setCurrentUser(null);
        }
      } else {
        // Automatically log in as default demo Lead for an immediate ready-to-use experience
        try {
          const res = await fetch('/api/auth/demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'LEAD' }),
          });
          const json = await res.json();
          if (json.success) {
            localStorage.setItem('taskflow_token', json.data.token);
            setToken(json.data.token);
            setCurrentUser(json.data.user);
          }
        } catch (e) {
          console.warn('Could not auto-login demo user', e);
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, [fetchUsers]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('taskflow_token', json.data.token);
        setToken(json.data.token);
        setCurrentUser(json.data.user);
        await fetchUsers();
        return { success: true };
      }
      return { success: false, error: json.error?.message || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error communicating with server' };
    }
  };

  const register = async (email: string, password: string, fullName: string, role?: UserRole) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('taskflow_token', json.data.token);
        setToken(json.data.token);
        setCurrentUser(json.data.user);
        await fetchUsers();
        return { success: true };
      }
      return { success: false, error: json.error?.message || 'Registration failed' };
    } catch {
      return { success: false, error: 'Network error communicating with server' };
    }
  };

  const demoLogin = async (role?: UserRole) => {
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (json.success) {
        localStorage.setItem('taskflow_token', json.data.token);
        setToken(json.data.token);
        setCurrentUser(json.data.user);
        await fetchUsers();
        return { success: true };
      }
      return { success: false, error: 'Demo login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore logout errors
      }
    }
    localStorage.removeItem('taskflow_token');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        users,
        login,
        register,
        demoLogin,
        logout,
        refreshUsers: fetchUsers,
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
