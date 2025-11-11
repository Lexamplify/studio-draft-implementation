import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // For now, return a simple JWT-like structure that Convex can use
    // Note: In production, you'd want to create a proper JWT with your own secret
    // This is a simplified approach - Convex may need actual JWT format
    
    // Create a token payload that Convex can understand
    const convexToken = {
      sub: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
      picture: decodedToken.picture,
      iat: Math.floor(Date.now() / 1000),
      exp: decodedToken.exp || Math.floor(Date.now() / 1000) + 3600,
    };

    return NextResponse.json({ token: JSON.stringify(convexToken) });
  } catch (error) {
    console.error('Convex auth error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

