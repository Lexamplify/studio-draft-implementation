import { NextRequest, NextResponse } from 'next/server';
import { legalAdviceChat } from '@/ai/flows/legal-advice-chat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { document, documentName } = body;

    if (!document || !documentName) {
      return NextResponse.json({ error: 'Document and documentName are required' }, { status: 400 });
    }

    // Use the existing legal advice chat flow to extract case details
    const result = await legalAdviceChat({
      message: "Please extract and structure the case details from this document including: case name, parties involved, court name, case type, filing date, and any other relevant metadata. Format as JSON.",
      document,
      documentName
    });

    // Parse the result to extract structured data
    // The AI should return structured case information
    const extractedDetails = {
      caseName: documentName.replace(/\.[^/.]+$/, ""), // Remove file extension
      // The AI response will contain the structured data
      // This is a simplified version - in practice, you'd parse the AI response
      summary: result.response,
      suggestions: result.suggestions,
      relatedCases: result.relatedCases,
      extractedAt: new Date().toISOString()
    };

    return NextResponse.json(extractedDetails);
  } catch (error) {
    console.error('Error extracting case details:', error);
    return NextResponse.json(
      { error: 'Failed to extract case details' },
      { status: 500 }
    );
  }
}
