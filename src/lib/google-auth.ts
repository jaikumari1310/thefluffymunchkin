import { getApprovedGoogleUsers } from './auth-db';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SIGN_IN_TIMEOUT = 30000; // 30 seconds

if (!GOOGLE_CLIENT_ID) {
  throw new Error('VITE_GOOGLE_CLIENT_ID is not configured');
}

interface GoogleUserInfo {
  email: string;
  name: string;
}

async function validateAndAuthorizeUser(credential: string): Promise<GoogleUserInfo> {
  const payload = JSON.parse(atob(credential.split('.')[1]));

  // JWT validation
  if (
    payload.aud !== GOOGLE_CLIENT_ID ||
    payload.iss !== 'https://accounts.google.com' ||
    payload.exp * 1000 < Date.now()
  ) {
    throw new Error('Invalid Google token');
  }

  const email = payload.email?.toLowerCase();
  const name = payload.name;

  if (!email || !name) {
    throw new Error('Incomplete Google profile');
  }

  // Check approved users
  const approved = await getApprovedGoogleUsers();
  const allowedUser = approved.find(u => u.email === email);

  if (!allowedUser) {
    throw new Error('This Google account is not approved');
  }

  return { email, name };
}

function signInWithGoogleFedCM(): Promise<GoogleUserInfo> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google Identity SDK not loaded'));
      return;
    }

    let resolved = false;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential?: string }) => {
        if (resolved) return;
        resolved = true;

        try {
          if (!response.credential) {
            reject(new Error('No credential returned from Google'));
            return;
          }

          const userInfo = await validateAndAuthorizeUser(response.credential);
          resolve(userInfo);
        } catch (err) {
          console.error('Google login error:', err);
          reject(err instanceof Error ? err : new Error('Invalid Google response'));
        }
      },
    });

    // Show account chooser
    window.google.accounts.id.prompt((notification: any) => {
      if (resolved) return;

      if (notification.isNotDisplayed()) {
        resolved = true;
        const reason = notification.getNotDisplayedReason();
        console.warn('Google Sign-In not displayed:', reason);
        reject(new Error(`FEDCM_FAILED:${reason}`));
      } else if (notification.isSkippedMoment()) {
        resolved = true;
        const reason = notification.getSkippedReason();
        console.warn('Google Sign-In skipped:', reason);
        reject(new Error(`FEDCM_SKIPPED:${reason}`));
      } else if (notification.isDismissedMoment()) {
        resolved = true;
        const reason = notification.getDismissedReason();
        if (reason === 'credential_returned') {
          // This is fine - callback will handle it
          return;
        }
        console.warn('Google Sign-In dismissed:', reason);
        reject(new Error(reason === 'cancel_called' ? 'Sign-in cancelled' : 'Sign-in dismissed'));
      }
    });
  });
}

function signInWithGooglePopup(): Promise<GoogleUserInfo> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google OAuth2 SDK not loaded'));
      return;
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      ux_mode: 'popup',
      callback: async (response: { code?: string; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error === 'access_denied' ? 'Access denied' : 'Authentication failed'));
          return;
        }

        if (!response.code) {
          reject(new Error('No authorization code received'));
          return;
        }

        // For popup flow, we need to exchange the code for user info
        // Since we don't have a backend, we'll use the token client instead
        reject(new Error('Popup code flow requires backend - falling back to token flow'));
      },
    });

    client.requestCode();
  });
}

function signInWithGoogleTokenPopup(): Promise<GoogleUserInfo> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google OAuth2 SDK not loaded'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (response: { access_token?: string; error?: string }) => {
        if (response.error) {
          reject(new Error(response.error === 'access_denied' ? 'Access denied' : 'Authentication failed'));
          return;
        }

        if (!response.access_token) {
          reject(new Error('No access token received'));
          return;
        }

        try {
          // Fetch user info using the access token
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });

          if (!userInfoResponse.ok) {
            throw new Error('Failed to fetch user info');
          }

          const userInfo = await userInfoResponse.json();
          const email = userInfo.email?.toLowerCase();
          const name = userInfo.name;

          if (!email || !name) {
            throw new Error('Incomplete Google profile');
          }

          // Check approved users
          const approved = await getApprovedGoogleUsers();
          const allowedUser = approved.find(u => u.email === email);

          if (!allowedUser) {
            throw new Error('This Google account is not approved');
          }

          resolve({ email, name });
        } catch (err) {
          console.error('Google token flow error:', err);
          reject(err instanceof Error ? err : new Error('Failed to get user info'));
        }
      },
    });

    client.requestAccessToken();
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), ms)
    ),
  ]);
}

export async function signInWithGoogle(): Promise<GoogleUserInfo> {
  try {
    // Try FedCM first (One Tap / account chooser)
    return await withTimeout(
      signInWithGoogleFedCM(),
      SIGN_IN_TIMEOUT,
      'Sign-in timed out. Please try again.'
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '';
    
    // If FedCM failed due to browser/iframe restrictions, try popup flow
    if (errorMessage.startsWith('FEDCM_FAILED:') || errorMessage.startsWith('FEDCM_SKIPPED:')) {
      console.log('FedCM failed, falling back to popup flow...');
      
      try {
        return await withTimeout(
          signInWithGoogleTokenPopup(),
          SIGN_IN_TIMEOUT,
          'Sign-in timed out. Please try again.'
        );
      } catch (popupErr) {
        console.error('Popup flow also failed:', popupErr);
        throw popupErr;
      }
    }

    // Re-throw other errors (user cancelled, not approved, etc.)
    throw err;
  }
}
