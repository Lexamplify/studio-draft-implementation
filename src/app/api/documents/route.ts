import { NextResponse } from 'next/server';
import { createDocument } from '@/lib/firebase/documents';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Get Authorization header with Firebase ID token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileName, templateType } = await request.json();
    
    if (!fileName || !templateType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fileId = await createDocument(decodedToken.uid, fileName, templateType);
    
    return NextResponse.json({ fileId });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
