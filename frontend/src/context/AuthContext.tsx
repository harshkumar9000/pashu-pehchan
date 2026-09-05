import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import * as authService from '../services/api/auth';
import { setAuthToken } from '../services/api/client';
import { getItem, setItem, removeItem } from '../components/adapters/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initial synchronous/awaited session load from storage with verification
    const loadSession = async () => {
      try {
        const savedToken = await getItem('vetra_auth_token');
        const savedUserStr = await getItem('vetra_user');

        if (savedToken && savedUserStr) {
          setAuthToken(savedToken);
          setToken(savedToken);
          try {
            setUser(JSON.parse(savedUserStr));
          } catch {}

          // Verify with /api/auth/me to confirm token is still cryptographically valid
          try {
            const me = await authService.getMe();
            if (me && me.id) {
              setUser(me);
            }
          } catch (meErr) {
            console.warn('Saved session token expired or invalid, auto-recovering demo farmer session:', meErr);
            // Recover demo farmer session cleanly
            try {
              const data = await authService.login('farmer@vetra.in', 'farmer123');
              setAuthToken(data.access_token);
              setToken(data.access_token);
              setUser(data.user);
            } catch (reLoginErr) {
              console.warn('Auto re-login failed:', reLoginErr);
            }
          }
        } else {
          // Auto-login as Ramesh (Farmer) by default for demo seamlessness
          try {
            const data = await authService.login('farmer@vetra.in', 'farmer123');
            setAuthToken(data.access_token);
            setToken(data.access_token);
            setUser(data.user);
          } catch (loginErr) {
            console.warn('Initial demo farmer auto-login failed:', loginErr);
          }
        }
      } catch (err) {
        console.warn('Auth session load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, pass);
      setAuthToken(data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const data = await authService.register(payload);
      setAuthToken(data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      let email = 'farmer@vetra.in';
      let pass = 'farmer123';
      if (targetRole === 'MIDDLEMAN') {
        email = 'middleman@vetra.in';
        pass = 'trade123';
      } else if (targetRole === 'ADMIN') {
        email = 'admin@vetra.in';
        pass = 'admin123';
      }
      const data = await authService.login(email, pass);
      setAuthToken(data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } catch (err: any) {
      console.error('switchDemoRole error:', err);
      throw new Error('Unable to switch account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
