import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { supabase } from '@/integrations/supabase/client';
import { signInWithGoogle } from '@/lib/google-auth';

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Restore session on reload
  useEffect(() => {
    console.log('[Auth] Initializing auth context');

    supabase.auth.getSession().then(({ data, error }) => {
      console.log('[Auth] getSession:', { data, error });

      if (data?.session?.user) {
        console.log('[Auth] Session user:', data.session.user.email);
        setUser(data.session.user);
      }

      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Auth state change:', event, session);

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔹 Email/password login
  const login = useCallback(async (email, password) => {
    console.log('[Auth] login called with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Supabase login failed:', error.message);
      return { success: false, error: error.message };
    }

    if (data.user) {
      console.log('[Auth] Supabase login successful:', data.user.email);
      // The onAuthStateChange listener will handle setting the user state
      return { success: true };
    }

    return { success: false, error: 'Login failed: Unknown error' };
  }, []);


  // 🔹 Google login
  const loginWithGoogle = useCallback(async () => {
    console.log('[Auth] loginWithGoogle called');

    try {
      await signInWithGoogle();
      console.log('[Auth] Redirecting to Google...');
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Google login failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // 🔹 Logout
  const logout = async () => {
    console.log('[Auth] Logging out');

    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

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
