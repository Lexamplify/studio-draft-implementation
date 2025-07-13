import type { NextApiRequest, NextApiResponse } from 'next';
import { auth, db } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  // DEBUG: Log environment variables available in API
  console.log('=== API DEBUG INFO ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_SET');
  console.log('FIREBASE_CLIENT_EMAIL available:', !!process.env.CLIENT_EMAIL);
  console.log('FIREBASE_PRIVATE_KEY available:', !!process.env.PRIVATE_KEY);
  console.log('All FIREBASE env keys:', Object.keys(process.env).filter(k => k.includes('FIREBASE')));
  console.log('Firebase admin apps count:', (await import('firebase-admin')).default.apps.length);
  console.log('=== END DEBUG ===');

  // Log headers for debugging
  console.log('Authorization header:', req.headers.authorization);
  
  // Check for auth header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Debug: Check auth instance
    console.log('About to verify token with auth instance');
    console.log('Auth app name:', auth.app.name);
    console.log('Auth app project ID:', auth.app.options.projectId);
    
    // Verify the token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log('Verified UID:', uid);

    // Fetch drafts from Firestore
    const draftsSnap = await db
      .collection('users')
      .doc(uid)
      .collection('drafts')
      .orderBy('createdAt', 'desc')
      .get();

    const drafts = draftsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({ drafts });
  } catch (err) {
    console.error('API Error:', err);
    if (err instanceof Error) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: err.message 
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
} 