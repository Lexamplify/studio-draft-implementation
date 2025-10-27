import { NextRequest, NextResponse } from 'next/server';
import { generateChatTitle } from '@/ai/flows/title-generation';

export async function POST(request: NextRequest) {
  try {
    const { message, documentName } = await request.json();

    if (!message && !documentName) {
      return NextResponse.json(
        { error: 'Message or document name is required' },
        { status: 400 }
      );
    }

    // Generate title using the AI flow
    const result = await generateChatTitle({
      message: message || undefined,
      documentName: documentName || undefined,
    });

    return NextResponse.json({ title: result.title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}