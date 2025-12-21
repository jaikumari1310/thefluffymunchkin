import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AuthCallback] Page loaded');

    supabase.auth.getSession().then(({ data, error }) => {
      console.log('[AuthCallback] getSession result:', { data, error });

      if (error || !data.session) {
        console.error('[AuthCallback] No session found');
        navigate('/login');
        return;
      }

      console.log('[AuthCallback] User authenticated:', data.session.user.email);
      navigate('/');
    });
  }, [navigate]);

  return <div>Signing you in…</div>;
}

