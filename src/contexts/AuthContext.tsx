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
  authenticateGoogleUser,
  validateSession,
  deleteSessionByToken,
  initializeAuthDB,
} from '@/lib/auth-db';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'gst_billing_session_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------------- Session helpers ---------------- */

  const getStoredToken = () => {
    try {
      return sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  };

  const storeToken = (token: string) => {
    try {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch {}
  };

  const clearToken = () => {
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {}
  };

  /* ---------------- Restore local session ---------------- */

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await initializeAuthDB();
      await refreshSession();
    })();
  }, [refreshSession]);

  /* ---------------- Google OAuth (ONLY REDIRECT) ---------------- */

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      console.error('Google OAuth start failed:', err);
      return { success: false, error: err.message };
    }
  };

  /* ---------------- Handle OAuth callback ---------------- */

  useEffect(() => {
    const handleOAuthLogin = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const email = data.session.user.email?.toLowerCase();
      if (!email) return;

      // ✅ STEP 3 — whitelist check (THIS is the correct place)
      const { data: approved } = await supabase
        .from('approved_google_users')
        .select('email, role')
        .eq('email', email)
        .maybeSingle();

      if (!approved) {
        await supabase.auth.signOut();
        alert('This Google account is not approved');
        return;
      }

      // ✅ Create / sync local user
      const result = await authenticateGoogleUser(email, approved.role);

      setUser(result.user);
      setSession(result.session);
      storeToken(result.session.token);
    };

    handleOAuthLogin();
  }, []);

  /* ---------------- Username / Password login ---------------- */

  const login = async (username: string, password: string) => {
    try {
      const result = await authenticateUser(username, password);
      if (!result) {
        return { success: false, error: 'Invalid credentials' };
      }

      setUser(result.user);
      setSession(result.session);
      storeToken(result.session.token);
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
    clearToken();
    setUser(null);
    setSession(null);
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
