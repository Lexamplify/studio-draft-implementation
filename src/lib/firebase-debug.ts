import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebaseClient';

export function initFirebaseDebug() {
  const auth = getAuth(app);
  
  console.log('Firebase Config:', {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(0, 8) + '...',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User signed in:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        provider: user.providerData[0]?.providerId
      });
    } else {
      console.log('User signed out');
    }
  });
} 