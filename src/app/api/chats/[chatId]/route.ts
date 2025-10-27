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

    // Fetch specific chat
    const chatDoc = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .get();

    if (!chatDoc.exists) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: chatDoc.id,
      ...chatDoc.data()
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Update chat with new data
    await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .update({
        ...body,
        updatedAt: new Date()
      });

    // Fetch updated chat
    const chatDoc = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .get();

    return NextResponse.json({
      id: chatDoc.id,
      ...chatDoc.data()
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete chat and all its messages
    const batch = db.batch();
    
    // Delete all messages first
    const messagesSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .get();

    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete chat
    batch.delete(db.collection('users').doc(uid).collection('chats').doc(chatId));

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}
