// Dynamic imports to avoid module initialization issues
let pdfParse: any;
let mammoth: any;

// Lazy load pdf-parse with better error handling
async function getPdfParse() {
  if (!pdfParse) {
    try {
      // Use dynamic import with specific path to avoid test file issues
      const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
      pdfParse = pdfParseModule.default || pdfParseModule;
    } catch (error) {
      console.error('Error loading pdf-parse:', error);
      // Fallback: return a mock function that provides basic info
      pdfParse = (buffer: Buffer) => {
        return Promise.resolve({
          text: `PDF Document (${Math.round(buffer.length / 1024)} KB)\n\n[PDF content extraction is temporarily unavailable. The AI can reference this document by name.]`,
          info: {},
          numpages: 0
        });
      };
    }
  }
  return pdfParse;
}

// Lazy load mammoth
async function getMammoth() {
  if (!mammoth) {
    try {
      mammoth = (await import('mammoth')).default;
    } catch (error) {
      console.error('Error loading mammoth:', error);
      throw new Error('DOCX parsing library failed to load');
    }
  }
  return mammoth;
}

export interface ParsedDocument {
  content: string;
  metadata: {
    title?: string;
    author?: string;
    pages?: number;
    wordCount?: number;
  };
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const fileType = file.type;
  const fileName = file.name;

  try {
    if (fileType === 'application/pdf') {
      return await parsePDF(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileName.endsWith('.docx')) {
      return await parseDOCX(file);
    } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
      return await parseDOC(file);
    } else if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      return await parseText(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parsePDF(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const pdfParseLib = await getPdfParse();
  const data = await pdfParseLib(buffer);
  
  return {
    content: data.text,
    metadata: {
      title: data.info?.Title || undefined,
      author: data.info?.Author || undefined,
      pages: data.numpages,
      wordCount: data.text.split(/\s+/).length
    }
  };
}

async function parseDOCX(file: File): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const mammothLib = await getMammoth();
  const result = await mammothLib.extractRawText({ buffer });
  
  return {
    content: result.value,
    metadata: {
      wordCount: result.value.split(/\s+/).length
    }
  };
}

async function parseDOC(file: File): Promise<ParsedDocument> {
  // For .doc files, we'll try to use mammoth as well
  // Note: mammoth works better with .docx, but can sometimes handle .doc
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  try {
    const mammothLib = await getMammoth();
    const result = await mammothLib.extractRawText({ buffer });
    return {
      content: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length
      }
    };
  } catch (error) {
    // If mammoth fails with .doc, provide a helpful error
    throw new Error('Unable to parse .doc file. Please convert to .docx or .pdf format for better compatibility.');
  }
}

async function parseText(file: File): Promise<ParsedDocument> {
  const content = await file.text();
  
  return {
    content,
    metadata: {
      wordCount: content.split(/\s+/).length
    }
  };
}

export function getSupportedFileTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];
}

export function getSupportedExtensions(): string[] {
  return ['.pdf', '.docx', '.doc', '.txt'];
}

export function isFileTypeSupported(file: File): boolean {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  return getSupportedFileTypes().includes(fileType) || 
         getSupportedExtensions().some(ext => fileName.endsWith(ext));
}
