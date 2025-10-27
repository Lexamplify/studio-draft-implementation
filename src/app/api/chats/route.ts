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

    // Fetch all chats for the user
    const chatsSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .orderBy('createdAt', 'desc')
      .get();

    const chats = chatsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
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
    const { title, linkedCaseId, initialMessage } = body;

    // Create new chat
    const chatData = {
      title: title || 'New Chat',
      linkedCaseId: linkedCaseId || null,
      createdAt: new Date()
    };

    const chatRef = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .add(chatData);

    // Add initial message if provided
    if (initialMessage) {
      await chatRef.collection('messages').add({
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      });
    }

    return NextResponse.json({
      id: chatRef.id,
      ...chatData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
