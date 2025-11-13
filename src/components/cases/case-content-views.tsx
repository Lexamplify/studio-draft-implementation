"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@/components/ui/icon';
import DragDropUpload from '@/components/ui/drag-drop-upload';
import { uploadMultipleFiles, UploadedFile } from '@/lib/firebase-storage';
import { useAppContext } from '@/context/app-context';
import { useChats } from '@/context/chats-context';
import { apiClient } from '@/lib/api-client';
import { TemplatesGallery } from '@/components/templates/templates-gallery';
import { createDocument, listDocuments, Document } from '@/lib/firebase-document-service';
import { toast } from 'sonner';
import { useFirebaseUser } from '@/hooks/use-firebase-user';

// Case Documents View - Shows documents inline (using same implementation as page.tsx)
export function CaseDocumentsView() {
  const { selectedCaseId } = useAppContext();
  const { user, loading: userLoading } = useFirebaseUser();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const lastLoadKey = useRef<string>('');
  const isLoadingRef = useRef(false);

  const caseId = selectedCaseId;
  const userId = user?.uid || '';

  // Load documents for this case
  useEffect(() => {
    // Don't run if user is still loading or if already loading
    if (userLoading || isLoadingRef.current) {
      return;
    }

    // Don't run if no case or user
    if (!caseId || !userId) {
      setDocuments(prev => prev.length > 0 ? [] : prev);
      setIsLoading(false);
      return;
    }

    // Create a unique key for this case/user combination
    const loadKey = `${caseId}-${userId}`;
    
    // Skip if we've already loaded for this combination
    if (lastLoadKey.current === loadKey) {
      setIsLoading(false);
      return;
    }

    const loadDocuments = async (retryCount = 0) => {
      // Prevent concurrent loads
      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      
      try {
        setIsLoading(true);
        // Add timeout wrapper for Firestore queries
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
        });
        
        const docsPromise = listDocuments(caseId, userId);
        const docs = await Promise.race([docsPromise, timeoutPromise]) as Document[];
        setDocuments(docs);
        lastLoadKey.current = loadKey;
      } catch (error: any) {
        console.error('Failed to load documents:', error);
        
        // Retry logic for timeout/network errors
        if (retryCount < 2 && (error?.message?.includes('timeout') || error?.message?.includes('Could not reach'))) {
          console.log(`Retrying document load (attempt ${retryCount + 1}/2)...`);
          isLoadingRef.current = false; // Allow retry
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadDocuments(retryCount + 1);
        }
        
        // Only show error toast if it's not a timeout (timeout might be temporary)
        if (!error?.message?.includes('timeout') && !error?.message?.includes('Could not reach')) {
          toast.error('Failed to load documents');
        } else {
          // For timeout, show a less alarming message
          toast.error('Loading documents is taking longer than expected. Please check your connection.');
        }
        
        // On error, clear the load key so it can retry on next case selection
        lastLoadKey.current = '';
        // Keep existing documents if available, only clear if this was the first load
        setDocuments(prev => prev.length > 0 ? prev : []);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, userId]); // Only depend on caseId and userId, not userLoading

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

    if (!caseId) {
      toast.error('No case selected');
      return;
    }

    try {
      setIsCreating(true);
      
      const contentForFirestore = typeof template.initialContent === 'string' 
        ? template.initialContent 
        : JSON.stringify(template.initialContent);
      
      const documentId = await createDocument(
        caseId,
        user.uid,
        template.label,
        contentForFirestore
      );
      
      // Reload documents (reset load key to allow reload)
      lastLoadKey.current = '';
      const docs = await listDocuments(caseId, user.uid);
      setDocuments(docs);
      lastLoadKey.current = `${caseId}-${user.uid}`;
      
      // Open the new document in editor in a new tab
      // Pass caseId as query parameter to ensure case data is available
      const url = caseId 
        ? `/editor/${documentId}?caseId=${caseId}`
        : `/editor/${documentId}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Failed to create document. Please check Firestore security rules.');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleDocumentClick = (docId: string) => {
    // Open directly in editor in a new tab when clicking on document
    // Pass caseId as query parameter to ensure case data is available
    const url = caseId 
      ? `/editor/${docId}?caseId=${caseId}`
      : `/editor/${docId}`;
    window.open(url, '_blank');
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
      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden">
        {/* Left Panel - User Documents */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="p-4 sm:p-5 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
                <Icon name="fileLines" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
                Your Documents
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Icon name="fileLines" className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-base sm:text-lg font-medium text-gray-500 mb-2">No documents yet</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Create a document from a template above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleDocumentClick(doc.id)}
                      className="w-full text-left p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Icon 
                          name="fileText" 
                          className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-gray-400 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base text-gray-800 truncate">{doc.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Updated {formatDate(doc.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Placeholder */}
        <div className="flex-1 hidden lg:block">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Icon name="fileSearch" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-500 mb-2">Click a document to open in editor</h4>
                <p className="text-gray-400">Documents open in a new tab for editing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Case Documents View OLD (keeping for reference, can be removed later)
export function CaseDocumentsViewOLD() {
  const { selectedCaseId } = useAppContext();
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Load documents when case changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (selectedCaseId) {
        try {
          console.log('Loading documents for case:', selectedCaseId);
          const response = await apiClient.get(`/api/cases/${selectedCaseId}/documents`);
          console.log('Documents fetched:', response);
          setDocuments(response.documents || []);
        } catch (error) {
          console.error('Failed to fetch documents:', error);
          // If API fails, keep local state (documents uploaded in this session)
        }
      } else {
        setDocuments([]);
      }
    };

    fetchDocuments();
  }, [selectedCaseId]);

  const handleFilesSelected = async (files: File[]) => {
    if (!selectedCaseId) {
      setUploadError('No case selected. Please select a case first.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Upload files to Firebase Storage
      const uploadedFiles = await uploadMultipleFiles(files, selectedCaseId, 'current-user-id');
      
      // Save document metadata to Firestore
      for (const file of uploadedFiles) {
        try {
          await apiClient.post(`/api/cases/${selectedCaseId}/documents`, {
            documentData: {
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url,
              path: file.path,
              uploadedAt: file.uploadedAt.toISOString(),
              caseId: selectedCaseId
            }
          });
        } catch (error) {
          console.error('Failed to save document metadata:', error);
        }
      }
      
      // Add to local state
      setDocuments(prev => [...prev, ...uploadedFiles]);
      
      console.log('Files uploaded successfully:', uploadedFiles);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const docToDelete = documents.find(doc => doc.id === documentId);
      if (docToDelete) {
        // Delete from Firebase Storage
        // await deleteFile(docToDelete.path);
        
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        console.log('Document deleted:', documentId);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setUploadError('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'filePdf';
    if (type.includes('word') || type.includes('document')) return 'fileWord';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fileSpreadsheet';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'filePresentation';
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif')) return 'image';
    if (type.includes('video') || type.includes('mp4')) return 'video';
    if (type.includes('audio') || type.includes('mp3')) return 'music';
    if (type.includes('zip') || type.includes('rar')) return 'archive';
    return 'file';
  };

  const getFileIconColor = (type: string) => {
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('word') || type.includes('document')) return 'text-blue-500';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'text-green-500';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'text-orange-500';
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('gif')) return 'text-purple-500';
    if (type.includes('video') || type.includes('mp4')) return 'text-pink-500';
    if (type.includes('audio') || type.includes('mp3')) return 'text-indigo-500';
    if (type.includes('zip') || type.includes('rar')) return 'text-yellow-500';
    return 'text-gray-500';
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFileType = selectedFileType === 'all' || doc.type.includes(selectedFileType);
    const matchesTag = selectedTag === 'all' || (doc.tags && doc.tags.includes(selectedTag));
    return matchesSearch && matchesFileType && matchesTag;
  });

  // Get unique file types for filter
  const fileTypes = ['all', ...new Set(documents.map(doc => {
    if (doc.type.includes('pdf')) return 'pdf';
    if (doc.type.includes('word') || doc.type.includes('document')) return 'document';
    if (doc.type.includes('excel') || doc.type.includes('spreadsheet')) return 'excel';
    if (doc.type.includes('powerpoint') || doc.type.includes('presentation')) return 'presentation';
    if (doc.type.includes('image')) return 'image';
    if (doc.type.includes('video')) return 'video';
    if (doc.type.includes('audio')) return 'audio';
    if (doc.type.includes('zip') || doc.type.includes('rar')) return 'archive';
    return 'other';
  }))];

  // Get unique tags for filter
  const tags = ['all', 'draft', 'final', 'review', 'evidence', 'correspondence', 'legal', 'financial'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Case Documents</h3>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage and organize your case files</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-center sm:text-left">
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </div>
          <button
            onClick={() => {
              // Trigger file input click
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              fileInput?.click();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            <Icon name="upload" className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by name, type, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* File Type Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">File Type:</label>
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {fileTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {tags.map(tag => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {filteredDocuments.length} of {documents.length} documents
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedFileType !== 'all' || selectedTag !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFileType('all');
                setSelectedTag('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <Icon name="x" className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <DragDropUpload
          onFilesSelected={handleFilesSelected}
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar,.csv,.rtf,.odt,.ods,.odp"
          multiple={true}
          maxFiles={20}
          maxSize={100} // 100MB per file
          className="min-h-[200px]"
        />
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <Icon name="x" className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="folder" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">Nooo documents uploaded</h4>
            <p className="text-gray-400">Drag and drop files above to get started with your case documents</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <ul className="space-y-3">
            {filteredDocuments.map((doc) => (
              <DocumentItem 
                key={doc.id}
                icon={getFileIcon(doc.type)}
                name={doc.name}
                size={formatFileSize(doc.size)}
                date={doc.uploadedAt.toLocaleDateString('en-GB')}
                iconColor={getFileIconColor(doc.type)}
                onDelete={() => handleDeleteDocument(doc.id)}
                url={doc.url}
              />
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <Icon name="search" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No documents found</h4>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
      
    </div>
  );
}

function DocumentItem({ icon, name, size, date, iconColor, onDelete, url }: {
  icon: string;
  name: string;
  size: string;
  date: string;
  iconColor: string;
  onDelete?: () => void;
  url?: string;
}) {
  const [showActions, setShowActions] = useState(false);

  const handleDownload = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handlePreview = () => {
    if (url) {
      // Open in new tab for preview
      window.open(url, '_blank');
    }
  };

  const handleShare = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      // You could add a toast notification here
    }
  };

  return (
    <li 
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 group gap-3"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
        <div className="relative flex-shrink-0">
          <Icon name={icon} className={`w-8 h-8 sm:w-10 sm:h-10 ${iconColor}`} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base text-gray-800 truncate">{name}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
            <span>{size}</span>
            <span>•</span>
            <span>Uploaded {date}</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
              Available
            </span>
          </div>
        </div>
      </div>
      
      <div className={`flex items-center gap-1 transition-opacity duration-200 w-full sm:w-auto justify-end ${
        showActions ? 'opacity-100' : 'opacity-0 sm:opacity-0'
      }`}>
        {url && (
          <>
            <button 
              onClick={handlePreview}
              className="p-2 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors" 
              title="Preview"
            >
              <Icon name="eye" className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 rounded-full text-gray-400 hover:bg-green-100 hover:text-green-600 transition-colors" 
              title="Download"
            >
              <Icon name="download" className="w-4 h-4" />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-full text-gray-400 hover:bg-purple-100 hover:text-purple-600 transition-colors" 
              title="Share"
            >
              <Icon name="share" className="w-4 h-4" />
            </button>
          </>
        )}
        <button className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" title="More options">
          <Icon name="ellipsis" className="w-4 h-4" />
        </button>
        {onDelete && (
          <button 
            onClick={onDelete}
            className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors" 
            title="Delete"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        )}
      </div>
    </li>
  );
}

// Case Chats View
export function CaseChatsView() { 
  const { selectedCaseId } = useAppContext();
  const { chats, loading: chatsLoading } = useChats();
  const [linkedChats, setLinkedChats] = useState<any[]>([]);

  // Filter chats linked to the current case
  useEffect(() => {
    if (selectedCaseId && chats.length > 0) {
      const linked = chats.filter((chat: any) => chat.linkedCaseId === selectedCaseId);
      setLinkedChats(linked);
    } else {
      setLinkedChats([]);
    }
  }, [selectedCaseId, chats]);

  const handleOpenChat = (chatId: string) => {
    // This would typically navigate to the chat or open it in a modal
    console.log('Opening chat:', chatId);
  };

  const handleNewChat = () => {
    console.log('Creating new chat for this case');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Linked Chats</h3>
        <button 
          onClick={handleNewChat}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Icon name="plus" className="w-4 h-4" /> New Chat
        </button>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        {chatsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : linkedChats.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="comments" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No chats linked to this case</h4>
            <p className="text-gray-400">Create a new chat to start discussing this case</p>
          </div>
        ) : (
          <div className="space-y-4">
            {linkedChats.map((chat) => (
              <div key={chat.id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-800 truncate">{chat.title || 'Untitled Chat'}</h4>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full w-fit">
                        {chat.messageCount || 0} messages
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{chat.description || 'No description available'}</p>
                    <p className="text-xs text-gray-500">
                      Last activity: {chat.lastMessage || 'Recently created'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleOpenChat(chat.id)}
                    className="bg-white hover:bg-gray-200 border border-gray-300 text-gray-700 text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Icon name="message" className="w-4 h-4" />
                    Open Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}

// Case Drafts View
export function CaseDraftsView() { 
  const [drafts] = useState<any[]>([]);

  const handleOpenDraft = (draftId: string) => {
    // This would typically open the draft in the editor
    console.log('Opening draft:', draftId);
  };

  const handleNewDraft = () => {
    console.log('Creating new draft for this case');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Final': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Linked Drafts</h3>
        <button 
          onClick={handleNewDraft}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Icon name="plus" className="w-4 h-4" /> New Draft
        </button>
      </div>
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="fileLines" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No drafts linked to this case</h4>
            <p className="text-gray-400">Create a new draft to start working on this case</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-800 truncate">{draft.title}</h4>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${getStatusColor(draft.status)}`}>
                        {draft.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{draft.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                      <span>Last modified: {draft.lastModified}</span>
                      <span>{draft.wordCount} words</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenDraft(draft.id)}
                    className="bg-white hover:bg-gray-200 border border-gray-300 text-gray-700 text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Icon name="fileLines" className="w-4 h-4" />
                    Open Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}

// Case Events View
export function CaseEventsView() { 
  const { selectedCaseId } = useAppContext();
  const [events, setEvents] = useState<any[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'Meeting',
    priority: 'medium',
    location: '',
    attendees: ''
  });

  // Load events when case changes
  useEffect(() => {
    const fetchEvents = async () => {
      if (selectedCaseId) {
        try {
          const response = await apiClient.get(`/api/workspace/events?caseId=${selectedCaseId}`);
          setEvents(response.events || []);
        } catch (error) {
          console.error('Failed to fetch events:', error);
        }
      }
    };
    fetchEvents();
  }, [selectedCaseId]);

  const handleAddEvent = () => {
    setIsAddingEvent(true);
    setNewEvent({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      type: 'Meeting',
      priority: 'medium',
      location: '',
      attendees: ''
    });
  };

  const handleSaveEvent = async () => {
    try {
      const eventData = {
        ...newEvent,
        caseId: selectedCaseId,
      };
      
      const response = await apiClient.post('/api/workspace/events', eventData);
      
      setEvents(prev => [...prev, response]);
      setIsAddingEvent(false);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await apiClient.delete(`/api/cases/${selectedCaseId}/events/${eventId}`);
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Hearing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Deadline': return 'bg-red-100 text-red-800 border-red-200';
      case 'Meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Court Date': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Document Filing': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      year: date.getFullYear().toString(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    };
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Events & Schedule</h3>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage hearings, deadlines, and important dates</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleAddEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
          >
            <Icon name="calendarPlus" className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Add Event Form */}
      {isAddingEvent && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Add New Event</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Meeting">Meeting</option>
                <option value="Hearing">Hearing</option>
                <option value="Deadline">Deadline</option>
                <option value="Court Date">Court Date</option>
                <option value="Document Filing">Document Filing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={newEvent.priority}
                onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter location"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter event description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setIsAddingEvent(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEvent}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              Save Event
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="calendar" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-2">No events scheduled</h4>
            <p className="text-gray-400">Add events to keep track of important dates and deadlines</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedEvents.map((event) => {
              const { day, month, year, weekday } = formatDate(event.date);
              return (
                <div key={event.id} className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(event.priority)}`}>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="text-center w-16 sm:w-20 bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200 flex-shrink-0">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{day}</p>
                      <p className="text-xs text-blue-500 uppercase font-semibold">{month}</p>
                      <p className="text-xs text-blue-400">{year}</p>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="font-semibold text-base sm:text-lg text-gray-800 break-words">{event.title}</h4>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getEventTypeColor(event.type)}`}>
                              {event.type}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              event.priority === 'high' ? 'bg-red-100 text-red-800' :
                              event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {event.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600 mb-2 break-words">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Icon name="clock" className="w-4 h-4" />
                              <span>{formatTime(event.time)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <Icon name="mapPin" className="w-4 h-4" />
                                <span className="truncate max-w-[200px] sm:max-w-none">{event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Icon name="calendar" className="w-4 h-4" />
                              <span>{weekday}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button 
                            onClick={() => setEditingEvent(event.id)}
                            className="p-2 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors" 
                            title="Edit"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors" 
                            title="Delete"
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Case Overview Component (contains AI summary, analytics, quick actions, etc.)
export function CaseOverview({ caseData, taskProgress }: { caseData?: any; taskProgress?: { completed: number; total: number } }) {
  const { selectedCaseId, setActiveView } = useAppContext();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [localTaskProgress, setLocalTaskProgress] = useState({ completed: 0, total: 0 });

  // Use prop taskProgress if available, otherwise use local state
  const currentTaskProgress = taskProgress || localTaskProgress;

  // Load case data and events
  useEffect(() => {
    const fetchData = async () => {
      if (selectedCaseId) {
        try {
          // Always fetch upcoming events (they might change)
          const eventsResponse = await apiClient.get(`/api/workspace/events?caseId=${selectedCaseId}`);
          setUpcomingEvents(eventsResponse.events || []);
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        }
      }
    };
    fetchData();  
  }, [selectedCaseId, caseData]);

  // Quick actions with enhanced functionality
  const quickActions = [
    { 
      id: 'add-event', 
      label: 'Add Event', 
      icon: 'calendarPlus', 
      description: 'Schedule hearings, deadlines, and meetings',
      onClick: () => {
        // Navigate to events tab
        const eventTabButton = document.querySelector('[data-tab="events"]') as HTMLButtonElement;
        if (eventTabButton) {
          eventTabButton.click();
        }
      } 
    },
    { 
      id: 'upload-doc', 
      label: 'Upload Doc', 
      icon: 'upload', 
      description: 'Add case documents and evidence',
      onClick: () => {
        // Navigate to documents tab
        const docsTabButton = document.querySelector('[data-tab="docs"]') as HTMLButtonElement;
        if (docsTabButton) {
          docsTabButton.click();
        }
      } 
    },
    { 
      id: 'create-draft', 
      label: 'Create Draft', 
      icon: 'fileEdit', 
      description: 'Start drafting legal documents',
      onClick: () => {
        // Navigate to drafts tab
        const draftsTabButton = document.querySelector('[data-tab="drafts"]') as HTMLButtonElement;
        if (draftsTabButton) {
          draftsTabButton.click();
        }
      } 
    },
    { 
      id: 'start-chat', 
      label: 'Start Chat', 
      icon: 'messageCircle', 
      description: 'Discuss case with AI assistant',
      onClick: () => {
        // Navigate to chats tab
        const chatsTabButton = document.querySelector('[data-tab="chats"]') as HTMLButtonElement;
        if (chatsTabButton) {
          chatsTabButton.click();
        }
      } 
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="calendar" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
              Upcoming Deadlines
            </h3>
          </div>
          <div className="p-4 sm:p-5">
            {upcomingEvents.length > 0 ? (
              <ul className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <li key={event.id} className="border-l-2 border-blue-500 pl-4 py-1">
                    <p className="font-medium text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {event.time && ` • ${event.time}`}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <Icon name="calendarX" className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No upcoming deadlines</p>
              </div>
            )}
            <button 
              className="mt-4 w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={() => {
                const eventsTabButton = document.querySelector('[data-tab="events"]') as HTMLButtonElement;
                if (eventsTabButton) eventsTabButton.click();
              }}
            >
              View All Events
            </button>
          </div>
        </div>

        {/* Key Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="users" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
              Key Contacts
            </h3>
          </div>
          <div className="p-4 sm:p-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</p>
                <p className="font-medium text-gray-800">{caseData?.clientName || 'Not specified'}</p>
                <p className="text-sm text-gray-600">{caseData?.clientContact || 'No contact info'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Opposing Counsel</p>
                <p className="font-medium text-gray-800">{caseData?.opposingCounselName || 'Not specified'}</p>
                <p className="text-sm text-gray-600">{caseData?.opposingCounselContact || 'No contact info'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Court Clerk</p>
                <p className="font-medium text-gray-800">{caseData?.courtClerkName || 'Not specified'}</p>
                <p className="text-sm text-gray-600">{caseData?.courtClerkContact || 'No contact info'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="zap" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
              Quick Actions
            </h3>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center flex-1">
                    <div className="bg-blue-100 group-hover:bg-blue-200 p-2.5 rounded-lg mr-4 transition-colors">
                      <Icon name={action.icon} className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="font-semibold text-gray-800 block">{action.label}</span>
                      <span className="text-sm text-gray-500">{action.description}</span>
                    </div>
                  </div>
                  <Icon name="chevronRight" className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Case Analytics & Insights */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
            <Icon name="barChart" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
            Case Analytics & Insights
          </h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Document Count */}
            <button 
              onClick={() => {
                const docsTabButton = document.querySelector('[data-tab="docs"]') as HTMLButtonElement;
                if (docsTabButton) docsTabButton.click();
              }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Documents</p>
                  <p className="text-2xl font-bold text-blue-800">{caseData?.details?.documentCount || 0}</p>
                </div>
                <Icon name="folder" className="w-8 h-8 text-blue-500" />
              </div>
            </button>

            {/* Drafts Count */}
            <button 
              onClick={() => {
                const draftsTabButton = document.querySelector('[data-tab="drafts"]') as HTMLButtonElement;
                if (draftsTabButton) draftsTabButton.click();
              }}
              className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Drafts</p>
                  <p className="text-2xl font-bold text-green-800">3</p>
                </div>
                <Icon name="fileLines" className="w-8 h-8 text-green-500" />
              </div>
            </button>

            {/* Events Scheduled */}
            <button 
              onClick={() => {
                const eventsTabButton = document.querySelector('[data-tab="events"]') as HTMLButtonElement;
                if (eventsTabButton) eventsTabButton.click();
              }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Events</p>
                  <p className="text-2xl font-bold text-purple-800">{upcomingEvents.length}</p>
                </div>
                <Icon name="calendar" className="w-8 h-8 text-purple-500" />
              </div>
            </button>

            {/* Days Active */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Days Active</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {caseData?.details?.filingDate ? 
                      Math.floor((new Date().getTime() - new Date(caseData.details.filingDate).getTime()) / (1000 * 60 * 60 * 24)) 
                      : 0}
                  </p>
                </div>
                <Icon name="clock" className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Task Completion</span>
                <span className="text-sm text-gray-500">
                  {currentTaskProgress.total > 0 ? `${Math.round((currentTaskProgress.completed / currentTaskProgress.total) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: currentTaskProgress.total > 0 ? `${(currentTaskProgress.completed / currentTaskProgress.total) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Documentation Complete</span>
                <span className="text-sm text-gray-500">60%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Case Details Component (only contains case details form)
export function CaseDetails({ caseData }: { caseData?: any }) {
  const { selectedCaseId } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState(() => {
    // Extract details from nested structure or flat structure
    if (!caseData) return {};
    // Check if data is in nested details object
    if (caseData.details) {
      return caseData.details;
    }
    // Otherwise return the data as-is
    return caseData;
  });

  // Update formData when caseData changes (important for when Firebase data loads)
  useEffect(() => {
    if (caseData) {
      // Extract details from nested structure or flat structure
      if (caseData.details) {
        setFormData(caseData.details);
      } else {
        setFormData(caseData);
      }
    }
  }, [caseData]);

  // Handle saving case details
  const handleSaveCaseDetails = async (updatedData: any) => {
    try {
      await apiClient.put(`/api/cases/${selectedCaseId}`, updatedData);
      setFormData({ ...formData, ...updatedData });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update case details:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const fields = [
    { key: 'caseNumber', label: 'Case Number', type: 'text' },
    { key: 'courtName', label: 'Court Name', type: 'text' },
    { key: 'judgeName', label: 'Judge Name', type: 'text' },
    { key: 'filingDate', label: 'Filing Date', type: 'date' },
    { key: 'caseType', label: 'Case Type', type: 'text' },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select', 
      options: ['Active', 'Closed', 'On Hold', 'Appeal'] 
    },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
    { key: 'nextHearingDate', label: 'Next Hearing', type: 'date' },
    { key: 'petitionerName', label: 'Petitioner', type: 'text' },
    { key: 'respondentName', label: 'Respondent', type: 'text' },
    { key: 'caseCategory', label: 'Case Category', type: 'text' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
            <Icon name="fileText" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
            Case Details
          </h3>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Icon name={isEditing ? 'x' : 'edit'} className="w-4 h-4 mr-1" />
            {isEditing ? 'Cancel' : 'Edit Details'}
          </button>
        </div>
        
        <div className="p-4 sm:p-5">
          {isEditing ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveCaseDetails(formData);
            }} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.key}
                        value={formData[field.key] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.key}
                        value={formData[field.key] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">{field.label}</p>
                  <div className="flex items-center">
                    <p className="text-gray-900">
                      {field.type === 'date' && formData[field.key] 
                        ? new Date(formData[field.key]).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : formData[field.key] || 'Not specified'
                      }
                    </p>
                    {field.key === 'status' && formData[field.key] && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        formData.status === 'Active' ? 'bg-green-100 text-green-800' :
                        formData.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                        formData.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {formData.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}