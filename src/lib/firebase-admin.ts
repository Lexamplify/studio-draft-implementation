// CRITICAL: Load environment variables BEFORE importing firebase-admin
import './env-loader'; // Load environment variables first
import admin from 'firebase-admin';

// Debug: print detected env vars once (avoid leaking private key)
console.log('[Firebase Admin] Detected projectId:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('[Firebase Admin] Detected clientEmail:', process.env.CLIENT_EMAIL ? 'present' : 'missing');
console.log('[Firebase Admin] Detected privateKey:', process.env.PRIVATE_KEY ? 'present' : 'missing');

function getFirebasePrivateKey() {
  // Get the private key, handling newlines correctly
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables');
  }
  // Replace literal \\n with actual newlines if needed
  return privateKey.replace(/\\n/g, '\n');
}

// Initialize Firebase Admin after environment variables are loaded
function initializeFirebaseAdmin() {
  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    console.log('[Firebase Admin] Firebase already initialized, using existing app');
    return;
  }

  try {
    // Try multiple sources for project ID
    const projectId = process.env.FIREBASE_PROJECT_ID || 
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                     'legalease-prod';
    
    const clientEmail = process.env.CLIENT_EMAIL;
    
    const privateKey = process.env.PRIVATE_KEY;

    console.log('[Firebase Admin] Using projectId:', projectId);
    console.log('[Firebase Admin] clientEmail available:', !!clientEmail);
    console.log('[Firebase Admin] privateKey available:', !!privateKey);

    if (clientEmail && privateKey) {
      // Initialize with environment variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: getFirebasePrivateKey(),
        }),
        projectId,
        storageBucket: `${projectId}.firebasestorage.app`,
      });
      console.log('[Firebase Admin] Initialized with environment variables');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Fall back to application default credentials
      admin.initializeApp({
        projectId,
        credential: admin.credential.applicationDefault(),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
      console.log('[Firebase Admin] Initialized with application default credentials');
    } else {
      throw new Error(`Firebase Admin initialization failed: Missing required credentials.
        Required: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
        Found: clientEmail=${!!clientEmail}, privateKey=${!!privateKey}
        Set these environment variables in your .env.local file.`);
    }
  } catch (err) {
    console.error('[Firebase Admin] Initialization error:', err);
    if (err instanceof Error) {
      if (err.message.includes('Failed to parse private key')) {
        console.error('Private key parsing failed. Make sure FIREBASE_PRIVATE_KEY includes newlines');
      } else if (err.message.includes('Unable to detect a Project Id')) {
        console.error('Project ID not found. Check environment variables or use service account');
      }
    }
    throw err; // Re-throw to prevent app from starting with broken Firebase
  }
}

// Call initialization immediately after dotenv loading
initializeFirebaseAdmin();

// Export Firebase services with error handling
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

// Helper function to get the default app safely
export function getFirebaseApp() {
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.apps[0];
} 