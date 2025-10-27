import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = db.collection('draft_templates');

    // Add search filter if provided
    if (search) {
      query = query.where('templateName', '>=', search)
                   .where('templateName', '<=', search + '\uf8ff');
    }

    // Limit results
    query = query.limit(limit);

    const templatesSnapshot = await query.get();

    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
