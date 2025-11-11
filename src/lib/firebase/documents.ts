import { createDocument as createDocumentInFirestore } from '@/lib/firebase-document-service';
import { fetchTemplateFromFirebase } from '@/lib/firebase-template-service';

/**
 * Create a document from a template
 * @param userId - The user ID creating the document
 * @param fileName - The name/title of the document
 * @param templateType - The template ID or type to use
 * @returns The created document ID
 */
export async function createDocument(
  userId: string,
  fileName: string,
  templateType: string
): Promise<string> {
  if (!userId) {
    throw new Error("Unauthorized - userId required");
  }

  let initialContent: string | undefined;

  // If templateType is provided, try to fetch the template content
  if (templateType) {
    try {
      const template = await fetchTemplateFromFirebase(templateType);
      if (template) {
        // Use initialContent if available, otherwise use content
        initialContent = template.initialContent || template.content || '';
      }
    } catch (error) {
      console.warn('Failed to fetch template, creating document without template content:', error);
      // Continue without template content
    }
  }

  // Create document without caseId (standalone document)
  // The existing createDocument requires caseId, so we'll pass an empty string or handle it differently
  // Actually, looking at the service, caseId is optional in the data structure
  const documentId = await createDocumentInFirestore(
    '', // No caseId for standalone documents created via API
    userId,
    fileName,
    initialContent
  );

  return documentId;
}

