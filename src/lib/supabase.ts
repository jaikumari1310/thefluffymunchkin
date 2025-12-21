import { createClient } from '@supabase/supabase-js';
import { Database } from '../integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type ApprovedGoogleUser = Database['public']['Tables']['approved_google_users']['Row'];
export type UserRole = Database['public']['Enums']['user_role'];

// Function to get all approved Google users
export async function getApprovedGoogleUsers(): Promise<ApprovedGoogleUser[]> {
  const { data, error } = await supabase
    .from('approved_google_users')
    .select('*')
    .order('email', { ascending: true });

  if (error) {
    console.error('Error fetching approved Google users:', error);
    throw new Error('Could not fetch approved Google users.');
  }

  return data || [];
}

// Function to add an approved Google user
export async function addApprovedGoogleUser(email: string, role: UserRole): Promise<ApprovedGoogleUser> {
    const { data, error } = await supabase
      .from('approved_google_users')
      .insert([{ email, role }])
      .select()
      .single();
  
    if (error) {
      console.error('Error adding approved Google user:', error);
      if (error.code === '23505') { // unique_violation
          throw new Error(`User with email ${email} already exists.`);
      }
      throw new Error('Could not add the approved Google user.');
    }
  
    return data;
  }

// Function to remove an approved Google user by email
export async function removeApprovedGoogleUser(email:string): Promise<void> {
  const { error, count } = await supabase
    .from('approved_google_users')
    .delete()
    .eq('email', email);

  if (error) {
    console.error('Error removing approved Google user:', error);
    throw new Error('Could not remove the approved Google user.');
  }

  if (count === 0) {
      console.warn(`Attempted to remove non-existent user: ${email}`);
  }
}
