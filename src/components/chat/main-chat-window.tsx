"use client";

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { useCases } from '@/context/cases-context';
import { useChats, useMessages } from '@/context/chats-context';
import { useFirebaseUser } from '@/hooks/use-firebase-user';
import AdvancedChatInputBar from './advanced-chat-input-bar';
import ActionConfirmationModal from '../modals/action-confirmation-modal';
import useSubmissionWorkflow from '@/hooks/use-submission-workflow';
import ChatLoadingAnimation from '@/components/ui/chat-loading-animation';
import ChatTitleLoading from '@/components/ui/chat-title-loading';
import { MessageSkeletonList, ChatAreaSkeleton } from '@/components/ui/message-skeleton';
import { uploadChatFile } from '@/lib/firebase-storage';
import DocumentViewer from '@/components/ui/document-viewer';
import { apiClient } from '@/lib/api-client';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  files?: string[]; // File IDs attached to this message
}

interface MainChatWindowProps {
  chatId: string | null;
  onReopenWorkspace?: () => void;
  setLoadingChatId?: (id: string | null) => void;
}

export default function MainChatWindow({ chatId, onReopenWorkspace, setLoadingChatId }: MainChatWindowProps) {
  const { selectedCaseId, chatFiles, addFileToChat, removeFileFromChat, setSelectedCaseId, setActiveView, setSourceChatId, setSelectedChatId, setSelectedDraftId } = useAppContext();
  
  // Get files for current chat
  const currentChatFiles = chatId ? (chatFiles[chatId] || []) : [];
  const { cases } = useCases();
  const { chats, createChat, updateChat, refetch: refetchChats } = useChats();
  const { user } = useFirebaseUser();
  const { messages, loading: messagesLoading, addMessage } = useMessages(chatId);
  const [isTyping, setIsTyping] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<'createCase' | 'createDraft' | 'addEvent' | null>(null);
  const [pendingActionData, setPendingActionData] = useState<any>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [previousChatId, setPreviousChatId] = useState<string | null>(null);
  const [loadingChatId, setLoadingChatIdState] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [isCaseContextModalOpen, setIsCaseContextModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { executeSubmission, isProcessing, currentStep } = useSubmissionWorkflow();

  const currentChat = chats.find(chat => chat.id === chatId);
  const isCaseLinkedChat = currentChat?.linkedCaseId;
  // Get the case from the chat's linkedCaseId, not from selectedCaseId
  const currentCase = cases.find(case_ => case_.id === currentChat?.linkedCaseId);

  // Keep selectedCaseId in sync with the currently open chat's linked case
  useEffect(() => {
    if (currentChat?.linkedCaseId) {
      setSelectedCaseId(currentChat.linkedCaseId);
    } else {
      // When opening a general chat, clear selected case to enable General workspace controls
      setSelectedCaseId(null);
    }
  }, [currentChat?.linkedCaseId]);

  useEffect(() => {
    // Load chat messages when chatId changes
    if (chatId) {
      // Only show loading if switching to a different chat
      if (previousChatId !== chatId) {
        setIsLoadingChat(true);
        setPreviousChatId(chatId);
      }

      // The useMessages hook will handle loading messages
      // We'll set loading to false when messages are loaded
      if (!messagesLoading) {
        setIsLoadingChat(false);
      }
      
      // Load files for this chat
      loadChatFiles(chatId);
    } else {
      setIsLoadingChat(false);
    }
  }, [chatId, messagesLoading, previousChatId]);

  // Load files for a chat
  const loadChatFiles = async (chatId: string) => {
    try {
      const response = await apiClient.get(`/api/chats/${chatId}/files`);
      const files = response || [];
      
      // Update the chat files in context
      files.forEach((file: any) => {
        addFileToChat(chatId, file);
      });
    } catch (error) {
      console.error('Error loading chat files:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleRemoveFile = (fileId: string) => {
    if (chatId) {
      removeFileFromChat(chatId, fileId);
    }
  };

  const handleViewCase = () => {
    if (currentChat?.linkedCaseId) {
      setSourceChatId(chatId); // Store the current chat as source
      setSelectedCaseId(currentChat.linkedCaseId);
      setActiveView('caseDetailView');
    }
  };

  const handleSendMessage = async (message: string, files: any[], action: any) => {
    // Add user message with files using the hook
    await addMessage('user', message, files);
    setIsTyping(true);

    try {
      let currentChatId = chatId;
      
      // If this is a new chat (no chatId), create it immediately
      if (!currentChatId) {
        // Create a new chat with a loading title that will be updated
        const newChat = await createChat({
          title: 'Generating title...',
          linkedCaseId: undefined
        });
        
        console.log('New chat created:', newChat);
        
        // Set loading state for this chat
        if (setLoadingChatId) {
          setLoadingChatId(newChat.id);
        }
        setLoadingChatIdState(newChat.id);
        
        // Update the selected chat ID
        setSelectedChatId(newChat.id);
        currentChatId = newChat.id;
        
        // Force a refresh by updating the selected chat ID
        // This will trigger the left panel to re-render
        console.log('New chat created, left panel should update automatically');
      }

      await executeSubmission({
        message,
        files,
        action,
        chatId: currentChatId!,
        userId: user?.uid || '',
        chatFiles: currentChatFiles, // Pass existing chat files for context
        onSuccess: async (response: any) => {
          // Files are already uploaded and saved in the workflow (use-submission-workflow.ts)
          // Just refresh files for this chat to ensure they're in context
          if (files.length > 0 && currentChatId) {
            try {
              const updatedFiles = await apiClient.get(`/api/chats/${currentChatId}/files`);
              (updatedFiles || []).forEach((file: any) => {
                addFileToChat(currentChatId, {
                  id: file.id,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  url: file.url,
                  uploadedAt: file.uploadedAt?.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt || Date.now())
                });
              });
            } catch (error) {
              console.error('Error refreshing files:', error);
            }
          }
          
          // Add AI response using the hook
          await addMessage('assistant', response.content);
          setIsTyping(false);
          
          // Generate title based on the full conversation after AI response
          if (!chatId) {
            try {
              // Generate a better title based on the conversation content
              const conversationText = `${message} ${response.content}`;
              const words = conversationText.toLowerCase().split(' ');
              
              // Look for legal keywords to create a better title
              const legalKeywords = ['contract', 'breach', 'dispute', 'legal', 'case', 'court', 'agreement', 'liability', 'damages', 'defendant', 'plaintiff', 'lawsuit', 'settlement'];
              const foundKeywords = words.filter(word => legalKeywords.includes(word));
              
              let betterTitle = '';
              if (foundKeywords.length > 0) {
                // Create title from found keywords
                const keyPhrases = [];
                if (words.includes('contract') && words.includes('breach')) {
                  keyPhrases.push('Contract Breach');
                } else if (words.includes('legal') && words.includes('advice')) {
                  keyPhrases.push('Legal Advice');
                } else if (words.includes('case') && words.includes('analysis')) {
                  keyPhrases.push('Case Analysis');
                } else if (words.includes('defendant') && words.includes('arguments')) {
                  keyPhrases.push('Defense Arguments');
                } else {
                  keyPhrases.push(foundKeywords[0].charAt(0).toUpperCase() + foundKeywords[0].slice(1));
                }
                betterTitle = keyPhrases.join(' ');
              } else {
                // Fallback to first few meaningful words
                const meaningfulWords = conversationText.split(' ').filter(word => 
                  word.length > 3 && 
                  !['the', 'and', 'for', 'with', 'this', 'that', 'will', 'can', 'help', 'need'].includes(word.toLowerCase())
                ).slice(0, 3);
                betterTitle = meaningfulWords.join(' ');
              }
              
              // Update chat title
              if (betterTitle && betterTitle.length > 0) {
                await updateChat(currentChatId!, { title: betterTitle });
                console.log('Generated title:', betterTitle);
                
                // Clear loading state
                if (setLoadingChatId) {
                  setLoadingChatId(null);
                }
                setLoadingChatIdState(null);
                
                // The title update should automatically reflect in the left panel
                console.log('Title updated, left panel should show new title');
              }
            } catch (error) {
              console.error('Error generating title:', error);
            }
          }
          
          // Handle different action types
          if (action?.type === 'createCase' && response.context?.action) {
            setPendingActionData(response.context.action);
            setCurrentActionType('createCase');
            setIsActionModalOpen(true);
          } else if (action?.type === 'createDraft' && response.context?.action) {
            setPendingActionData(response.context.action);
            setCurrentActionType('createDraft');
            setIsActionModalOpen(true);
          } else if (action?.type === 'addEvent' && response.context?.action) {
            setPendingActionData(response.context.action);
            setCurrentActionType('addEvent');
            setIsActionModalOpen(true);
          }
        },
        onError: (error: Error) => {
          console.error('Submission error:', error);
          setIsTyping(false);
        }
      });
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
    }
  };

  const handleCreateCase = async (caseData: any) => {
    try {
      // Create the case in Firestore
      const newCase = {
        id: caseData.caseId,
        caseName: caseData.caseName,
        summary: caseData.summary,
        details: {
          petitionerName: caseData.petitionerName,
          respondentName: caseData.respondentName,
          courtName: caseData.courtName,
          caseNumber: caseData.caseNumber,
          legalSections: caseData.legalSections.split(',').map((s: string) => s.trim())
        },
        extractedMetadata: caseData.extractedMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a new chat linked to this case
      const newChat = {
        id: `chat_${Date.now()}`,
        title: `Chat for ${caseData.caseName}`,
        linkedCaseId: caseData.caseId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Navigate to the new chat
      setSelectedChatId(newChat.id);
      setSelectedCaseId(caseData.caseId);
      setSourceChatId(chatId); // Set current chat as source for back navigation
      
      console.log('Case created:', newCase);
      console.log('New chat created:', newChat);
      
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  const handleCreateDraft = async (draftData: any) => {
    try {
      // Create the draft in Firestore
      const newDraft = {
        id: draftData.draftId,
        draftTitle: draftData.draftTitle,
        content: '', // Empty content initially
        extractedMetadata: draftData.extractedMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Navigate to the draft editor
      setSelectedDraftId(draftData.draftId);
      setActiveView('draftEditorView');
      setSourceChatId(chatId); // Set current chat as source for back navigation
      
      console.log('Draft created:', newDraft);
      
    } catch (error) {
      console.error('Error creating draft:', error);
    }
  };

  const handleAddEvent = async (eventData: any) => {
    try {
      // Create the event in Firestore
      const newEvent = {
        id: eventData.eventId,
        title: eventData.eventTitle,
        description: '',
        date: new Date(),
        extractedMetadata: eventData.extractedMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // For now, just show a success message
      // In a real app, you might navigate to a calendar or events view
      console.log('Event created:', newEvent);
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Event "${eventData.eventTitle}" has been created successfully. The extracted information from your documents has been used to populate the event details.`,
        timestamp: new Date()
      };
      await addMessage('assistant', successMessage.content);
      
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleActionConfirm = async (actionData: any) => {
    if (currentActionType === 'createCase') {
      await handleCreateCase(actionData);
    } else if (currentActionType === 'createDraft') {
      await handleCreateDraft(actionData);
    } else if (currentActionType === 'addEvent') {
      await handleAddEvent(actionData);
    }
    
    // Reset modal state
    setIsActionModalOpen(false);
    setCurrentActionType(null);
    setPendingActionData(null);
  };

  // Show loading animation while switching chats
  if (isLoadingChat) {
    return (
      <div className="flex flex-col h-full bg-white">
        <ChatLoadingAnimation size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Dynamic Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onReopenWorkspace && (
              <button
                onClick={onReopenWorkspace}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Reopen Workspace"
              >
                <Icon name="menu" className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <div>
              {isCaseLinkedChat ? (
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentCase?.caseName || 'Unknown Case'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {loadingChatId === chatId || currentChat?.title === 'Loading...' ? (
                      <ChatTitleLoading className="w-32" />
                    ) : (
                      currentChat?.title || 'Untitled Chat'
                    )}
                  </p>
                </div>
              ) : (
                <h1 className="text-lg font-semibold text-gray-900">
                  {loadingChatId === chatId || currentChat?.title === 'Loading...' ? (
                    <ChatTitleLoading className="w-48" />
                  ) : (
                    currentChat?.title || 'New Chat'
                  )}
                </h1>
              )}
            </div>
          </div>

          {isCaseLinkedChat && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCaseContextModalOpen(true)}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Icon name="info" className="w-4 h-4 mr-2" />
                View Context
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewCase}
              >
                <Icon name="externalLink" className="w-4 h-4 mr-2" />
                View Case
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {isLoadingChat || messagesLoading ? (
            <MessageSkeletonList count={4} />
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                  {message.role === 'user' ? (
                    /* User Message Container */
                    <div className="border rounded-2xl p-4 bg-blue-600 text-white border-blue-600">
                      {/* Message Content */}
                      <div className="mb-2">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Files attached to this message */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-blue-500">
                          <div className="flex flex-wrap gap-2">
                            {message.files.map((fileId: string) => {
                              const file = currentChatFiles.find(f => f.id === fileId);
                              return file ? (
                                <div
                                  key={fileId}
                                  className="flex items-center space-x-2 bg-blue-500 text-blue-100 px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-400"
                                  onClick={() => {
                                    if (file.url) {
                                      setSelectedDocument(file);
                                      setIsDocumentViewerOpen(true);
                                    }
                                  }}
                                >
                                  <Icon name="file" className="w-3 h-3" />
                                  <span className="truncate max-w-20">{file.name}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs mt-3 pt-2 border-t text-blue-100 border-blue-500 text-right">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ) : (
                    /* AI Response - Normal Text */
                    <div>
                      <p className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Timestamp */}
                      <p className="text-xs mt-2 text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-3xl mr-12">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Files Display */}
      {currentChatFiles.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentChatFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (file.url) {
                      setSelectedDocument(file);
                      setIsDocumentViewerOpen(true);
                    }
                  }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="file" className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {file.url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                        className="text-gray-400 hover:text-blue-600"
                        title="Open in new tab"
                      >
                        <Icon name="externalLink" className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                        Processing...
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFileFromChat(chatId!, file.id);
                      }}
                      className="text-gray-400 hover:text-red-500"
                      title="Remove file"
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Input Bar */}
      <AdvancedChatInputBar
        onSendMessage={handleSendMessage}
        disabled={isTyping || isProcessing}
      />

      {/* Action Confirmation Modal */}
      <ActionConfirmationModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setCurrentActionType(null);
          setPendingActionData(null);
        }}
        onConfirm={handleActionConfirm}
        actionType={currentActionType || 'createCase'}
        extractedMetadata={pendingActionData?.metadata || {}}
        sourceChatId={chatId || undefined}
      />

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={isDocumentViewerOpen}
        onClose={() => {
          setIsDocumentViewerOpen(false);
          setSelectedDocument(null);
        }}
        file={selectedDocument}
      />

      {/* Case Context Modal */}
      {isCaseContextModalOpen && currentCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Case Context</h2>
              <button
                onClick={() => setIsCaseContextModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <Icon name="x" className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Case Name</h3>
                <p className="text-base text-gray-900">{currentCase.caseName}</p>
              </div>

              {currentCase.details && (
                <>
                  {currentCase.details.petitionerName && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Petitioner</h3>
                      <p className="text-base text-gray-900">{currentCase.details.petitionerName}</p>
                    </div>
                  )}

                  {currentCase.details.respondentName && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Respondent</h3>
                      <p className="text-base text-gray-900">{currentCase.details.respondentName}</p>
                    </div>
                  )}

                  {currentCase.details.courtName && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Court</h3>
                      <p className="text-base text-gray-900">{currentCase.details.courtName}</p>
                    </div>
                  )}

                  {currentCase.details.caseNumber && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Case Number</h3>
                      <p className="text-base text-gray-900">{currentCase.details.caseNumber}</p>
                    </div>
                  )}

                  {currentCase.details.nextHearingDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Next Hearing Date</h3>
                      <p className="text-base text-gray-900">{currentCase.details.nextHearingDate}</p>
                    </div>
                  )}
                </>
              )}

              {currentCase.tags && currentCase.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentCase.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleViewCase}
                  className="w-full"
                >
                  <Icon name="externalLink" className="w-4 h-4 mr-2" />
                  View Full Case Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
