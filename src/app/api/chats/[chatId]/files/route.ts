import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

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
    const fileData = await req.json();

    // Save file to Firestore - using the same structure as messages (users/{uid}/chats/{chatId}/files)
    await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .collection('files')
      .doc(fileData.id)
      .set({
        id: fileData.id,
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        url: fileData.url,
        path: fileData.path,
        uploadedAt: new Date(fileData.uploadedAt || Date.now())
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}

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

    // Get files from Firestore - using the same structure as messages (users/{uid}/chats/{chatId}/files)
    const filesSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .doc(chatId)
      .collection('files')
      .get();
    
    const files = filesSnapshot.docs.map(doc => {
      const data = doc.data();
      let uploadedAt = data.uploadedAt;
      
      // Convert Firestore timestamp to JavaScript Date
      if (uploadedAt?.toDate) {
        uploadedAt = uploadedAt.toDate();
      } else if (uploadedAt && typeof uploadedAt === 'object' && uploadedAt._seconds) {
        uploadedAt = new Date(uploadedAt._seconds * 1000 + uploadedAt._nanoseconds / 1000000);
      } else if (!uploadedAt) {
        uploadedAt = new Date();
      }
      
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        size: data.size,
        url: data.url,
        path: data.path,
        uploadedAt
      };
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error loading files:', error);
    return NextResponse.json(
      { error: 'Failed to load files' },
      { status: 500 }
    );
  }
}
