// src/lib/firebase-document-service-server.ts
// Server-side Firebase operations using Admin SDK
import { adminDb } from './firebase-admin-editor';
import { Document } from './firebase-document-service';

/**
 * Get a document by ID (Server-side using Admin SDK)
 * Note: This bypasses security rules, so you should verify user permissions
 * before calling this function.
 */
export async function getDocumentByIdServer(documentId: string): Promise<Document | null> {
  if (!adminDb) {
    console.error('Firebase Admin not initialized. Check your environment variables.');
    return null;
  }

  try {
    const docRef = adminDb.collection('documents').doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data();
    if (!data) {
      return null;
    }

    // Handle Timestamp conversion for Admin SDK
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : 
                      (data.createdAt instanceof Date ? data.createdAt : new Date());
    const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                      (data.updatedAt instanceof Date ? data.updatedAt : new Date());

    return {
      id: docSnap.id,
      title: data.title || '',
      initialContent: data.initialContent || '',
      ownerId: data.ownerId || '',
      createdAt,
      updatedAt,
      lastModified: data.lastModified,
    };
  } catch (error) {
    console.error('Error fetching document (server):', error);
    return null;
  }
}

