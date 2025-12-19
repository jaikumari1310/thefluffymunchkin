import { getApprovedGoogleUsers } from './auth-db';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error('VITE_GOOGLE_CLIENT_ID is not configured');
}

export async function signInWithGoogle(): Promise<{
  email: string;
  name: string;
}> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google Identity SDK not loaded'));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential?: string }) => {
        try {
          if (!response.credential) {
            reject(new Error('No credential returned from Google'));
            return;
          }

          const payload = JSON.parse(
            atob(response.credential.split('.')[1])
          );

          /** 🔐 Minimal JWT validation */
          if (
            payload.aud !== GOOGLE_CLIENT_ID ||
            payload.iss !== 'https://accounts.google.com' ||
            payload.exp * 1000 < Date.now()
          ) {
            reject(new Error('Invalid Google token'));
            return;
          }

          const email = payload.email?.toLowerCase();
          const name = payload.name;

          if (!email || !name) {
            reject(new Error('Incomplete Google profile'));
            return;
          }

          /** 🔒 Approved users only */
          const approved = await getApprovedGoogleUsers();
          const allowedUser = approved.find(u => u.email === email);

          if (!allowedUser) {
            reject(new Error('This Google account is not approved'));
            return;
          }

          resolve({ email, name });
        } catch (err) {
          console.error('Google login error:', err);
          reject(new Error('Invalid Google response'));
        }
      },
    });

    /** Show account chooser */
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        console.warn(
          'Google Sign-In not displayed:',
          notification.getNotDisplayedReason()
        );
      }
    });
  });
}