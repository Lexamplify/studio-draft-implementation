import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { chatId } = await params;

    // Fetch all messages for the chat
    const messagesSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const messages = messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      let timestamp = data.timestamp;
      
      // Convert Firestore timestamp to JavaScript Date
      if (timestamp?.toDate) {
        timestamp = timestamp.toDate();
      } else if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
        // Handle Firebase Timestamp objects
        timestamp = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
      }
      
      return {
        id: doc.id,
        ...data,
        timestamp
      };
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { chatId } = await params;
    const body = await req.json();
    const { role, content, files } = body;

    if (!role || !content) {
      return NextResponse.json({ error: 'Role and content are required' }, { status: 400 });
    }

    if (!['user', 'assistant'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Add message to chat
    const messageData = {
      role,
      content,
      files: files || [],
      timestamp: new Date()
    };

    const messageRef = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add(messageData);

    return NextResponse.json({
      id: messageRef.id,
      ...messageData
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}
