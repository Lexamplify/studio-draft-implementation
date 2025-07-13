import { NextRequest, NextResponse } from 'next/server';
import { legalAdviceChat, type LegalAdviceChatInput } from '@/ai/flows/legal-advice-chat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the input structure
    const aiInput: LegalAdviceChatInput = {
      question: body.question,
      chatHistory: body.chatHistory || undefined,
      document: body.document || undefined,
      documentName: body.documentName || undefined,
    };

    // Clean up chat history if present
    if (aiInput.chatHistory) {
      aiInput.chatHistory = aiInput.chatHistory.map((msg) => ({
        role: msg.role,
        parts: Array.isArray(msg.parts)
          ? msg.parts.filter((part) => typeof part.text === 'string')
          : [{ text: String(msg.parts) }],
      }));
    }

    const result = await legalAdviceChat(aiInput);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Legal Advice Chat API Error:', error);
    return NextResponse.json(
      { answer: 'Sorry, I encountered an error processing your request. Please try again.' },
      { status: 500 }
    );
  }
}