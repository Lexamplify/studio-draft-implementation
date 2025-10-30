import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
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

    const { caseId } = await params;

    // Fetch specific case
    const caseDoc = await db
      .collection('users')
      .doc(uid)
      .collection('cases')
      .doc(caseId)
      .get();

    if (!caseDoc.exists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: caseDoc.id,
      ...caseDoc.data()
    });
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
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

    const { caseId } = await params;
    const body = await req.json();
    const { caseName, tags, details } = body;

    // Update case
    const updateData = {
      ...(caseName && { caseName }),
      ...(tags && { tags }),
      ...(details && { details }),
      updatedAt: new Date()
    };

    await db
      .collection('users')
      .doc(uid)
      .collection('cases')
      .doc(caseId)
      .update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
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

    const { caseId } = await params;
    const { searchParams } = new URL(req.url);
    const deleteChats = searchParams.get('deleteChats') === 'true';

    // Get all chats linked to this case
    const chatsSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('chats')
      .where('linkedCaseId', '==', caseId)
      .get();

    const linkedChats = chatsSnapshot.docs;

    // Handle linked chats based on user choice
    if (linkedChats.length > 0) {
      if (deleteChats) {
        // Delete all linked chats
        const deletePromises = linkedChats.map(chatDoc => chatDoc.ref.delete());
        await Promise.all(deletePromises);
      } else {
        // Unlink chats (set linkedCaseId to null)
        const unlinkPromises = linkedChats.map(chatDoc => 
          chatDoc.ref.update({ linkedCaseId: null })
        );
        await Promise.all(unlinkPromises);
      }
    }

    // Delete case
    await db
      .collection('users')
      .doc(uid)
      .collection('cases')
      .doc(caseId)
      .delete();

    return NextResponse.json({ 
      success: true,
      deletedChats: deleteChats ? linkedChats.length : 0,
      unlinkedChats: !deleteChats ? linkedChats.length : 0
    });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}
