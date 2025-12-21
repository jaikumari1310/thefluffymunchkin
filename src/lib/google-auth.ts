// src/lib/google-auth.ts
import { supabase } from '@/integrations/supabase/client';

export async function signInWithGoogle() {
  console.log('[GoogleAuth] Starting Google OAuth flow');
  console.log('[GoogleAuth] Redirect origin:', window.location.origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // ✅ PRODUCTION ONLY
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('[GoogleAuth] signInWithOAuth error:', error);
    throw error;
  }

  console.log('[GoogleAuth] OAuth redirect initiated:', data);
  return data;
}

