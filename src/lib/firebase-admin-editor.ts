import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | null = null;

function initializeFirebaseAdmin() {
  if (app) {
    return app;
  }

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  // Initialize Firebase Admin with service account credentials
  let privateKey: string | undefined = undefined;
  
  if (process.env.FIREBASE_PRIVATE_KEY) {
    // Handle different formats of private key
    privateKey = process.env.FIREBASE_PRIVATE_KEY
      // Replace literal \n with actual newlines
      .replace(/\\n/g, '\n')
      // If it's already a single line without newlines, try to format it
      // This handles cases where the key is stored without newlines
      .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
    
    // Ensure proper formatting
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('⚠️ Private key format is invalid. It should start with "-----BEGIN PRIVATE KEY-----"');
      privateKey = undefined;
    }
  }

  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    console.warn('⚠️ Firebase Admin credentials not found or incomplete. Please set:');
    console.warn('   - FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
    console.warn('   - FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing');
    console.warn('   - FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✓ Set (but may be invalid)' : '✗ Missing');
    console.warn('   See FIREBASE_ADMIN_SETUP.md for setup instructions');
    return null;
  }

  try {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    console.error('Please check your FIREBASE_PRIVATE_KEY format in .env.local');
    console.error('The key should be in this format:');
    console.error('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"');
    console.error('See FIREBASE_ADMIN_SETUP.md for detailed setup instructions');
    return null;
  }
}

// Initialize on module load
const initializedApp = initializeFirebaseAdmin();

export const adminAuth = initializedApp ? getAuth(initializedApp) : null;
export const adminDb = initializedApp ? getFirestore(initializedApp) : null;
export { initializedApp as adminApp };

