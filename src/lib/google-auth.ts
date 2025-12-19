import { getApprovedGoogleUsers } from './auth-db';

declare global {
  interface Window {
    google: any;
  }
}

export async function signInWithGoogle(): Promise<{
  email: string;
  name: string;
}> {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google SDK not loaded"));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        try {
          const payload = JSON.parse(
            atob(response.credential.split('.')[1])
          );

          const email = payload.email.toLowerCase();
          const name = payload.name;

          // 🔒 CHECK AGAINST APPROVED USERS
          const approved = await getApprovedGoogleUsers();
          const allowedUser = approved.find(u => u.email === email);

          if (!allowedUser) {
            reject(new Error("This Google account is not approved"));
            return;
          }

          resolve({ email, name });
        } catch {
          reject(new Error("Invalid Google response"));
        }
      },
    });

    window.google.accounts.id.prompt();
  });
}

