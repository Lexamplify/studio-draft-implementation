import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { text, completed, order } = await request.json();
    const todoId = params.id;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;
    if (order !== undefined) updateData.order = order;

    await db.collection('workspaceTodos').doc(todoId).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const todoId = params.id;

    await db.collection('workspaceTodos').doc(todoId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
