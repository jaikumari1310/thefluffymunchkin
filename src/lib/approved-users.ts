import { supabase } from '@/integrations/supabase/client';

export async function isGoogleUserApproved(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('approved_google_users')
    .select('email')
    .eq('email', email)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

