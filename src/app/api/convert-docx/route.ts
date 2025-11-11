import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { generateJSON } from '@tiptap/html';
import { parsingExtensions } from '@/utils/tiptapExtensions'; // Import our TS utility

/**
 * Handles POST requests to convert a .docx file to Tiptap JSON format.
 * @param request The incoming Next.js API request object.
 * @returns A NextResponse object with the JSON output or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Read the uploaded file into an ArrayBuffer, then convert to a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Convert the DOCX buffer to HTML using Mammoth
    const { value: html } = await mammoth.convertToHtml({ buffer });

    // Step 2: Convert the generated HTML to Tiptap's JSON structure
    // We use our custom extension set to correctly parse all styles.
    const tiptapJson = generateJSON(html, parsingExtensions);

    // Step 3: Return the successful JSON response
    return NextResponse.json(tiptapJson);

  } catch (error) {
    console.error('DOCX Conversion failed:', error);
    // It's good practice to type your error response
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to process the document.', details: errorMessage },
      { status: 500 }
    );
  }
}
