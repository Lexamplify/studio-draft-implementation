// src/lib/firebase-document-service.ts
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebaseClient';

export interface Document {
  id: string;
  title: string;
  initialContent?: string;
  ownerId: string;
  caseId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastModified?: number;
}

/**
 * Create a new document in Firestore
 */
export async function createDocument(
  caseId: string,
  userId: string,
  title?: string,
  initialContent?: string
): Promise<string> {
  if (!userId) {
    throw new Error("Unauthorized - userId required");
  }

  const docData: any = {
    title: title || "Untitled document",
    initialContent: initialContent || "",
    ownerId: userId,
    userId: userId, // Add userId for security rules compatibility
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastModified: Date.now(),
  };

  // Add caseId if provided
  if (caseId) {
    docData.caseId = caseId;
  }

  const docRef = await addDoc(collection(db, "documents"), docData);
  return docRef.id;
}

/**
 * Get a document by ID
 */
export async function getDocumentById(documentId: string): Promise<Document | null> {
  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title,
    initialContent: data.initialContent,
    ownerId: data.ownerId,
    caseId: data.caseId,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastModified: data.lastModified,
  };
}

/**
 * Get multiple documents by IDs
 */
export async function getDocumentsByIds(documentIds: string[]): Promise<Document[]> {
  if (documentIds.length === 0) return [];

  const documents: Document[] = [];
  
  // Fetch documents individually (Firestore doesn't support 'in' query with document IDs directly)
  // For better performance, you could use a batch get, but this is simpler
  for (const docId of documentIds) {
    try {
      const docRef = doc(db, "documents", docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        documents.push({
          id: docSnap.id,
          title: data.title,
          initialContent: data.initialContent,
          ownerId: data.ownerId,
          caseId: data.caseId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastModified: data.lastModified,
        });
      }
    } catch (error) {
      console.error(`Error fetching document ${docId}:`, error);
    }
  }

  return documents;
}

/**
 * List documents for a case (returns Document[])
 */
export async function listDocuments(
  caseId: string,
  userId: string
): Promise<Document[]>;

/**
 * List documents for a user with pagination (returns { documents, lastDoc })
 */
export async function listDocuments(
  userId: string,
  search?: string,
  limitCount?: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ documents: Document[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>;

/**
 * List documents implementation
 */
export async function listDocuments(
  caseIdOrUserId: string,
  userIdOrSearch?: string,
  searchOrLimit?: string | number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ documents: Document[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null } | Document[]> {
  // Determine signature based on number and types of arguments
  const isCaseList = arguments.length === 2 && typeof userIdOrSearch === 'string' && !userIdOrSearch.includes(' ');
  
  let caseId: string | undefined;
  let userId: string;
  let search: string | undefined;
  let limitCount: number = 10;
  let lastDocument: QueryDocumentSnapshot<DocumentData> | undefined;

  if (isCaseList) {
    // Case list signature: listDocuments(caseId, userId)
    caseId = caseIdOrUserId;
    userId = userIdOrSearch!;
    limitCount = 100; // Default limit for case documents
  } else {
    // User list signature: listDocuments(userId, search?, limitCount?, lastDoc?)
    userId = caseIdOrUserId;
    search = typeof userIdOrSearch === 'string' ? userIdOrSearch : undefined;
    limitCount = typeof searchOrLimit === 'number' ? searchOrLimit : 10;
    lastDocument = typeof searchOrLimit === 'object' ? searchOrLimit : lastDoc;
  }

  if (!userId) {
    throw new Error("Unauthorized - userId required");
  }

  // Build query constraints
  const constraints: any[] = [];

  // Add caseId filter if provided
  if (caseId) {
    constraints.push(where("caseId", "==", caseId));
  }

  // Always filter by userId for security
  constraints.push(where("userId", "==", userId));
  constraints.push(orderBy("updatedAt", "desc"));
  constraints.push(limit(limitCount));

  // Add pagination if lastDoc provided
  if (lastDocument) {
    constraints.push(startAfter(lastDocument));
  }

  let q = query(collection(db, "documents"), ...constraints);

  const querySnapshot = await getDocs(q);
  const documents: Document[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    documents.push({
      id: docSnap.id,
      title: data.title,
      initialContent: data.initialContent,
      ownerId: data.ownerId || data.userId,
      caseId: data.caseId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastModified: data.lastModified,
    });
  });

  // Filter by search if provided (client-side for now, could use Algolia for better search)
  let filteredDocuments = documents;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredDocuments = documents.filter(doc => 
      doc.title.toLowerCase().includes(searchLower)
    );
  }

  // Return format based on signature
  if (isCaseList) {
    // Case list: return Document[] directly
    return filteredDocuments;
  } else {
    // User list: return { documents, lastDoc }
    const lastDocResult = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    return {
      documents: filteredDocuments,
      lastDoc: lastDocResult,
    };
  }
}

/**
 * Update a document
 */
export async function updateDocument(
  documentId: string,
  userId: string,
  updates: { title?: string; initialContent?: string }
): Promise<void> {
  if (!userId) {
    throw new Error("Unauthorized - userId required");
  }

  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Document not found");
  }

  const data = docSnap.data();
  if (data.ownerId !== userId) {
    throw new Error("Unauthorized");
  }

  const updateData: any = {
    updatedAt: Timestamp.now(),
    lastModified: Date.now(),
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }

  if (updates.initialContent !== undefined) {
    updateData.initialContent = updates.initialContent;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  if (!userId) {
    throw new Error("Unauthorized - userId required");
  }

  const docRef = doc(db, "documents", documentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Document not found");
  }

  const data = docSnap.data();
  if (data.ownerId !== userId) {
    throw new Error("Unauthorized");
  }

  await deleteDoc(docRef);
}

