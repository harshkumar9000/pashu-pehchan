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
  login: (email: string, pass: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
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
          } catch (verifyErr) {
            // Token expired or invalid, clear and attempt fallback re-login
            await removeItem('vetra_auth_token');
            await removeItem('vetra_user');
            setAuthToken(null);
            setToken(null);
            setUser(null);
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
            console.log('[Auth] Backend offline, using demo farmer profile for client-side mode');
            const demoFarmer: User = {
              id: 1,
              email: 'farmer@vetra.in',
              name: 'Ramesh Patel',
              role: 'FARMER',
              phone: '+91 98765 43210',
              district: 'Anand',
              state: 'Gujarat',
              created_at: new Date().toISOString(),
            };
            setUser(demoFarmer);
            setToken('demo-token-farmer');
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

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, pass);
      setAuthToken(data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authService.register(payload);
      setAuthToken(data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
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
      try {
        const data = await authService.login(email, pass);
        setAuthToken(data.access_token);
        setToken(data.access_token);
        setUser(data.user);
      } catch (loginErr) {
        // Fallback for offline / Vercel client mode
        const demoUsers: Record<UserRole, User> = {
          FARMER: {
            id: 1,
            email: 'farmer@vetra.in',
            name: 'Ramesh Patel',
            role: 'FARMER',
            phone: '+91 98765 43210',
            district: 'Anand',
            state: 'Gujarat',
            created_at: new Date().toISOString(),
          },
          MIDDLEMAN: {
            id: 2,
            email: 'middleman@vetra.in',
            name: 'Kishore Verma',
            role: 'MIDDLEMAN',
            phone: '+91 98111 22334',
            district: 'Mathura',
            state: 'Uttar Pradesh',
            created_at: new Date().toISOString(),
          },
          ADMIN: {
            id: 3,
            email: 'admin@vetra.in',
            name: 'Dr. Sunita Rao',
            role: 'ADMIN',
            phone: '+91 99000 11223',
            district: 'Karnal',
            state: 'Haryana',
            created_at: new Date().toISOString(),
          },
        };
        const demo = demoUsers[targetRole];
        setUser(demo);
        setToken('demo-token-' + targetRole.toLowerCase());
      }
    } catch (err: any) {
      console.error('switchDemoRole error:', err);
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
