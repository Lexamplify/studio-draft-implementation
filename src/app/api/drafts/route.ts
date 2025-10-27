import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch all drafts for the user
    const draftsSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('drafts')
      .orderBy('createdAt', 'desc')
      .get();

    const drafts = draftsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

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
    const { draftTitle, content = '', linkedCaseId } = body;

    if (!draftTitle) {
      return NextResponse.json({ error: 'Draft title is required' }, { status: 400 });
    }

    // Create new draft
    const draftData = {
      draftTitle,
      content,
      linkedCaseId: linkedCaseId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('drafts')
      .add(draftData);

    return NextResponse.json({
      id: docRef.id,
      ...draftData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
