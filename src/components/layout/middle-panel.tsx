"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useAppContext } from '@/context/app-context';
import { useChats } from '@/context/chats-context';
import { useCases } from '@/context/cases-context';
import { useFirebaseUser } from '@/hooks/use-firebase-user';
import AdvancedChatInputBar from '@/components/chat/advanced-chat-input-bar';
import ActionConfirmationModal from '@/components/modals/action-confirmation-modal';
import LinkUnlinkModal from '@/components/modals/link-unlink-modal';
import NewCaseModal from '@/components/modals/new-case-modal';
import useSubmissionWorkflow from '@/hooks/use-submission-workflow';
import CaseDetailView from '@/components/cases/case-detail-view';
import LibraryView from '@/components/library/library-view';
import ChatLoadingAnimation from '@/components/ui/chat-loading-animation';
import CaseBox from '@/components/chat/case-box';
import { apiClient } from '@/lib/api-client';
// Title generation will be handled server-side

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  files?: string[]; // Array of file IDs
  caseData?: {
    caseId?: string;
    caseName?: string;
    tags?: string[];
    details?: any;
    createdAt?: string | Date;
  };
  actionType?: 'createCase' | 'createDraft' | 'addEvent' | 'none';
}

interface MiddlePanelProps {
  chatId: string | null;
  setLoadingChatId?: (id: string | null) => void;
  onTaskProgressUpdate?: (completed: number, total: number) => void;
}

// Dynamic greeting phrases that highlight features (moved outside to prevent recreation)
const phrases = [
  "What cases are you working on today?",
  "Need help drafting a legal document?",
  "Looking for case research assistance?",
  "Ready to manage your legal workflow?",
  "How can AI amplify your legal practice?"
];

