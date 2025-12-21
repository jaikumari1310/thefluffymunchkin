import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { supabase } from '@/integrations/supabase/client';
import { signInWithGoogle } from '@/lib/google-auth';
import {
  authenticateUser,
  validateSession,
  deleteSessionByToken,
} from '@/lib/auth-db';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleSession = useCallback(async () => {
    setIsLoading(true);

    const localToken = localStorage.getItem('auth_token');
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();

    if (localToken) {
      const { user } = await validateSession(localToken);
      if (user) {
        setUser(user);
      } else {
        localStorage.removeItem('auth_token');
      }
    } else if (supabaseSession) {
      setUser(supabaseSession.user);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    handleSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [handleSession]);

  const login = useCallback(async (username, password) => {
    const result = await authenticateUser(username, password);
    if (result) {
      localStorage.setItem('auth_token', result.session.token);
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithGoogle();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    const localToken = localStorage.getItem('auth_token');
    if (localToken) {
      await deleteSessionByToken(localToken);
      localStorage.removeItem('auth_token');
    }
    
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
