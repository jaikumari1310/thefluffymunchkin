import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[AuthCallback] Page loaded')

      // Supabase already saved the session at this point
      const { data, error } = await supabase.auth.getSession()

      console.log('[AuthCallback] Session data:', data)
      console.log('[AuthCallback] Session error:', error)

      // Always redirect user after login
      navigate('/', { replace: true })
    }

    handleCallback()
  }, [navigate])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Signing you in…</h2>
      <p>Please wait</p>
    </div>
  )
}