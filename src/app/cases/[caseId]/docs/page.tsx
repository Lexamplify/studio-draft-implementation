"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { TemplatesGallery } from '@/components/templates/templates-gallery';
import { createDocument, listDocuments, Document } from '@/lib/firebase-document-service';
import { Icon } from '@/components/ui/icon';
import { toast } from 'sonner';
import { useFirebaseUser } from '@/hooks/use-firebase-user';

export default function CaseDocsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const caseId = params.caseId as string;
  const selectedDocId = searchParams.get('doc');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { user, loading: userLoading } = useFirebaseUser();

  // Load documents for this case
  useEffect(() => {
    const loadDocuments = async () => {
      if (!user || !caseId) return;
      
      try {
        setIsLoading(true);
        const docs = await listDocuments(caseId, user.uid);
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to load documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    if (caseId && user) {
      loadDocuments();
    }
  }, [caseId, user]);

  // Handle template selection - create a new document
  const handleTemplateSelect = async (template: {
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  }) => {
    if (!user) {
      toast.error('Please sign in to create documents');
      return;
    }

    // Debug: Log authentication state
    console.log('🔐 Auth Debug:', {
      user: user ? {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      } : null,
      caseId,
      templateLabel: template.label
    });

    try {
      setIsCreating(true);
      
      const contentForFirestore = typeof template.initialContent === 'string' 
        ? template.initialContent 
        : JSON.stringify(template.initialContent);
      
      console.log('📝 Creating document with:', {
        caseId,
        userId: user.uid,
        title: template.label,
        contentLength: contentForFirestore.length
      });
      
      const documentId = await createDocument(
        caseId,
        user.uid,
        template.label,
        contentForFirestore
      );
      
      // Reload documents
      const docs = await listDocuments(caseId, user.uid);
      setDocuments(docs);
      
      // Navigate to the new document
      router.push(`/cases/${caseId}/docs?doc=${documentId}`);
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document. Please check Firestore security rules.');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleDocumentClick = (docId: string) => {
    router.push(`/cases/${caseId}/docs?doc=${docId}`);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show loading if user is not yet loaded
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Icon name="lock" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please sign in to view and create documents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Template Gallery */}
      <div className="flex-shrink-0">
        <TemplatesGallery 
          onTemplateSelect={handleTemplateSelect}
          isCreating={isCreating}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Panel - User Documents */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Icon name="fileLines" className="w-5 h-5 text-blue-500 mr-2" />
                Your Documents
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="fileLines" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-500 mb-2">No documents yet</h4>
                  <p className="text-gray-400 text-sm">Create a document from a template above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedDocId === doc.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon 
                          name="fileText" 
                          className={`w-5 h-5 mt-0.5 ${
                            selectedDocId === doc.id ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{doc.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Updated {formatDate(doc.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Document Editor/Preview */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            {selectedDocId ? (
              <>
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {documents.find(d => d.id === selectedDocId)?.title || 'Document'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const doc = documents.find(d => d.id === selectedDocId);
                          if (doc) {
                            // Open in a separate editor page (you can customize this)
                            router.push(`/editor/${selectedDocId}`);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Icon name="edit" className="w-4 h-4" />
                        Open in Editor
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose max-w-none">
                    {/* Document preview placeholder */}
                    <div className="text-center py-12 text-gray-500">
                      <Icon name="fileText" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>Click "Open in Editor" to edit this document</p>
                      <p className="text-sm mt-2">Document ID: {selectedDocId}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Icon name="fileSearch" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-500 mb-2">No document selected</h4>
                  <p className="text-gray-400">Select a document from the left panel or create a new one from a template</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

