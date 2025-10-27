import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;
    const fileData = await req.json();

    // Save file to Firestore
    await db.collection('chats').doc(chatId).collection('files').doc(fileData.id).set({
      ...fileData,
      uploadedAt: new Date(fileData.uploadedAt)
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
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    // Get files from Firestore
    const filesSnapshot = await db.collection('chats').doc(chatId).collection('files').get();
    const files = filesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
    }));

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error loading files:', error);
    return NextResponse.json(
      { error: 'Failed to load files' },
      { status: 500 }
    );
  }
}
