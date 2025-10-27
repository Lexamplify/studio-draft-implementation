import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { WorkspaceNotes } from '@/types/backend';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const userId = 'current-user-id'; // TODO: Get from auth

    let query = db.collection('workspaceNotes')
      .where('userId', '==', userId);

    if (caseId) {
      query = query.where('caseId', '==', caseId);
    } else {
      query = query.where('caseId', '==', null);
    }

    const snapshot = await query.get();
    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as WorkspaceNotes[];

    return NextResponse.json({ notes: notes[0] || null });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { content, caseId } = await request.json();
    const userId = 'current-user-id'; // TODO: Get from auth

    // Check if notes already exist
    let query = db.collection('workspaceNotes')
      .where('userId', '==', userId)
      .where('caseId', '==', caseId || null);

    const snapshot = await query.get();

    if (snapshot.empty) {
      // Create new notes
      const notesData = {
        content,
        caseId: caseId || null,
        userId,
        updatedAt: new Date(),
      };

      const docRef = await db.collection('workspaceNotes').add(notesData);
      return NextResponse.json({
        id: docRef.id,
        ...notesData,
      });
    } else {
      // Update existing notes
      const doc = snapshot.docs[0];
      await doc.ref.update({
        content,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        id: doc.id,
        content,
        caseId: caseId || null,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error updating notes:', error);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}
