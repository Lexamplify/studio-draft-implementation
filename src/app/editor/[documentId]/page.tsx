"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Document } from "./document";
import { getDocumentById, Document as DocumentType } from "@/lib/firebase-document-service";
import { FullscreenLoader } from "@/components/fullscreen-loader";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseClient";
import { useCases } from "@/context/cases-context";

const DocumentIdPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.documentId as string;
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const { cases } = useCases();

  useEffect(() => {
    if (!user || !documentId) {
      return;
    }

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const doc = await getDocumentById(documentId);
        
        if (!doc) {
          setError("Document not found");
          return;
        }

        // Check if user owns the document
        if (doc.ownerId !== user.uid) {
          setError("You don't have permission to view this document");
          return;
        }

        setDocument(doc);
      } catch (err: any) {
        console.error("Error loading document:", err);
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [user, documentId]);

  if (!user) {
    return <FullscreenLoader label="Authenticating..." />;
  }

  if (loading) {
    return <FullscreenLoader label="Loading document..." />;
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-red-600">Error</h1>
          <p className="text-gray-600 mb-4 text-center">
            {error || "Document not found"}
          </p>
        </div>
      </div>
    );
  }

  // Get the full case object from the document's caseId or query parameter
  // Priority: document.caseId > query parameter caseId
  const caseIdFromQuery = searchParams.get('caseId');
  const caseIdToUse = document.caseId || caseIdFromQuery;
  const fullCaseData = caseIdToUse ? cases.find(c => c.id === caseIdToUse) : undefined;

  return <Document document={document} caseData={fullCaseData} />;
};

export default DocumentIdPage;