export default function MiddlePanel({ chatId, setLoadingChatId, onTaskProgressUpdate }: MiddlePanelProps) {
  const { selectedCaseId, setSelectedCaseId, setActiveView, setSourceChatId, setSelectedChatId, setSelectedDraftId, activeView, chatFiles, addFileToChat } = useAppContext();
  const { chats, updateChat, createChat } = useChats();
  const { refetch: refetchCases } = useCases();
  const { cases } = useCases();
  const { user } = useFirebaseUser();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<'createCase' | 'createDraft' | 'addEvent' | null>(null);
  const [pendingActionData, setPendingActionData] = useState<any>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [previousChatId, setPreviousChatId] = useState<string | null>(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [prefilledCaseData, setPrefilledCaseData] = useState<any>(null);
  
  // Store temp file mappings per message (maps message ID to temp file ID map)
  const tempFileMappingsRef = useRef<Map<string, Map<string, string>>>(new Map());
  
  // Store the message ID of the AI message that suggested case creation
  // This allows us to update that message with the caseId after user creates the case
  const pendingCaseMessageIdRef = useRef<string | null>(null);
  
  // Get files for current chat
  const currentChatFiles = chatId ? (chatFiles[chatId] || []) : [];
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isPhraseTyping, setIsPhraseTyping] = useState(true);
  const phraseAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phrasePauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { executeSubmission, isProcessing, currentStep } = useSubmissionWorkflow();

  const currentChat = chatId ? chats.find(chat => chat.id === chatId) : null;
  const currentCase = currentChat?.linkedCaseId ? 
    // Find the case by linkedCaseId, not by chat id
    cases?.find(case_ => case_.id === currentChat.linkedCaseId) : null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Combined typing effect with phrase rotation (skip when in case detail view or library view)
  useEffect(() => {
    // Skip animation when not in chat view - important check before anything else
    if (activeView === 'caseDetailView' || activeView === 'libraryView') {
      // Clean up any running animations
      if (phraseAnimationRef.current) {
        clearInterval(phraseAnimationRef.current);
        phraseAnimationRef.current = null;
      }
      if (phrasePauseRef.current) {
        clearTimeout(phrasePauseRef.current);
        phrasePauseRef.current = null;
      }
      return;
    }
    
    // Clear any existing animation
    if (phraseAnimationRef.current) {
      clearInterval(phraseAnimationRef.current);
    }
    if (phrasePauseRef.current) {
      clearTimeout(phrasePauseRef.current);
    }
    
    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) return;
    
    setDisplayText('');
    setIsPhraseTyping(true);
    
    let currentIndex = 0;
    
    // Typing animation
    const typingInterval = setInterval(() => {
      if (currentIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.substring(0, currentIndex));
        currentIndex++;
      } else {
        setIsPhraseTyping(false);
        clearInterval(typingInterval);
        
        // After typing completes, wait 3 seconds then move to next phrase
        const pauseTimer = setTimeout(() => {
          setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        }, 3000);
        
        phrasePauseRef.current = pauseTimer;
      }
    }, 50); // Typing speed: 50ms per character
    
    phraseAnimationRef.current = typingInterval;
    
    return () => {
      if (phraseAnimationRef.current) {
        clearInterval(phraseAnimationRef.current);
      }
      if (phrasePauseRef.current) {
        clearTimeout(phrasePauseRef.current);
      }
      phraseAnimationRef.current = null;
      phrasePauseRef.current = null;
    };
  }, [currentPhraseIndex, activeView]);

  // Track loaded chat IDs to prevent duplicate loads
  const loadedChatIdsRef = useRef<Set<string>>(new Set());
  
  // Load files for chat (must load before messages)
  useEffect(() => {
    const loadChatFiles = async () => {
      if (!chatId || !user) return;
      
      // Skip if we've already loaded files for this chat
      if (loadedChatIdsRef.current.has(chatId)) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/chats/${chatId}/files`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const files = await response.json();
          // Add files to context
          files.forEach((file: any) => {
            addFileToChat(chatId, {
              id: file.id,
              name: file.name,
              type: file.type,
              size: file.size,
              url: file.url,
              uploadedAt: file.uploadedAt?.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt || Date.now())
            });
          });
          
          // Mark this chat as loaded
          loadedChatIdsRef.current.add(chatId);
        }
      } catch (error) {
        console.error('Error loading chat files:', error);
      }
    };

    if (chatId && user) {
      loadChatFiles();
    }
    
    // Clear loaded chats when chatId changes significantly
    return () => {
      // Keep previous chat in memory, only clear if switching to a completely different chat
    };
  }, [chatId, user]); // Removed addFileToChat from dependencies

  // Fetch chat history when chatId changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!chatId || !user) {
        setMessages([]); // Clear messages when no chat selected
        return;
      }

      // Track previous chat ID for reference
      if (previousChatId !== chatId) {
        setPreviousChatId(chatId);
      }
      
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Map API messages to our Message interface
          // Handle both 'attachments' and 'files' fields for backward compatibility
          const mappedMessages = (data.messages || []).map((msg: any) => {
            // Normalize attachments - convert file objects to IDs if needed
            let fileIds: string[] = [];
            const attachments = msg.attachments || msg.files || [];
            
            attachments.forEach((att: any) => {
              // If attachment is an object with id, use the id
              if (typeof att === 'object' && att.id) {
                fileIds.push(att.id);
              } else if (typeof att === 'string') {
                // If it's already a string ID
                fileIds.push(att);
              }
            });
            
            // Parse case data from message metadata or content
            let caseData = null;
            let actionType: 'createCase' | 'createDraft' | 'addEvent' | 'none' | undefined = undefined;
            
            // Check if message has caseData in metadata or parsed from content
            if (msg.caseData) {
              caseData = msg.caseData;
              actionType = 'createCase';
            } else if (msg.actionType) {
              actionType = msg.actionType;
              if (msg.actionType === 'createCase' && msg.actionData?.caseData) {
                caseData = msg.actionData.caseData;
              }
            }
            
            const mappedMsg: Message = {
              id: msg.id,
              type: msg.role === 'user' ? 'user' : 'ai', // Map role to type
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              files: fileIds, // Store as array of file IDs
              caseData: caseData || undefined,
              actionType: actionType
            };
            console.log('Mapped message:', { original: msg, mapped: mappedMsg, fileIds, caseData });
            return mappedMsg;
          });
          setMessages(mappedMessages);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
        setMessages([]); // Clear messages on error
      }
    };

    fetchChatHistory();
  }, [chatId, user, previousChatId]);

  const handleSendMessage = async (message: string, files: any[], action: any) => {
    // Extract staged file IDs/names to show immediately
    // These will be replaced with real IDs after upload
    const stagedFileIds = files.map((file: any) => {
      // Use staged file ID or generate temporary ID for immediate display
      return file.id || file.file?.id || `temp-${Date.now()}-${Math.random()}`;
    });
    
    // Add user message immediately with staged file IDs for instant display
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      files: stagedFileIds // Show files immediately with staged IDs
    };

    // Add files to context immediately for display (before upload)
    if (files.length > 0 && chatId) {
      files.forEach((stagedFile: any) => {
        const tempId = stagedFile.id || stagedFile.file?.id || `temp-${Date.now()}-${Math.random()}`;
        const fileObj = stagedFile.file || stagedFile;
        addFileToChat(chatId, {
          id: tempId,
          name: stagedFile.name || fileObj.name,
          type: stagedFile.type || fileObj.type,
          size: stagedFile.size || fileObj.size,
          url: '', // No URL yet, will be updated after upload
          uploadedAt: new Date()
        });
      });
    }

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      let currentChatId = chatId;
      
      // If no chat exists, create a new one immediately
      if (!currentChatId) {
        // Create a new chat with a loading title that will be updated
        const newChat = await createChat({
          title: 'Loading...',
          linkedCaseId: undefined
        });
        currentChatId = newChat.id;
        setSelectedChatId(currentChatId);
        
        // Set loading state for this chat
        if (setLoadingChatId) {
          setLoadingChatId(newChat.id);
        }
      }

      // Create a placeholder AI message for streaming
      const streamingMessageId = `stream_${Date.now()}`;
      const streamingMessage: Message = {
        id: streamingMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, streamingMessage]);

      // Execute submission and get AI response (with streaming support)
      await executeSubmission({
        message,
        files,
        action,
        chatId: currentChatId!,
        userId: user?.uid || '',
        chatFiles: currentChatFiles, // Pass existing chat files for context
        onStreamChunk: (chunk: string) => {
          // Update streaming message content progressively
          setMessages(prev => prev.map(msg => {
            if (msg.id === streamingMessageId) {
              return {
                ...msg,
                content: msg.content + chunk
              };
            }
            return msg;
          }));
        },
        onSuccess: async (response: any) => {
          // Files are already uploaded and saved in the workflow
          // Use the exact file IDs from the workflow response (not fetched from server)
          const uploadedFileIds = response.context?.uploadedFileIds || [];
          
          if (uploadedFileIds.length > 0 && currentChatId) {
            // Fetch file metadata ONLY for the specific files we just uploaded
            try {
              const token = await user?.getIdToken();
              const filesResponse = await fetch(`/api/chats/${currentChatId}/files`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (filesResponse.ok) {
                const allChatFiles = await filesResponse.json();
                
                // Get only the files that match the uploaded IDs (not all files)
                const newlyUploadedFiles = allChatFiles.filter((file: any) => 
                  uploadedFileIds.includes(file.id)
                );
                
                // Remove temp file entries and add real file entries
                const tempMappings = tempFileMappingsRef.current.get(userMessage.id);
                if (tempMappings) {
                  // Temp files will be replaced by real files below
                  tempFileMappingsRef.current.delete(userMessage.id);
                }
                
                // Add only these specific new files to context (not all chat files)
                newlyUploadedFiles.forEach((file: any) => {
                  // Always update/add to ensure we have the latest metadata
                  addFileToChat(currentChatId, {
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: file.url,
                    uploadedAt: file.uploadedAt?.toDate ? file.uploadedAt.toDate() : new Date(file.uploadedAt || Date.now())
                  });
                });
                
                console.log('Updated message with uploaded file IDs:', uploadedFileIds, 'files:', newlyUploadedFiles.map((f: any) => f.name));
              }
            } catch (error) {
              console.error('Error fetching file metadata:', error);
            }
          }
          
          // Update ONLY the user message with real file IDs after upload
          if (uploadedFileIds.length > 0) {
            // Update ONLY this specific user message (don't touch any other messages)
            setMessages(prev => prev.map(msg => {
              if (msg.id === userMessage.id && msg.type === 'user') {
                return { ...msg, files: uploadedFileIds };
              }
              return msg; // Keep all other messages exactly as they are
            }));
          }
          
        // Process AI response - UPDATE the existing streaming message instead of adding a new one
        console.log('[Middle Panel] Processing AI response:', {
          hasResponse: !!response.response,
          hasCaseData: !!response.caseData,
          actionType: response.actionType,
          caseData: response.caseData,
          caseId: response.caseData?.caseId,
          caseName: response.caseData?.caseName
        });
          
          // Update the existing streaming message with final metadata (content is already there from streaming)
          setMessages(prev => prev.map(msg => {
            if (msg.id === streamingMessageId) {
              const updatedMessage: Message = {
                ...msg,
                id: response.id || streamingMessageId, // Use final ID if provided
                // DON'T overwrite content - it's already been streamed character by character
                // content: response.content || response.response || msg.content,
                timestamp: response.timestamp || msg.timestamp,
                caseData: response.caseData || response.context?.caseData,
                actionType: response.actionType || response.context?.actionType
              };
              
              // Handle case creation logic
              if (updatedMessage.caseData && updatedMessage.actionType === 'createCase') {
                console.log('[Middle Panel] Case creation detected, caseId:', updatedMessage.caseData.caseId);
                // If caseId exists, case was created - refresh cases list
                if (updatedMessage.caseData.caseId) {
                  refetchCases();
                } else {
                  // No caseId - open modal for user to create
                  setPrefilledCaseData({
                    caseName: updatedMessage.caseData.caseName,
                    tags: updatedMessage.caseData.tags,
                    details: updatedMessage.caseData.details
                  });
                  setIsNewCaseModalOpen(true);
                  pendingCaseMessageIdRef.current = updatedMessage.id;
                }
              }
              
              return updatedMessage;
            }
            return msg;
          }));
          
          setIsTyping(false);
          
          // Generate title based on the full conversation after AI response (only for new chats)
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
                
                // Clear loading state
                if (setLoadingChatId) {
                  setLoadingChatId(null);
                }
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
        id: `case_${Date.now()}`,
        caseName: caseData.caseName || 'New Case',
        parties: caseData.parties || '',
        court: caseData.court || '',
        legalSections: caseData.legalSections || '',
        description: caseData.description || '',
        extractedMetadata: caseData.extractedMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a linked chat for the case
      const newChat = {
        id: `chat_${Date.now()}`,
        title: `Chat for ${newCase.caseName}`,
        linkedCaseId: newCase.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Case created:', newCase);
      console.log('Chat created:', newChat);
      
      // Navigate to the new chat
      setSelectedChatId(newChat.id);
      setSourceChatId(chatId || null);
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Case "${newCase.caseName}" has been created successfully. I've also created a new chat linked to this case where we can discuss the details further.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  const handleCreateDraft = async (draftData: any) => {
    try {
      // Create the draft in Firestore
      const newDraft = {
        id: `draft_${Date.now()}`,
        draftTitle: draftData.title || 'New Legal Draft',
        relatedCase: draftData.caseName || '',
        description: draftData.description || '',
        extractedMetadata: draftData.extractedMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Draft created:', newDraft);
      
      // Navigate to the draft editor
      setSelectedDraftId(newDraft.id);
      setActiveView('draftEditorView');
      setSourceChatId(chatId || null);
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Draft "${newDraft.draftTitle}" has been created successfully. I'm opening the draft editor where you can work on the document.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      
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

      console.log('Event created:', newEvent);
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Event "${eventData.eventTitle}" has been created successfully. The extracted information from your documents has been used to populate the event details.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      
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

  const handleViewCase = () => {
    if (currentChat?.linkedCaseId) {
      setSourceChatId(chatId); // Store the current chat as source
      setSelectedCaseId(currentChat.linkedCaseId);
      setActiveView('caseDetailView');
    }
  };

  // If a case is selected, show the case detail view
  if (selectedCaseId && activeView === 'caseDetailView') {
    return (
      <div className="flex-1 bg-gray-50 transition-all duration-700 ease-in-out overflow-hidden" style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
        <CaseDetailView onTaskProgressUpdate={onTaskProgressUpdate} />
      </div>
    );
  }

  // If library view is active, show the library
  if (activeView === 'libraryView') {
    return (
      <div className="flex-1 bg-gray-50 transition-all duration-700 ease-in-out overflow-hidden" style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
        <LibraryView />
      </div>
    );
  }


  // Fresh chat state - no messages yet
  if (messages.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col transition-all duration-700 ease-in-out overflow-hidden" style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
        {/* Header - Show chat name or case name */}
        {currentChat && (
          <div className="bg-white border-b border-gray-200 p-4 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                {currentChat.linkedCaseId ? (
                  // Show case name when linked to a case
                  <>
                    <h2 className="text-lg font-medium text-gray-900">
                      {currentCase?.caseName || 'Case Chat'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {currentChat.title || 'Untitled Chat'}
                    </p>
                  </>
                ) : (
                  // Show chat name when not linked to a case
                  <h2 className="text-lg font-medium text-gray-900">
                    {currentChat.title || 'Untitled Chat'}
                  </h2>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {currentChat.linkedCaseId ? (
                  <Button
                    onClick={handleViewCase}
                    variant="outline"
                    size="sm"
                    className="font-medium"
                  >
                    View Case
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsLinkModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="font-medium"
                  >
                    Link to Case
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fresh Chat Interface - Centered like ChatGPT */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-4xl w-full">
            <h1 className="text-4xl font-medium text-gray-900 mb-12 inline-flex items-center justify-center">
              <span>{displayText}</span>
              {isPhraseTyping && (
                <span 
                  className="inline-block w-0.5 h-12 bg-primary ml-2"
                  style={{
                    animation: 'blink 1s infinite'
                  }}
                />
              )}
            </h1>
            
            {/* Input Bar - ChatGPT style */}
            <div className="w-full max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-1000" style={{ animationDelay: '300ms' }}>
              <div className="bg-white border border-gray-300 rounded-2xl shadow-sm transition-all duration-500 ease-in-out hover:shadow-md hover:border-gray-400 focus-within:shadow-md focus-within:border-gray-400">
                <AdvancedChatInputBar
                  onSendMessage={handleSendMessage}
                  disabled={isTyping || isProcessing}
                  isCentered={true}
                />
              </div>
            </div>
          </div>
        </div>

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

        {/* Link/Unlink Modal */}
        <LinkUnlinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          onConfirm={(caseId) => {
            if (currentChat?.id) {
              updateChat(currentChat.id, { linkedCaseId: caseId });
            }
            setIsLinkModalOpen(false);
          }}
          currentLinkedCaseId={currentChat?.linkedCaseId || null}
          cases={cases || []}
          chatTitle={currentChat?.title || 'Untitled Chat'}
        />
      </div>
    );
  }

  // Chat with messages
  return (
    <div className="flex-1 bg-gray-50 flex flex-col relative transition-all duration-700 ease-in-out overflow-hidden" style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
      {/* Header - Show chat name or case name */}
      {currentChat && (
        <div className="bg-white border-b border-gray-200 p-4 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="flex items-center justify-between">
            <div>
              {currentChat.linkedCaseId ? (
                // Show case name when linked to a case
                <>
                  <h2 className="text-lg font-medium text-gray-900">
                    {currentCase?.caseName || 'Case Chat'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {currentChat.title || 'Untitled Chat'}
                  </p>
                </>
              ) : (
                // Show chat name when not linked to a case
                <h2 className="text-lg font-medium text-gray-900">
                  {currentChat.title || 'Untitled Chat'}
                </h2>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {currentChat.linkedCaseId ? (
                <Button
                  onClick={handleViewCase}
                  variant="outline"
                  size="sm"
                  className="font-medium"
                >
                  View Case
                </Button>
              ) : (
                <Button
                  onClick={() => setIsLinkModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="font-medium"
                >
                  Link to Case
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - Smooth transition from center to top */}
      <div className="flex-1 overflow-y-auto p-8 transition-all duration-700 ease-in-out animate-in slide-in-from-bottom-8 fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div key={message.id} className="flex flex-col space-y-2 animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              {message.type === 'user' ? (
                // User messages - Right side with curved black box
                <div className="flex justify-end">
                  <div className="bg-black text-white rounded-2xl rounded-tr-md px-6 py-3 max-w-3xl transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] shadow-md">
                    <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                    {message.files && message.files.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-gray-700 pt-3">
                        {message.files.map((fileId: string, index: number) => {
                          // Find file in currentChatFiles by ID
                          const file = currentChatFiles.find(f => f.id === fileId);
                          if (!file) return null;
                          
                          // Use message.id + fileId + index to ensure unique keys
                          const uniqueKey = `${message.id}-${fileId}-${index}`;
                          
                          // File may not have URL immediately (before upload completes)
                          const isClickable = file.url && file.url.length > 0;
                          
                          return (
                            <div 
                              key={uniqueKey} 
                              className={`flex items-center space-x-2 text-xs bg-gray-800 rounded-lg px-3 py-2 transition-colors ${
                                isClickable 
                                  ? 'cursor-pointer hover:bg-gray-700' 
                                  : 'cursor-default opacity-75'
                              }`}
                              onClick={() => {
                                if (isClickable) {
                                  window.open(file.url, '_blank');
                                }
                              }}
                              title={isClickable ? "Click to open file" : "File uploading..."}
                            >
                              <Icon name="file" className="w-3 h-3" />
                              <span className="truncate">{file.name}</span>
                              {!isClickable && (
                                <svg className="w-3 h-3 animate-spin ml-1" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // AI messages - Left side, no box, just text
                <div className="flex justify-start">
                  <div className="max-w-4xl transition-all duration-300 ease-in-out">
                    <p className="text-gray-900 text-sm leading-relaxed font-medium whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Render Case Box if case data is present in message */}
                    {message.caseData && message.caseData.caseName && (
                      <div className="mt-3">
                        <CaseBox
                          caseId={message.caseData.caseId}
                          caseName={message.caseData.caseName || 'Untitled Case'}
                          createdAt={message.caseData.createdAt}
                          onViewCase={message.caseData.caseId ? () => {
                            console.log('[CaseBox] View Case clicked, caseId:', message.caseData!.caseId);
                            setSelectedCaseId(message.caseData!.caseId!);
                            setActiveView('caseDetailView');
                          } : undefined}
                          onStartChat={message.caseData.caseId ? async () => {
                            console.log('[CaseBox] Start Chat clicked, caseId:', message.caseData!.caseId);
                            try {
                              // Create a new chat linked to this case
                              const newChat = await createChat({
                                title: `Chat - ${message.caseData!.caseName}`,
                                linkedCaseId: message.caseData!.caseId!
                              });
                              setSelectedChatId(newChat.id);
                              setActiveView('chatView');
                            } catch (error) {
                              console.error('Error creating linked chat:', error);
                            }
                          } : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="max-w-4xl">
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

      {/* Floating Input Bar - Smooth transition from center to bottom */}
      <div className="sticky bottom-0 bg-gray-50 p-4 transition-all duration-1000 ease-in-out animate-in slide-in-from-bottom-12 fade-in" style={{ animationDelay: '300ms' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-300 rounded-2xl shadow-sm transition-all duration-700 ease-in-out hover:shadow-md hover:border-gray-400 focus-within:shadow-md focus-within:border-gray-400">
            <AdvancedChatInputBar
              onSendMessage={handleSendMessage}
              disabled={isTyping || isProcessing}
            />
          </div>
        </div>
      </div>

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

      {/* New Case Modal with Pre-filled Data */}
      <NewCaseModal
        isOpen={isNewCaseModalOpen}
        onClose={() => {
          setIsNewCaseModalOpen(false);
          setPrefilledCaseData(null);
          pendingCaseMessageIdRef.current = null;
        }}
        prefilledData={prefilledCaseData}
        onCaseCreated={(createdCase) => {
          console.log('[Middle Panel] Case created callback received:', createdCase);
          // Update the AI message with the created case ID so CaseBox appears
          const messageId = pendingCaseMessageIdRef.current;
          if (messageId) {
            console.log('[Middle Panel] Updating message with caseId:', messageId, createdCase.id);
            setMessages(prev => prev.map(msg => {
              if (msg.id === messageId && msg.type === 'ai' && msg.caseData) {
                const updatedMsg = {
                  ...msg,
                  caseData: {
                    ...msg.caseData,
                    caseId: createdCase.id,
                    createdAt: createdCase.createdAt?.toISOString ? createdCase.createdAt.toISOString() : (typeof createdCase.createdAt === 'string' ? createdCase.createdAt : new Date().toISOString())
                  }
                };
                console.log('[Middle Panel] Message updated:', updatedMsg);
                return updatedMsg;
              }
              return msg;
            }));
            pendingCaseMessageIdRef.current = null;
          } else {
            console.log('[Middle Panel] No pending message ID found');
          }
          // Refresh cases list
          refetchCases();
        }}
      />

      {/* Link/Unlink Modal */}
      <LinkUnlinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onConfirm={async (caseId) => {
          if (currentChat?.id) {
            const previousCaseId = currentChat.linkedCaseId;
            await updateChat(currentChat.id, { linkedCaseId: caseId });
            
            // Send AI notification message
            try {
              const selectedCase = caseId ? cases.find(c => c.id === caseId) : null;
              const previousCase = previousCaseId ? cases.find(c => c.id === previousCaseId) : null;
              
              let notificationMessage = '';
              if (caseId && !previousCaseId) {
                // Chat was linked to a case
                notificationMessage = `✅ This chat is now linked to the case "${selectedCase?.caseName || 'Unknown Case'}". I'll now base my responses on the documents and context specific to this case.`;
              } else if (!caseId && previousCaseId) {
                // Chat was unlinked from a case
                notificationMessage = `ℹ️ This chat has been unlinked from the case "${previousCase?.caseName || 'Unknown Case'}". I'll now respond as a general legal assistant without case-specific context.`;
              } else if (caseId && previousCaseId && caseId !== previousCaseId) {
                // Chat was linked to a different case
                notificationMessage = `🔄 This chat has been linked from "${previousCase?.caseName || 'Unknown Case'}" to "${selectedCase?.caseName || 'Unknown Case'}". I'll now base my responses on the new case context.`;
              }
              
              if (notificationMessage) {
                await apiClient.post(`/api/chats/${currentChat.id}/messages`, {
                  role: 'assistant',
                  content: notificationMessage
                });
                // Refresh messages to show the notification
                const historyResponse = await apiClient.get(`/api/chats/${currentChat.id}/messages`);
                if (historyResponse?.messages) {
                  setMessages(historyResponse.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                    timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now())
                  })));
                }
              }
            } catch (error) {
              console.error('Error sending link/unlink notification:', error);
            }
          }
          setIsLinkModalOpen(false);
        }}
        currentLinkedCaseId={currentChat?.linkedCaseId || null}
        cases={cases || []}
        chatTitle={currentChat?.title || 'Untitled Chat'}
      />
    </div>
  );
}
