import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ApprovedGoogleUser {
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export const getApprovedGoogleUsers = async (): Promise<ApprovedGoogleUser[]> => {
  const { data, error } = await supabase.from('approved_google_users').select('*');
  if (error) throw error;
  return data;
};

export const addApprovedGoogleUser = async (email: string, role: 'admin' | 'staff'): Promise<ApprovedGoogleUser> => {
  const { data, error } = await supabase
    .from('approved_google_users')
    .insert([{ email: email.toLowerCase(), role }])
    .select();
  if (error) throw error;
  return data[0];
};

export const removeApprovedGoogleUser = async (email: string): Promise<void> => {
  const { error } = await supabase.from('approved_google_users').delete().eq('email', email.toLowerCase());
  if (error) throw error;
};
