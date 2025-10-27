import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocumentForCase } from '@/ai/flows/chat-flow';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { document, documentName } = body;

    if (!document || !documentName) {
      return NextResponse.json({ error: 'Document and documentName are required' }, { status: 400 });
    }

    // Analyze the document with AI
    const analysis = await analyzeDocumentForCase({
      document,
      documentName,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    );
  }
}
