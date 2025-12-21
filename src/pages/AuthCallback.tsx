import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[AuthCallback] Processing auth callback');
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        console.error('[AuthCallback] No session found, redirecting to login.');
        navigate('/login');
        return;
      }

      const userEmail = data.session.user.email?.toLowerCase();

      if (!userEmail) {
        console.error('[AuthCallback] No email found in session, signing out.');
        await supabase.auth.signOut();
        navigate('/login?error=no_email');
        return;
      }

      console.log(`[AuthCallback] User authenticated with email: ${userEmail}`);
      console.log('[AuthCallback] Checking if user is approved...');

      const { data: approvedUser, error: fetchError } = await supabase
        .from('approved_google_users')
        .select('email')
        .eq('email', userEmail)
        .maybeSingle();

      if (fetchError) {
        console.error('[AuthCallback] Error fetching from approved_google_users:', fetchError);
        await supabase.auth.signOut();
        navigate('/login?error=check_failed');
        return;
      }

      if (!approvedUser) {
        console.warn(`[AuthCallback] User ${userEmail} is not in the approved list. Signing out.`);
        await supabase.auth.signOut();
        // Using alert as specified in the backup file logic
        alert('This Google account is not approved. Please contact your administrator.');
        navigate('/login', { replace: true });
        return;
      }

      console.log(`[AuthCallback] User ${userEmail} is approved. Redirecting to home.`);
      navigate('/', { replace: true });
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Signing you in...</h1>
        <p className="text-muted-foreground">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}
