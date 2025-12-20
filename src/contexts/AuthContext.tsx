import { signInWithGoogle } from '@/lib/google-auth';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isGoogleUserApproved } from '@/lib/approved-users';

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
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = 'gst_billing_session_token';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Get stored session token securely
  const getStoredToken = useCallback((): string | null => {
    try {
      return sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  }, []);

  // Store session token securely
  const storeToken = useCallback((token: string) => {
    try {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to store session token:', e);
    }
  }, []);

  // Clear session token
  const clearToken = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear session token:', e);
    }
  }, []);

  // Validate and restore session
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
    } catch (error) {
      console.error('Session validation error:', error);
      clearToken();
    } finally {
      setIsLoading(false);
    }
  }, [getStoredToken, clearToken]);

  // Initialize auth database and restore session
  useEffect(() => {
    const init = async () => {
      await initializeAuthDB();
      await refreshSession();
    };
    init();
  }, [refreshSession]);

  // Track user activity for auto-logout
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    
    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  // Auto-logout on inactivity
  useEffect(() => {
    if (!session) return;

    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [session, lastActivity]);

  // Prevent back button access after logout
  useEffect(() => {
    if (!isLoading && !user) {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isLoading, user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authenticateUser(username, password);
      
      if (!result) {
        return { success: false, error: 'Invalid username or password' };
      }

      setUser(result.user);
      setSession(result.session);
      storeToken(result.session.token);
      setLastActivity(Date.now());

      return { success: true };
    } catch (error) {
	  console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

const loginWithGoogle = async () => {
  try {
    const googleUser = await signInWithGoogle(); // your existing call

    const email = googleUser?.email?.toLowerCase();

    if (!email) {
      throw new Error('Unable to read Google account email');
    }

    // ✅ STEP 3: CHECK WHITELIST
    const { data, error } = await supabase
      .from('approved_google_users')
      .select('email, role')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Whitelist lookup error:', error);
      throw new Error('Access verification failed');
    }

    if (!data) {
      throw new Error('This Google account is not approved');
    }
								

    // ✅ ALLOWED
    return { success: true, role: data.role };

  } catch (err: any) {
    console.log('Google email:', email);
    console.error('Google login error:', err);
    return { success: false, error: err.message };
  }
};

  const logout = async () => {
    const token = getStoredToken();
    if (token) {
      await deleteSessionByToken(token);
    }
    
    setUser(null);
    setSession(null);
    clearToken();
    
    // Clear any cached data
    window.history.pushState(null, '', '/login');
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
