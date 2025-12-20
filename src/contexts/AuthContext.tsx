import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { supabase } from '@/integrations/supabase/client';

import {
  User,
  AuthSession,
  authenticateUser,
  validateSession,
  deleteSessionByToken,
  initializeAuthDB,
} from '@/lib/auth-db';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'gst_billing_session_token';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  /* ---------------- Session helpers ---------------- */

  const getStoredToken = useCallback(() => {
    try {
      return sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  }, []);

  const storeToken = useCallback((token: string) => {
    try {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch {}
  }, []);

  const clearToken = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {}
  }, []);

  /* ---------------- Restore session ---------------- */

  const refreshSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await validateSession(token);
      if (result) {
        setUser(result.user);
        setSession(result.session);
      } else {
        clearToken();
      }
    } catch {
      clearToken();
    } finally {
      setIsLoading(false);
    }
  }, [getStoredToken, clearToken]);

  useEffect(() => {
    (async () => {
      await initializeAuthDB();
      await refreshSession();
    })();
  }, [refreshSession]);

  /* ---------------- Google OAuth ---------------- */

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // OAuth redirects — no further code runs here
      return { success: true };

    } catch (err: any) {
      console.error('Google login error:', err);
      return { success: false, error: err.message };
    }
  };

  /* ---------------- Supabase session listener ---------------- */

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== 'SIGNED_IN' || !session?.user?.email) return;

        const email = session.user.email.toLowerCase();
        console.log('Google email:', email);

        const { data, error } = await supabase
          .from('approved_google_users')
          .select('email, role')
          .eq('email', email)
          .maybeSingle();

        if (error || !data) {
          await supabase.auth.signOut();
          alert('This Google account is not approved');
          return;
        }

        console.log('Google user approved:', data.email);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ---------------- Username / Password login ---------------- */

  const login = async (username: string, password: string) => {
    try {
      const result = await authenticateUser(username, password);
      if (!result) return { success: false, error: 'Invalid credentials' };

      setUser(result.user);
      setSession(result.session);
      storeToken(result.session.token);
      setLastActivity(Date.now());

      return { success: true };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  };

  /* ---------------- Logout ---------------- */

  const logout = async () => {
    const token = getStoredToken();
    if (token) await deleteSessionByToken(token);

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearToken();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session,
        login,
        loginWithGoogle,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
