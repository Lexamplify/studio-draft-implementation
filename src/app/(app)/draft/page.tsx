"use client";

import type { FormEvent } from "react";
import { useState, useEffect, useRef } from "react";
import { legalAdviceChat, type LegalAdviceChatInput, type LegalAdviceChatOutput } from "@/ai/flows/legal-advice-chat";
// applySuggestionToGoogleDoc is kept conceptually, though UI entry point from here is removed
// import { applySuggestionToGoogleDoc, type EditGoogleDocumentInput, type EditGoogleDocumentOutput } from "@/ai/tools/google-docs-editor-tool";

import type { TemplateSearchResult, ChatMessage } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ClientFormattedTime from "@/components/client-formatted-time";
import { useGoogleLogin } from '@react-oauth/google';
import { format } from 'date-fns';
import { useFirebaseUser } from "@/hooks/use-firebase-user";
import { useAuthToken } from "@/hooks/use-auth-token";

declare global {
  interface Window {
    gapi: any;
    google: any;
    firebase: any;
  }
}

const SEARCH_TEMPLATES_API_URL = process.env.NODE_ENV === 'production'
? 'http://127.0.0.1:8000/api/search-templates'
: 'http://127.0.0.1:8000/api/search-templates';

const getEmbedConfigForDraft = (docUrl?: string): { url: string; isEditable: boolean; error?: string } => {
  if (!docUrl) {
    return { url: `data:text/html,<h1>Preview Error</h1><p>No URL provided.</p>`, isEditable: false, error: "No URL provided." };
  }

  if (docUrl.startsWith("https://docs.google.com/document/d/")) {
    try {
      const urlObj = new URL(docUrl);
      const pathParts = urlObj.pathname.split('/');
      const dIndex = pathParts.indexOf('d');

      if (dIndex === -1 || dIndex >= pathParts.length - 1) {
        console.warn("Malformed Google Doc URL, falling back to gview:", docUrl);
        return {
          url: `https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true`,
          isEditable: false,
          error: "Malformed Google Document URL. Displaying in viewer mode."
        };
      }
      const docId = pathParts[dIndex + 1];
      // Construct an editable embed URL with full UI controls (removed rm=minimal)
      return {
        url: `https://docs.google.com/document/d/${docId}/edit?usp=sharing&embedded=true`,
        isEditable: true
      };
    } catch (e) {
      console.error("Error parsing Google document URL for embed:", e);
      return {
        url: `https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true`,
        isEditable: false,
        error: "Error processing Google Document URL. Displaying in viewer mode."
       };
    }
  } else if (docUrl.includes('firebasestorage.googleapis.com') || docUrl.includes('storage.googleapis.com')) {
    return {
      url: `https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=true`,
      isEditable: false
    };
  } else {
    return {
      url: `data:text/html,<h1>Preview Error</h1><p>Unsupported document URL format or direct viewing/editing not possible for this link type.</p><p>${docUrl}</p>`,
      isEditable: false,
      error: "Unsupported document URL format."
    };
  }
};

type Draft = {
  fileId: string;
  fileName: string;
  templateType?: string;
  updatedAt?: string;
  docUrl: string;
};

