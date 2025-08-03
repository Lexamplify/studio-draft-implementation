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
? 'https://search-templates-k-350135218428.asia-south1.run.app/api/search-templates'
: 'https://search-templates-k-350135218428.asia-south1.run.app/api/search-templates';

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

  useEffect(() => {
    if (chatScrollAreaRef.current) {
      const viewport = chatScrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Add state for editing document
  const [editingDocUrl, setEditingDocUrl] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState<string | null>(null);
  const [isEditingLoading, setIsEditingLoading] = useState(false);

  const [pendingEditTemplate, setPendingEditTemplate] = useState<TemplateSearchResult | null>(null);

  const [pickerReady, setPickerReady] = useState(false);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  // Replace the Picker loading useEffect with a more robust version
  useEffect(() => {
    function checkPickerReady() {
      if (typeof window !== "undefined" && window.gapi && window.gapi.load) {
        window.gapi.load('picker', {
          callback: () => {
            // Wait for window.google.picker to be available
            const waitForPicker = setInterval(() => {
              if (window.google && window.google.picker) {
                setPickerReady(true);
                clearInterval(waitForPicker);
              }
            }, 100);
          }
        });
      } else {
        setTimeout(checkPickerReady, 200);
      }
    }
    checkPickerReady();
  }, []);

  // Update fetchDrafts to use token
  const fetchDrafts = async () => {
    if (tokenLoading || !token) return;
    setDraftsLoading(true);
    try {
      const res = await fetch('/api/my-drafts', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('fetchDrafts: data:', data);
      setDrafts(data.drafts || []);
    } catch (e) {
      console.error('Error fetching drafts:', e);
      setDrafts([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load drafts. Please try again.",
      });
    } finally {
      setDraftsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDrafts();
    }
  }, [token, tokenLoading]);

  // Fixed Google Picker implementation with Create New Folder option
  const showDriveFolderPicker = (accessToken: string, callback: (folderId: string) => void) => {
    if (!pickerReady) {
      toast({ variant: "destructive", title: "Google Picker Error", description: "Google Picker API not loaded yet. Please try again in a moment." });
      return;
    }
    if (!window.gapi?.load || !window.google?.picker) {
      toast({ variant: "destructive", title: "Google Picker Error", description: "Google Picker API not loaded." });
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

    console.log('Creating picker with access token:', accessToken?.substring(0, 20) + '...');
    
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMode(window.google.picker.DocsViewMode.LIST);
    
    // Create a custom button for creating a new folder
    const createFolderButton = window.document.createElement('div');
    createFolderButton.innerHTML = 'CREATE A NEW FOLDER';
    createFolderButton.style.cssText = `
      background: #1a73e8;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      margin: 8px;
      cursor: pointer;
      display: inline-block;
      font-size: 13px;
      font-weight: 500;
    `;
    
    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY!)
      .setCallback((data: any) => {
        console.log('Picker callback data:', data);
        if (data.action === window.google?.picker.Action.PICKED && data.docs && data.docs[0]) {
          // Show loading state and slight delay for smooth transition
          setIsEditingLoading(true);
          // Add a small delay to show the loading state
          setTimeout(() => {
            // Hide the picker
            picker.setVisible(false);
            // Execute the callback after a short delay to ensure smooth transition
            setTimeout(() => {
              callback(data.docs[0].id);
            }, 100);
          }, 300);
        } else if (data.action === window.google?.picker.Action.CANCEL) {
          toast({ title: "Picker Cancelled", description: "No folder selected." });
          setIsEditingLoading(false);
        } else if (data.action === window.google?.picker.Action.LOADED) {
          console.log('Picker loaded successfully');
          // Add the create folder button to the picker UI
          const buttons = document.querySelectorAll('.picker-dialog-buttons');
          if (buttons && buttons[0]) {
            buttons[0].prepend(createFolderButton);
          }
        }
      })
      .setTitle("Select a folder to save your template")
      .setOrigin(window.location.protocol + '//' + window.location.host)
      .build();
    
    // Handle create folder button click
    createFolderButton.onclick = async () => {
      try {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;
        
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
        callback(folder.id);
        picker.setVisible(false);
      } catch (error) {
        console.error('Error creating folder:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create folder. Please try again.',
        });
      }
    };
    
    // Handle picker close event
    const originalSetVisible = picker.setVisible;
    picker.setVisible = function(visible: boolean) {
      if (!visible) {
        // Restore original XHR open when picker is closed
        if (window.XMLHttpRequest.prototype.open !== originalXHROpen) {
          window.XMLHttpRequest.prototype.open = originalXHROpen;
        }
        setIsEditingLoading(false);
      }
      return originalSetVisible.call(this, visible);
    };
    
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
  };

  const handleViewDocument = (doc: TemplateSearchResult) => {
    setViewingDocument(doc);
    const config = getEmbedConfigForDraft(doc.url);
    setEmbedConfig(config);
    setChatMessages([]);
    if (config.error) {
      toast({
        variant: "default",
        title: "Document Preview Info",
        description: config.error,
        duration: 5000,
      });
    }
  };

  const handleClosePreview = () => {
    setViewingDocument(null);
    setEmbedConfig(null);
    setChatMessages([]);
  };

  const handleConceptualEdit = () => {
    toast({
      title: "Conceptual Action: Edit Document",
      description: "To edit this DOCX, it would typically be uploaded to Google Docs (or a similar service) and then opened for editing. This step is conceptual for now.",
      duration: 7000,
    });
  };

  const handleDownloadDocument = async (docUrl?: string) => {
    if (!docUrl) {
      toast({ variant: "destructive", title: "Download Error", description: "No URL available for download."});
      return;
    }
    if (docUrl.startsWith("https://docs.google.com/document/d/")) {
        try {
            const urlObj = new URL(docUrl);
            const pathParts = urlObj.pathname.split('/');
            const dIndex = pathParts.indexOf('d');
            if (dIndex !== -1 && dIndex < pathParts.length - 1) {
                const docId = pathParts[dIndex + 1];
                window.open(`https://docs.google.com/document/d/${docId}/export?format=docx`, '_blank');
                toast({ title: "Download Started", description: "Your DOCX download should begin shortly." });
                return;
            }
        } catch (e) { console.error("Error parsing GDoc URL for download:", e); }
    }
    // For Firebase Storage or other URLs, get a signed URL from the backend
    try {
      const res = await fetch('/api/download-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageUrl: docUrl }),
      });
      const data = await res.json();
      if (res.ok && data.signedUrl) {
        window.open(data.signedUrl, '_blank');
        toast({ title: "Download Started", description: "Your download should begin shortly." });
      } else {
        toast({ variant: "destructive", title: "Download Error", description: data.error || "Failed to get download link." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Download Error", description: "Failed to get download link." });
    }
  };

  // Chat Panel Handlers
  const handleChatSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const history = chatMessages.map((msg) => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }]
      }));
      const aiInput: LegalAdviceChatInput = {
        question: userMessage.content,
        chatHistory: history.length > 0 ? history : undefined,
      };
      const result: LegalAdviceChatOutput = await legalAdviceChat(aiInput);
      
      if (result && typeof result.answer === 'string') {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.answer,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid AI response format");
      }
    } catch (error) {
      console.error("Error getting AI chat response:", error);
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Failed to get response from AI assistant.",
      });
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // New handler for Edit button
  const handleEditDocument = async (template: TemplateSearchResult) => {
    if (!template || !template.url) return;
    
    // Check if we have a valid Google access token
    if (googleAccessToken) {
      try {
        await handleEditDocumentWithToken(template, googleAccessToken);
        return;
      } catch (error) {
        console.error('Error using stored token, will try to re-authenticate:', error);
        // Clear the invalid token and continue to login flow
        if (typeof window !== 'undefined') {
          localStorage.removeItem('googleAccessToken');
        }
        setGoogleAccessToken(null);
      }
    }
    
    // If we get here, either there was no token or it was invalid
    setPendingEditTemplate(template);
    login(); // This will trigger Google OAuth flow
  };

  // Handler to close the editor
  const handleCloseEditor = () => {
    setEditingDocUrl(null);
    setEditingDocName(null);
  };

  if (viewingDocument && embedConfig) {
    return (
      <ResizablePanelGroup direction="horizontal" className="h-full w-full max-h-[calc(100vh-var(--header-height,4rem)-2rem)]"> {/* Adjust max-h based on your header and padding */}
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="flex flex-col h-full">
            <CardHeader className="p-2 border-b flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-semibold">{viewingDocument.name}</CardTitle>
                </div>
                <Button variant="outline" onClick={handleClosePreview} size="sm">
                  <Icons.Close className="mr-2 h-4 w-4" /> Close Preview
                </Button>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-hidden rounded-md border-0 shadow-inner bg-muted/20 p-1">
              {embedConfig.url.startsWith("data:text/html") ? (
                <div className="w-full h-full flex items-center justify-center bg-background rounded-sm">
                  <div dangerouslySetInnerHTML={{ __html: embedConfig.url.split(',')[1] || "" }} className="text-center p-4 text-destructive-foreground bg-destructive rounded-md shadow" />
                </div>
              ) : (
                <iframe
                  src={embedConfig.url}
                  className="w-full h-full border-0 bg-background rounded-sm"
                  title={viewingDocument.name}
                  aria-label={`Document content for ${viewingDocument.name}`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                ></iframe>
              )}
            </div>
            <CardFooter className="p-1.5 border-t flex-shrink-0 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(viewingDocument.url)}>
                    <Icons.Download className="mr-2 h-4 w-4" /> Download Original
                </Button>
                {!embedConfig.isEditable && viewingDocument.url && !viewingDocument.url.startsWith("data:") && (
                  <Button variant="outline" size="sm" onClick={handleConceptualEdit}>
                    <Icons.Edit className="mr-2 h-4 w-4" /> Edit with Google Docs (Conceptual)
                  </Button>
                )}
                {embedConfig.isEditable && (
                  <Button size="sm" variant="default" disabled>
                    <Icons.Save className="mr-2 h-4 w-4" /> Save Changes (Conceptual)
                  </Button>
                )}
            </CardFooter>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="flex flex-col h-full border-l">
            <div className="p-2 border-b flex items-center justify-center flex-shrink-0">
                <Icons.Chat className="h-5 w-5 text-primary" />
                <h3 className="ml-2 text-sm font-medium">AI Assistance</h3>
            </div>

            <ScrollArea className="flex-1 p-3" ref={chatScrollAreaRef}>
              <div className="space-y-4 mb-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><Icons.Assistant className="h-5 w-5 text-primary" /></AvatarFallback>
                      </Avatar>
                    )}
                    <Card className={`max-w-xs shadow-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <CardContent className="p-2.5">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <ClientFormattedTime
                          date={message.timestamp}
                          options={{ hour: '2-digit', minute: '2-digit' }}
                          className="text-xs mt-1 opacity-70 text-right block"
                        />
                      </CardContent>
                    </Card>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><Icons.User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8"><AvatarFallback><Icons.Assistant className="h-5 w-5 text-primary" /></AvatarFallback></Avatar>
                    <Card className="max-w-xs shadow-sm bg-muted">
                      <CardContent className="p-2.5"><div className="flex items-center space-x-2">
                        <Icons.Sparkles className="h-4 w-4 animate-pulse text-primary" />
                        <p className="text-sm text-muted-foreground">Typing...</p>
                      </div></CardContent>
                    </Card>
                  </div>
                )}
                 {chatMessages.length === 0 && !isChatLoading && (
                  <div className="text-center text-muted-foreground py-6">
                    <Icons.Chat className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ask the AI about this document or legal topics.</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form onSubmit={handleChatSubmit} className="flex items-center gap-2 border-t p-2 mt-auto flex-shrink-0">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a general question..."
                className="flex-1"
                disabled={isChatLoading}
                aria-label="Chat input for general questions"
              />
              <Button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-accent hover:bg-accent/90">
                <Icons.Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  if (editingDocUrl) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-2 border-b bg-muted">
          <span className="font-semibold text-base truncate">Editing: {editingDocName}</span>
          <Button variant="outline" size="sm" onClick={handleCloseEditor}>
            <Icons.Close className="mr-2 h-4 w-4" /> Close Editor
          </Button>
        </div>
        <iframe
          src={editingDocUrl}
          className="flex-1 w-full border-0 bg-background"
          title={editingDocName || 'Google Doc Editor'}
          aria-label="Google Docs Editor"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          style={{ minHeight: '80vh' }}
        ></iframe>
      </div>
    );
  }

  // This is the search interface, shown when no document is selected
  return (
    <div className="max-w-4xl mx-auto w-full py-8">
      {/* My Drafts Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Drafts</h2>
        {draftsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg bg-muted p-4 shadow animate-pulse h-32" />
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Icons.File className="mx-auto h-10 w-10 mb-2" />
            <div className="text-lg font-medium">No drafts yet</div>
            <div className="text-sm">Start by copying a template to your Drive.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft) => (
              <Card key={draft.fileId} className="shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="truncate">{draft.fileName}</CardTitle>
                  <CardDescription>
                    {draft.templateType?.toUpperCase() || 'DOC'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-2">
                    Last edited: {draft.updatedAt ? format(new Date(draft.updatedAt), 'PPpp') : 'Unknown'}
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setEditingDocUrl(draft.docUrl);
                      setEditingDocName(draft.fileName);
                    }}
                  >
                    Continue Editing
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col h-full p-4 sm:p-6 md:p-8">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-xl font-semibold">Find Document Templates</CardTitle>
          <CardDescription className="text-sm">Search our library of legal draft templates. Some documents (Google Docs) can be edited directly.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6">
          <Input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords (e.g., 'NDA', 'lease agreement')"
            className="flex-1"
            disabled={isLoading}
            aria-label="Template search keywords"
          />
          <Button type="submit" disabled={isLoading || !keywords.trim()}>
            {isLoading ? (
              <Icons.Sparkles className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Icons.Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </form>

        <ScrollArea className="flex-1">
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="shadow-sm">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6 mt-1" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((template) => (
                <Card key={template.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex justify-end items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={template.url ? () => handleDownloadDocument(template.url) : undefined}
                      disabled={isEditingLoading || !template.url}
                    >
                      <Icons.Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={template.url ? () => handleEditDocument(template) : undefined}
                      disabled={isEditingLoading || !template.url}
                    >
                      <Icons.Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && results.length === 0 && keywords && !viewingDocument && (
             <div className="text-center py-10">
              <Icons.Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates found for &quot;{keywords}&quot;.</p>
              <p className="text-sm text-muted-foreground">Try using different or more general keywords.</p>
            </div>
          )}

           {!isLoading && results.length === 0 && !keywords && !viewingDocument && (
             <div className="text-center py-10">
              <Icons.Template className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Enter keywords above to search for templates.</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

