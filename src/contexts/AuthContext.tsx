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
