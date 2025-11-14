"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { EditorIntegration } from '@/lib/editor-integration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Wand2, 
  Loader2,
  Send,
  Copy,
  X,
  Paperclip
} from 'lucide-react';
import EditorToolSelectionPopover from '@/components/editor/editor-tool-selection-popover';
import { Icon } from '@/components/ui/icon';
import { toast } from 'sonner';
import { useFirebaseUser } from '@/hooks/use-firebase-user';
import { useChats } from '@/context/chats-context';
import { apiClient } from '@/lib/api-client';

interface LegalAIEditorProps {
  editor: Editor;
  caseData?: any;
  documentId?: string;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  insertableText?: string; // Text that can be inserted into the document
  isDocumentEdit?: boolean; // Whether this is a document edit (uses TipTap JSON)
}

export const LegalAIEditor: React.FC<LegalAIEditorProps> = ({ editor, caseData, documentId, className, isCollapsed = false, onToggleCollapse }) => {
  const [integration, setIntegration] = useState<EditorIntegration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [hasSelection, setHasSelection] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documentChatId, setDocumentChatId] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const prevCollapsedRef = useRef(isCollapsed);
  const [isToolPopoverOpen, setIsToolPopoverOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useFirebaseUser();
  const { chats, createChat, loading: chatsLoading } = useChats();

  // Detect mobile/tablet view (< 1024px covers mobile and iPad)
  useEffect(() => {
    const checkMobileOrTablet = () => {
      setIsMobileOrTablet(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    return () => window.removeEventListener('resize', checkMobileOrTablet);
  }, []);

  // Trigger animations when panel opens/closes
  useEffect(() => {
    if (isMobileOrTablet && onToggleCollapse) {
      const wasCollapsed = prevCollapsedRef.current;
      const isNowCollapsed = isCollapsed;
      
      if (!wasCollapsed && isNowCollapsed) {
        // Panel is closing
        setIsClosing(true);
        const timer = setTimeout(() => {
          setIsClosing(false);
        }, 300);
        return () => clearTimeout(timer);
      } else if (wasCollapsed && !isNowCollapsed) {
        // Panel is opening
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 300);
        return () => clearTimeout(timer);
      }
      
      prevCollapsedRef.current = isCollapsed;
    }
  }, [isCollapsed, isMobileOrTablet, onToggleCollapse]);

  // Handle backdrop click to close on mobile/tablet
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isMobileOrTablet && !isCollapsed && onToggleCollapse && e.target === e.currentTarget) {
      onToggleCollapse();
    }
  };

  // Initialize editor integration
  useEffect(() => {
    if (editor) {
      const editorIntegration = new EditorIntegration(editor, {
        enableHistory: true,
        showConfidence: false,
        validateChanges: true,
        autoSave: false
      });
      setIntegration(editorIntegration);
    }
  }, [editor]);

  // Track selection changes
  useEffect(() => {
    if (!integration) return;

    const checkSelection = () => {
      setHasSelection(integration.hasSelection());
    };

    checkSelection();
    editor.on('selectionUpdate', checkSelection);
    editor.on('transaction', checkSelection);

    return () => {
      editor.off('selectionUpdate', checkSelection);
      editor.off('transaction', checkSelection);
    };
  }, [integration, editor]);

  // Load messages from Firestore
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const data = await apiClient.get(`/api/chats/${chatId}/messages`);
      const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        insertableText: msg.insertableText,
        isDocumentEdit: msg.isDocumentEdit,
      }));
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Set empty messages array on error to prevent stale state
      setMessages([]);
    }
  }, []);

  // Initialize or retrieve document-scoped chat
  useEffect(() => {
    const initializeDocumentChat = async () => {
      if (!user || !documentId) {
        setIsLoadingChat(false);
        return;
      }

      // Wait for chats to finish loading before checking
      if (chatsLoading) {
        return;
      }

      try {
        setIsLoadingChat(true);
        
        // Look for existing chat with special title pattern for this document
        const documentChatTitle = `__document_chat_${documentId}__`;
        const existingChat = chats.find(chat => chat.title === documentChatTitle);

        if (existingChat) {
          setDocumentChatId(existingChat.id);
          // Load existing messages
          await loadMessages(existingChat.id);
        } else {
          // Create new chat for this document
          const newChat = await createChat({
            title: documentChatTitle,
            linkedCaseId: caseData?.id,
          });
          setDocumentChatId(newChat.id);
          // Load messages for the newly created chat (might be empty, but ensures consistency)
          await loadMessages(newChat.id);
        }
      } catch (error) {
        console.error('Error initializing document chat:', error);
        toast.error('Failed to initialize chat');
      } finally {
        setIsLoadingChat(false);
      }
    };

    initializeDocumentChat();
  }, [user, documentId, chats, chatsLoading, createChat, caseData?.id, loadMessages]);

  // Save message to Firestore
  const saveMessage = async (message: Message) => {
    if (!documentChatId) return;

    try {
      await apiClient.post(`/api/chats/${documentChatId}/messages`, {
        role: message.role,
        content: message.content,
        insertableText: message.insertableText,
        isDocumentEdit: message.isDocumentEdit,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Smart interception for case data queries
  const interceptCaseDataQuery = (query: string): string | null => {
    if (!caseData) return null;

    const lowerQuery = query.toLowerCase();

    // Respondent name
    if (lowerQuery.includes("respondent") && (lowerQuery.includes("name") || lowerQuery.includes("who"))) {
      const respondentName = caseData.details?.respondentName;
      return respondentName 
        ? `The respondent is: ${respondentName}` 
        : "The respondent's name is not specified in this case.";
    }

    // Petitioner name
    if (lowerQuery.includes("petitioner") && (lowerQuery.includes("name") || lowerQuery.includes("who"))) {
      const petitionerName = caseData.details?.petitionerName;
      return petitionerName 
        ? `The petitioner is: ${petitionerName}` 
        : "The petitioner's name is not specified in this case.";
    }

    // Case number
    if (lowerQuery.includes("case number") || lowerQuery.includes("case no")) {
      const caseNumber = caseData.details?.caseNumber;
      return caseNumber 
        ? `The case number is: ${caseNumber}` 
        : "The case number is not specified.";
    }

    // Court name
    if (lowerQuery.includes("court") && lowerQuery.includes("name")) {
      const courtName = caseData.details?.courtName;
      return courtName 
        ? `The court is: ${courtName}` 
        : "The court name is not specified.";
    }

    // Judge name
    if (lowerQuery.includes("judge") && lowerQuery.includes("name")) {
      const judgeName = caseData.details?.judgeName;
      return judgeName 
        ? `The judge is: ${judgeName}` 
        : "The judge's name is not specified.";
    }

    // Next hearing date
    if (lowerQuery.includes("hearing") && (lowerQuery.includes("date") || lowerQuery.includes("when"))) {
      const hearingDate = caseData.details?.nextHearingDate;
      return hearingDate 
        ? `The next hearing is scheduled for: ${hearingDate}` 
        : "No hearing date is scheduled.";
    }

    // Filing date
    if (lowerQuery.includes("filing date") || lowerQuery.includes("filed on") || lowerQuery.includes("when was filed")) {
      const filingDate = caseData.details?.filingDate;
      return filingDate 
        ? `The case was filed on: ${filingDate}` 
        : "The filing date is not specified.";
    }

    // Case status
    if (lowerQuery.includes("status") || lowerQuery.includes("state")) {
      const status = caseData.details?.status;
      return status 
        ? `The case status is: ${status}` 
        : "The case status is not specified.";
    }

    // Client information
    if (lowerQuery.includes("client") && (lowerQuery.includes("name") || lowerQuery.includes("who"))) {
      const clientName = caseData.details?.clientName;
      return clientName 
        ? `The client is: ${clientName}` 
        : "Client information is not specified.";
    }

    return null;
  };

  // Map suggestion button to command text
  const getSuggestionCommand = (suggestionType: string): string => {
    const commands: Record<string, string> = {
      'review-errors': 'Review this text for common legal errors and suggest corrections',
      'check-citations': 'Check all citations in this document for accuracy and formatting',
      'refine-text': 'Refine and improve the highlighted text for clarity and legal precision',
      'find-caselaw': 'Find relevant case law and precedents for the highlighted argument'
    };
    return commands[suggestionType] || '';
  };

  // Handle suggestion button click
  const handleSuggestion = useCallback(async (suggestionType: string) => {
    const command = getSuggestionCommand(suggestionType);
    if (!command) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: command,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);

    setIsProcessing(true);
    try {
      const response = await integration?.processLegalCommand(command);
      
      if (response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I\'ve updated the document based on your request.',
          timestamp: new Date(),
          isDocumentEdit: true,
        };
        setMessages(prev => [...prev, aiMessage]);
        await saveMessage(aiMessage);
        
        toast.success('Document updated successfully');
      }
    } catch (error) {
      console.error('Error executing suggestion:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
      toast.error('Failed to execute suggestion');
    } finally {
      setIsProcessing(false);
    }
  }, [integration, saveMessage]);

  // Detect if a query is a document editing command
  const isDocumentEditCommand = (query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const editKeywords = [
      'add', 'insert', 'update', 'change', 'replace', 'modify', 'edit', 'fix', 'correct',
      'remove', 'delete', 'rewrite', 'rephrase', 'improve', 'enhance', 'refine',
      'today\'s date', 'current date', 'date', 'today', 'now',
      'find and replace', 'search and replace', 'update all', 'change all'
    ];
    return editKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  // Handle chat message send
  const handleChatSend = useCallback(async () => {
    if (!chatMessage.trim() && stagedFiles.length === 0) {
      toast.error('Please enter a message or add a file');
      return;
    }

    const query = chatMessage.trim() || (stagedFiles.length > 0 ? `Please analyze the attached file(s): ${stagedFiles.map(f => f.name).join(', ')}` : '');

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    setChatMessage('');
    // Clear staged files after adding to message
    setStagedFiles([]);

    // Check for case data query interception
    const interceptedResponse = interceptCaseDataQuery(query);
    
    if (interceptedResponse) {
      // Smart interception - answer directly from case data
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: interceptedResponse,
        timestamp: new Date(),
        insertableText: interceptedResponse.split(': ')[1] || interceptedResponse, // Extract the actual value
      };
      setMessages(prev => [...prev, aiMessage]);
      await saveMessage(aiMessage);
      return;
    }

    // Check if this is a document editing command
    const isEditCommand = isDocumentEditCommand(query);

    if (isEditCommand && integration) {
      // Document editing command - process with document editor
      setIsProcessing(true);
      try {
        const response = await integration.processLegalCommand(query);
        
        if (response) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'I\'ve updated the document based on your request.',
            timestamp: new Date(),
            isDocumentEdit: true,
          };
          setMessages(prev => [...prev, aiMessage]);
          await saveMessage(aiMessage);
          
          toast.success('Document updated successfully');
        }
      } catch (error) {
        console.error('Error processing document edit:', error);
        
        // Provide more specific error messages
        let errorContent = 'Sorry, I encountered an error updating the document. ';
        if (error instanceof Error) {
          if (error.message.includes('JSON') || error.message.includes('parse')) {
            errorContent += 'The AI response was malformed. Please try rephrasing your request or try again.';
          } else if (error.message.includes('No content')) {
            errorContent += 'Please ensure the document has content to edit.';
          } else {
            errorContent += error.message;
          }
        } else {
          errorContent += 'Please try again.';
        }
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        await saveMessage(errorMessage);
        toast.error('Failed to update document');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Conversational query - use chat API for AI response
      setIsProcessing(true);
      try {
        // Prepare chat history for API
        const chatHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));

        // Get current document content for context
        const documentContent = editor ? editor.getText() : '';
        
        // Call chat API
        const response = await apiClient.post('/api/chat', {
          message: query,
          chatHistory: chatHistory,
          chatId: documentChatId,
          context: {
            caseId: caseData?.id,
            documentId: documentId,
            userId: user?.uid,
            files: stagedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
          },
          document: documentContent || undefined,
          documentName: documentId ? `Document ${documentId}` : undefined
        });

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response || response.answer || 'I understand your question. How can I help you with this document or case?',
          timestamp: new Date(),
          insertableText: response.insertableText,
        };
        setMessages(prev => [...prev, aiMessage]);
        await saveMessage(aiMessage);
        
      } catch (error) {
        console.error('Error processing conversational message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        await saveMessage(errorMessage);
        toast.error('Failed to get AI response');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [integration, chatMessage, stagedFiles, interceptCaseDataQuery, saveMessage, documentChatId, caseData, documentId, user, editor, messages]);

  // Handle click to insert
  const handleInsertText = useCallback((text: string) => {
    if (!editor) return;

    try {
      editor.chain().focus().insertContent(text).run();
      toast.success('Text inserted successfully');
    } catch (error) {
      console.error('Error inserting text:', error);
      toast.error('Failed to insert text');
    }
  }, [editor]);

  // Handle copy to clipboard
  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setStagedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${newFiles.length} file(s) added`);
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle tool selection
  const handleSelectTool = useCallback((tool: { id: string; label: string }) => {
    const toolCommands: Record<string, string> = {
      'formatDocument': 'Format this document according to legal document standards',
      'addCitation': 'Add appropriate legal citations to the selected text',
      'checkCompliance': 'Check if this document complies with legal requirements',
      'summarizeSection': 'Summarize the selected section',
      'translateText': 'Translate the selected text',
      'improveClarity': 'Improve the clarity and readability of the selected text'
    };

    const command = toolCommands[tool.id];
    if (!command) return;

    // Set the command in the input
    setChatMessage(command);
  }, []);

  if (isLoadingChat) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-500">Loading assistant...</p>
        </div>
      </div>
    );
  }

  // Mobile/Tablet: overlay mode with backdrop
  if (isMobileOrTablet && onToggleCollapse) {
    // Don't show collapsed icon bar on mobile - handled by top button in layout
    if (isCollapsed) {
      return null;
    }

    // Show overlay panel when not collapsed
    return (
      <>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleBackdropClick}
        />
        
        {/* Panel - slides in from right */}
        <div 
          className={`fixed right-0 top-0 h-full w-[85vw] max-w-sm bg-white z-50 shadow-xl transition-transform duration-300 ease-in-out ${
            isClosing ? 'translate-x-full' : 'translate-x-0'
          } ${isAnimating ? 'animate-[slideInRight_0.3s_ease-in-out]' : ''}`}
        >
          <div className="h-full flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">AI Assistant</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Panel Content - Reuse desktop content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="legal-ai-editor h-full flex flex-col relative">
                {/* Contextual Suggestions */}
                <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Quick Actions</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {!hasSelection ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleSuggestion('review-errors')}
                          disabled={isProcessing}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <span className="font-medium text-sm">Review for errors</span>
                          <span className="text-xs text-gray-500 font-normal">Check common mistakes</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSuggestion('check-citations')}
                          disabled={isProcessing}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <span className="font-medium text-sm">Check citations</span>
                          <span className="text-xs text-gray-500 font-normal">Verify all references</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleSuggestion('refine-text')}
                          disabled={isProcessing}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <span className="font-medium text-sm">Refine text</span>
                          <span className="text-xs text-gray-500 font-normal">Improve clarity</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSuggestion('find-caselaw')}
                          disabled={isProcessing}
                          className="h-auto py-3 flex flex-col items-start gap-1"
                        >
                          <span className="font-medium text-sm">Find case law</span>
                          <span className="text-xs text-gray-500 font-normal">Get precedents</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 relative" style={{ paddingBottom: '100px' }}>
                  <div className="p-4">
                    <div className="w-full max-w-full space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-8 px-4">
                          <p className="mb-2">Ask me anything about {caseData ? 'this case' : 'your document'} or request document edits.</p>
                          <p className="text-xs text-gray-400">Use the quick actions above or type your question below.</p>
                        </div>
                      )}
                      
                      {messages.map((message) => (
                        <div key={message.id} className="flex flex-col space-y-2">
                          {message.role === 'user' ? (
                            <div className="flex justify-end">
                              <div className="bg-black text-white rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[85%] shadow-md">
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-start">
                              <div className="max-w-[85%]">
                                <p className="text-gray-900 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">{message.content}</p>
                                {message.insertableText && (
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleInsertText(message.insertableText!)}
                                      className="text-xs"
                                    >
                                      <Send className="h-3 w-3 mr-1" />
                                      Insert
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleCopyText(message.insertableText!)}
                                      className="text-xs"
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {isProcessing && (
                        <div className="flex justify-start">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <p className="text-gray-500 text-sm font-medium">AI is thinking...</p>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>

                {/* Fixed Input Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gray-50 p-3 z-30 border-t border-gray-200 shadow-sm">
                  <div className="bg-white border border-gray-300 rounded-2xl shadow-sm">
                    <div className="flex gap-2 p-2">
                      <Input
                        placeholder={`Ask about ${caseData ? 'this case' : 'your document'}...`}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSend();
                          }
                        }}
                        disabled={isProcessing}
                        className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                      />
                      <Button
                        onClick={handleChatSend}
                        disabled={isProcessing || !chatMessage.trim()}
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={`legal-ai-editor h-full flex flex-col relative overflow-hidden ${className || ''}`}>
      {/* Panel Header */}
      <Card className="border-0 rounded-none border-b flex-shrink-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              Assistant for: {caseData?.caseName || 'Document'}
            </CardTitle>
          </div>
          <CardDescription>
            Your intelligent assistant for this {caseData ? 'case' : 'document'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Contextual Suggestions */}
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-sm">Quick Actions</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {!hasSelection ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleSuggestion('review-errors')}
                disabled={isProcessing}
                className="h-auto py-3 flex flex-col items-start gap-1"
              >
                <span className="font-medium text-sm">Review for errors</span>
                <span className="text-xs text-gray-500 font-normal">Check common mistakes</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSuggestion('check-citations')}
                disabled={isProcessing}
                className="h-auto py-3 flex flex-col items-start gap-1"
              >
                <span className="font-medium text-sm">Check citations</span>
                <span className="text-xs text-gray-500 font-normal">Verify all references</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSuggestion('refine-text')}
                disabled={isProcessing}
                className="h-auto py-3 flex flex-col items-start gap-1"
              >
                <span className="font-medium text-sm">Refine text</span>
                <span className="text-xs text-gray-500 font-normal">Improve clarity</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSuggestion('find-caselaw')}
                disabled={isProcessing}
                className="h-auto py-3 flex flex-col items-start gap-1"
              >
                <span className="font-medium text-sm">Find case law</span>
                <span className="text-xs text-gray-500 font-normal">Get precedents</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 transition-all duration-700 ease-in-out">
        <div className="p-4 sm:p-6">
          <div className="w-full max-w-full space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8 px-4">
                <p className="mb-2">Ask me anything about {caseData ? 'this case' : 'your document'} or request document edits.</p>
                <p className="text-xs text-gray-400">Use the quick actions above or type your question below.</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div 
                key={message.id} 
                className="flex flex-col space-y-2 animate-in slide-in-from-bottom-4 fade-in duration-500" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {message.role === 'user' ? (
                  // User messages - Right side with black box
                  <div className="flex justify-end">
                    <div className="bg-black text-white rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[85%] transition-all duration-300 ease-in-out hover:shadow-lg shadow-md">
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  // AI messages - Left side, no box, just text
                  <div className="flex justify-start">
                    <div className="max-w-[85%] transition-all duration-300 ease-in-out">
                      <p className="text-gray-900 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">{message.content}</p>
                      
                      {/* Action buttons for assistant messages with insertable text */}
                      {message.insertableText && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInsertText(message.insertableText!)}
                            className="text-xs"
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Insert at cursor
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyText(message.insertableText!)}
                            className="text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex justify-start animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="max-w-[85%]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">AI is thinking...</p>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Fixed Input Bar - At bottom of flex container */}
      <div className="flex-shrink-0 bg-gray-50 p-3 sm:p-4 border-t border-gray-200 shadow-sm">
        <div className="w-full px-2">
          {/* Staged Files Display */}
          {stagedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {stagedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => setStagedFiles(prev => prev.filter((_, i) => i !== index))}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-white border border-gray-300 rounded-2xl shadow-sm transition-all duration-700 ease-in-out hover:shadow-md hover:border-gray-400 focus-within:shadow-md focus-within:border-gray-400">
            <div className="flex items-center gap-2 p-2">
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-shrink-0 p-1.5 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                title="Add file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* Tools Button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setIsToolPopoverOpen(!isToolPopoverOpen)}
                  disabled={isProcessing}
                  className="p-1.5 rounded-full transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  title="Tools"
                >
                  <Icon name="sparkles" className="w-4 h-4" />
                </button>
                
                <EditorToolSelectionPopover
                  isOpen={isToolPopoverOpen}
                  onClose={() => setIsToolPopoverOpen(false)}
                  onSelectTool={handleSelectTool}
                />
              </div>

              {/* Input Field */}
              <Input
                placeholder={`Ask about ${caseData ? 'this case' : 'your document'} or request edits...`}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
                disabled={isProcessing}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm min-w-0"
              />

              {/* Send Button */}
              <Button
                onClick={handleChatSend}
                disabled={isProcessing || (!chatMessage.trim() && stagedFiles.length === 0)}
                variant="ghost"
                size="sm"
                className="rounded-lg flex-shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
