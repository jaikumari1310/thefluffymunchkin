import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User extends SupabaseUser {
  role?: 'admin' | 'staff';
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
      }

      // If no profile exists, check approved_google_users for Google OAuth users
      if (!profile && authUser.email) {
        const { data: approvedUser } = await supabase
          .from('approved_google_users')
          .select('role')
          .eq('email', authUser.email.toLowerCase())
          .maybeSingle();

        if (approvedUser) {
          // Create profile for Google OAuth user
          await supabase
            .from('profiles')
            .insert({ id: authUser.id, role: approvedUser.role })
            .select()
            .maybeSingle();

          return {
            ...authUser,
            role: approvedUser.role as 'admin' | 'staff',
            displayName: authUser.user_metadata?.name || authUser.email || 'User',
          };
        }
      }

      return {
        ...authUser,
        role: (profile?.role as 'admin' | 'staff') || 'staff',
        displayName: authUser.user_metadata?.name || authUser.email || 'User',
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return {
        ...authUser,
        role: 'staff',
        displayName: authUser.user_metadata?.name || authUser.email || 'User',
      };
    }
  };

  useEffect(() => {
    // On initial load, fetch the current session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user);
        setUser(userWithProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Set up a listener for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const userWithProfile = await fetchUserProfile(session.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      // Clean up the listener when the component unmounts
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid login credentials' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // The user will be redirected, so we don't need to set state here.
      // The onAuthStateChange listener will handle it upon their return.
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in failed' };
    } finally {
      // Don't set loading to false here, as a redirect is expected.
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    // No need to manually redirect, the App/Router should handle the unauthenticated state.
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !isLoading && !!user,
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
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