export default function DraftPage() {
  const [keywords, setKeywords] = useState("");
  const [results, setResults] = useState<TemplateSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<TemplateSearchResult | null>(null);
  const [embedConfig, setEmbedConfig] = useState<{ url: string; isEditable: boolean; error?: string } | null>(null);
  const { toast } = useToast();

  // Chat panel state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  const { token, loading: tokenLoading } = useAuthToken();

  // State for Google OAuth access token (separate from Firebase token)
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Helper function to handle editing with Google access token
  const handleEditDocumentWithToken = async (template: TemplateSearchResult, accessToken: string) => {
    if (!pickerReady) {
      toast({ variant: "destructive", title: "Google Picker Error", description: "Google Picker API not loaded yet. Please try again in a moment." });
      return;
    }
    
    setIsEditingLoading(true);
    showDriveFolderPicker(accessToken, async (folderId: string) => {
      try {
        const templateUrl = template.url;
        if (!templateUrl) return;
        if (!user) {
          toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in to edit documents.' });
          return;
        }
        const res = await fetch('/api/copy-to-drive', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Firebase token for API auth
          },
          body: JSON.stringify({
            templateUrl,
            templateType: templateUrl.includes('docs.google.com/document/d/') ? 'gdoc' : 'docx',
            accessToken: accessToken, // Google access token for Drive API
            fileName: template.name,
            folderId, // Pass the selected folder
          }),
        });
        const data = await res.json();
        console.log('handleEditDocument: copy-to-drive response:', data);
        if (data.docUrl) {
          setEditingDocUrl(data.docUrl);
          setEditingDocName(template.name);
          // Refetch drafts after saving
          fetchDrafts();
        } else {
          toast({ variant: 'destructive', title: 'Edit Error', description: data.error || 'Failed to copy document.' });
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Edit Error', description: 'Failed to copy document.' });
      } finally {
        setIsEditingLoading(false);
      }
    });
  };

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: 'select_account',
    onSuccess: tokenResponse => {
      console.log('Google OAuth success:', tokenResponse);
      const accessToken = tokenResponse.access_token;
      setGoogleAccessToken(accessToken);
      
      // Store the token in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('googleAccessToken', accessToken);
      }
      
      // If there's a pending edit, execute it now
      if (pendingEditTemplate) {
        handleEditDocumentWithToken(pendingEditTemplate, accessToken);
        setPendingEditTemplate(null);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      toast({ 
        variant: "destructive", 
        title: "Google Login Failed", 
        description: error.error_description || "Failed to authenticate with Google. Please try again." 
      });
      
      // Clear any invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('googleAccessToken');
      }
      setGoogleAccessToken(null);
    },
  });

  const { user, loading: authLoading } = useFirebaseUser();

  // Get document ID from URL query parameter
  const documentId = searchParams?.get('doc') || null;
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(documentId);

  // handleOpenDocument function removed - no longer needed

  // Handle closing the editor
  const handleCloseEditor = () => {
    setCurrentDocumentId(null);
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('doc');
    window.history.pushState({}, '', url.toString());
  };

  // Check for document ID in URL on page load
  useEffect(() => {
    if (token) {
      fetchDrafts();
    }
  }, [token, tokenLoading]);

  // Handle creating a new folder in Google Drive
  const handleCreateFolder = async (accessToken: string, callback: (folderId: string) => void) => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      setIsEditingLoading(true);
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      const folder = await response.json();
      toast({
        title: 'Folder created',
        description: `Folder "${folder.name}" was created successfully.`
      });

      // Return the new folder ID
      callback(folder.id);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create folder. Please try again.'
      });
    } finally {
      setIsEditingLoading(false);
    }
  };

  // Google Picker implementation for folder selection
  const showDriveFolderPicker = (accessToken: string, callback: (folderId: string) => void) => {
    if (!pickerReady) {
      toast({ variant: "destructive", title: "Google Picker Error", description: "Google Picker API not loaded yet. Please try again in a moment." });
      return;
    }

    // Suppress Google Picker's analytics errors
    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function() {
      const url = arguments[1];
      if (url && typeof url === 'string' && url.includes('/picker/logImpressions')) {
        // Don't send analytics requests
        this.addEventListener = function() {};
        this.send = function() {};
      }
      return originalXHROpen.apply(this, arguments as any);
    };

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMode(window.google.picker.DocsViewMode.LIST);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY!)
      .setCallback((data: any) => {
        if (data.action === window.google?.picker.Action.PICKED && data.docs && data.docs[0]) {
          setIsEditingLoading(true);
          // Small delay for smooth transition
          setTimeout(() => {
            picker.setVisible(false);
            callback(data.docs[0].id);
          }, 300);
        } else if (data.action === window.google?.picker.Action.CANCEL) {
          toast({ title: "Picker Cancelled", description: "No folder selected." });
          setIsEditingLoading(false);
        }
      })
      .setTitle("Select a folder to save your template")
      .setOrigin(window.location.protocol + '//' + window.location.host)
      .build();

    // Clean up XMLHttpRequest override when picker is closed
    const cleanup = () => {
      window.XMLHttpRequest.prototype.open = originalXHROpen;
    };

    // Set up a mutation observer to detect when the picker is closed
    const observer = new MutationObserver((mutations) => {
      const isPickerVisible = !!document.querySelector('.picker-dialog');
      if (!isPickerVisible) {
        cleanup();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also set a timeout to clean up just in case
    setTimeout(cleanup, 30000); // 30 seconds timeout

    // Show the picker
    picker.setVisible(true);
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!keywords.trim() || isLoading) return;

    setIsLoading(true);
    setResults([]);
    setViewingDocument(null);
    setEmbedConfig(null);
    setChatMessages([]);

    try {
      const res = await fetch(SEARCH_TEMPLATES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keywords }),
      });
      const data = await res.json();
      console.log('handleSearch: data:', data);
      const searchResults = (data.results || []).map((item: any, index: number) => ({
        id: item.id || `${Date.now()}-${index}`,
        name: item.name || "Untitled Document.docx",
        description: item.description || `Legal template: ${item.name || 'Unknown'}`,
        url: item.storageUrl,
      }));
      setResults(searchResults);

      if (searchResults.length === 0) {
        toast({
          title: "No Results",
          description: "No templates found for your keywords. Try different terms.",
        });
      }
    } catch (error) {
      console.error("Error searching templates:", error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search for templates. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [documentId, currentDocumentId]);

  // Show loading state while Firebase auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
    );
  }

  if (editingDocUrl) {
    console.log('editingDocUrl', editingDocUrl);
    console.log('editingDocName', editingDocName);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the document editor</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show document editor if document ID is present
  if (currentDocumentId) {
    return (
      <DocumentEditor 
        documentId={currentDocumentId} 
        onClose={handleCloseEditor}
      />
    );
  }

  // Show base editor by default (no document ID)
  return (
    <div className="h-screen w-full">
      <div className="relative h-full">
        <iframe
          src={`${process.env.NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL}/`}
          className="w-full h-full border-0"
          title="Document Editor"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}