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
import useSubmissionWorkflow from '@/hooks/use-submission-workflow';
import CaseDetailView from '@/components/cases/case-detail-view';
import LibraryView from '@/components/library/library-view';
import ChatLoadingAnimation from '@/components/ui/chat-loading-animation';
// Title generation will be handled server-side

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

interface MiddlePanelProps {
  chatId: string | null;
  setLoadingChatId?: (id: string | null) => void;
  onTaskProgressUpdate?: (completed: number, total: number) => void;
}

export default function MiddlePanel({ chatId, setLoadingChatId, onTaskProgressUpdate }: MiddlePanelProps) {
  const { selectedCaseId, setSelectedCaseId, setActiveView, setSourceChatId, setSelectedChatId, setSelectedDraftId, activeView } = useAppContext();
  const { chats, updateChat, createChat, refetch: refetchChats } = useChats();
  const { cases } = useCases();
  const { user } = useFirebaseUser();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentActionType, setCurrentActionType] = useState<'createCase' | 'createDraft' | 'addEvent' | null>(null);
  const [pendingActionData, setPendingActionData] = useState<any>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [previousChatId, setPreviousChatId] = useState<string | null>(null);
  
  // Dynamic greeting phrases that highlight features
  const phrases = [
    "What cases are you working on today?",
    "Need help drafting a legal document?",
    "Looking for case research assistance?",
    "Ready to manage your legal workflow?",
    "How can AI amplify your legal practice?"
  ];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isPhraseTyping, setIsPhraseTyping] = useState(true);
  
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

  // Typing effect for phrases
  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) return;
    
    setDisplayText('');
    setIsPhraseTyping(true);
    
    let currentIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.substring(0, currentIndex));
        currentIndex++;
      } else {
        setIsPhraseTyping(false);
        clearInterval(typingInterval);
      }
    }, 50); // Typing speed: 50ms per character
    
    return () => clearInterval(typingInterval);
  }, [currentPhraseIndex]);

  // Rotate through phrases after typing completes
  useEffect(() => {
    if (!isPhraseTyping && displayText.length > 0) {
      const pauseTimer = setTimeout(() => {
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
      }, 3000); // Show completed text for 3 seconds before next
      
      return () => clearTimeout(pauseTimer);
    }
  }, [isPhraseTyping, displayText.length]);

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
          const mappedMessages = (data.messages || []).map((msg: any) => {
            const mappedMsg = {
              id: msg.id,
              type: msg.role === 'user' ? 'user' : 'ai', // Map role to type
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              files: msg.attachments || []
            };
            console.log('Mapped message:', { original: msg, mapped: mappedMsg });
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
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url || ''
      }))
    };

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

      // Execute submission and get AI response
      await executeSubmission({
        message,
        files,
        action,
        chatId: currentChatId!,
        userId: user?.uid || '',
        onSuccess: async (response: any) => {
          setMessages(prev => [...prev, response]);
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
                      <div className="mt-3 space-y-2">
                        {message.files.map((file) => (
                          <div key={file.id} className="flex items-center space-x-2 text-xs bg-gray-800 rounded-lg px-3 py-2">
                            <Icon name="paperclip" className="w-3 h-3" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // AI messages - Left side, no box, just text
                <div className="flex justify-start">
                  <div className="max-w-4xl transition-all duration-300 ease-in-out">
                    <p className="text-gray-900 text-sm leading-relaxed font-medium whitespace-pre-wrap">{message.content}</p>
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
