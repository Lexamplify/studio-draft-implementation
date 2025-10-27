import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { WorkspaceTodo } from '@/types/backend';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const userId = 'current-user-id'; // TODO: Get from auth

    let query = db.collection('workspaceTodos')
      .where('userId', '==', userId);

    if (caseId) {
      query = query.where('caseId', '==', caseId);
    } else {
      query = query.where('caseId', '==', null);
    }

    const snapshot = await query.get();
    const todos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as WorkspaceTodo[];

    // Sort by order on the client side to avoid Firestore index requirement
    todos.sort((a, b) => (a.order || 0) - (b.order || 0));

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, caseId, order } = await request.json();
    const userId = 'current-user-id'; // TODO: Get from auth

    const todoData = {
      text,
      caseId: caseId || null,
      completed: false,
      userId,
      order: order || 0,
      createdAt: new Date(),
    };

    const docRef = await db.collection('workspaceTodos').add(todoData);

    return NextResponse.json({
      id: docRef.id,
      ...todoData,
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
