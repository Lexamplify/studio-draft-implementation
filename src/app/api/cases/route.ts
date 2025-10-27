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

    // Fetch all cases for the user
    const casesSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('cases')
      .orderBy('createdAt', 'desc')
      .get();

    const cases = casesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
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
    const { caseName, tags = [], details = {} } = body;

    if (!caseName) {
      return NextResponse.json({ error: 'Case name is required' }, { status: 400 });
    }

    // Create new case
    const caseData = {
      caseName,
      tags,
      details,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db
      .collection('users')
      .doc(uid)
      .collection('cases')
      .add(caseData);

    return NextResponse.json({
      id: docRef.id,
      ...caseData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}
