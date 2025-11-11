import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { templateId } = await request.json();
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // For now, return a mock template until Firebase Admin SDK is set up
    // You can replace this with actual Firebase Admin SDK calls
    const mockTemplate = {
      id: templateId,
      name: `Template ${templateId}`,
      description: `Description for ${templateId}`,
      initialContent: `<h1>${templateId}</h1><p>This is a template fetched from Firebase via API route.</p>`,
      imageUrl: '/template-icon.svg',
      label: 'Template'
    };

    return NextResponse.json({ template: mockTemplate });
  } catch (error) {
    console.error('Error in fetch-template API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
