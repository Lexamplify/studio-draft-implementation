"use client";

import { useState, useEffect } from "react";
import { useFirebaseUser } from "@/hooks/use-firebase-user";
import { listDocuments, Document } from "@/lib/firebase-document-service";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

import { Navbar } from "./navbar";
import { TemplatesGallery } from "./templates-gallery";
import { DocumentsTable } from "./documents-table";
import { useSearchParam } from "@/hooks/use-search-param";

const Home = () => {
  const [search] = useSearchParam();
  const { user } = useFirebaseUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Load initial documents
  useEffect(() => {
    if (!user?.uid) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const loadDocuments = async () => {
      setLoading(true);
      try {
        const result = await listDocuments(user.uid, search, 5);
        setDocuments(result.documents);
        setLastDoc(result.lastDoc);
        setHasMore(result.lastDoc !== null);
      } catch (error) {
        console.error("Error loading documents:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [user?.uid, search]);

  const loadMore = async () => {
    if (!user?.uid || !hasMore || !lastDoc) return;

    try {
      const result = await listDocuments(user.uid, search, 5, lastDoc);
      setDocuments(prev => [...prev, ...result.documents]);
      setLastDoc(result.lastDoc);
      setHasMore(result.lastDoc !== null);
    } catch (error) {
      console.error("Error loading more documents:", error);
    }
  };

  const results = documents.map(doc => ({
    _id: doc.id,
    title: doc.title,
    initialContent: doc.initialContent,
    ownerId: doc.ownerId,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    organizationId: undefined, // Firebase documents don't have organizationId
  }));
  
  const status = hasMore ? "CanLoadMore" : "Exhausted";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white p-4">
        <Navbar />
      </div>
      <div className="mt-16">
        <TemplatesGallery />
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <DocumentsTable documents={results} loadMore={loadMore} status={status} />
        )}
      </div>
    </div>
  );
};

export default Home;
