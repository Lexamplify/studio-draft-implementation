"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Send, 
  Paperclip, 
  Wrench, 
  Mic, 
  Link as LinkIcon,
  FileText,
  Edit3,
  Zap,
  X,
  Check
} from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useMessages, useChats } from '@/context/chats-context';
import { useCases } from '@/context/cases-context';
import { apiClient } from '@/lib/api-client';
import CaseCreationModal from '@/components/modals/case-creation-modal';
import { ConversationLoading, ConversationSkeleton } from '@/components/ui/conversation-loading';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatView() {
  const { selectedChatId } = useAppContext();
  const { messages, addMessage, loading } = useMessages(selectedChatId);
  const { cases } = useCases();
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkedCaseId, setLinkedCaseId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [isCaseCreationModalOpen, setIsCaseCreationModalOpen] = useState(false);
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show loading when switching chats
  useEffect(() => {
    if (selectedChatId) {
      setIsChatLoading(true);
    }
  }, [selectedChatId]);

  // Clear chat loading when messages are loaded
  useEffect(() => {
    if (!loading && selectedChatId) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsChatLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, selectedChatId]);

  const { chats } = useChats();

  // Load linked case when chat changes
  useEffect(() => {
    if (selectedChatId) {
      const chat = chats.find(c => c.id === selectedChatId);
      setLinkedCaseId(chat?.linkedCaseId || null);
    } else {
      setLinkedCaseId(null);
    }
  }, [selectedChatId, chats]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedFile) return;

    try {
      if (uploadedFile) {
        // Handle file upload with action buttons
        setUploadedFile(uploadedFile);
        setInput('');
        return;
      }

      // Add user message
      await addMessage('user', input);
      const userMessage = input;
      setInput('');
      
      // Set loading state for assistant response
      setIsAssistantResponding(true);
      
      // Get AI response via API
      try {
        const response = await apiClient.post('/api/chat', {
          message: userMessage,
          chatHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
          context: {
            caseId: selectedChatId, // Using chatId as context for now
          }
        });

        // Add AI response
        await addMessage('assistant', response.response);
      } catch (aiError) {
        console.error('AI Error:', aiError);
        await addMessage('assistant', 'I apologize, but I encountered an error processing your message. Please try again.');
      } finally {
        // Clear loading state
        setIsAssistantResponding(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsAssistantResponding(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleFileAction = (action: 'summarize' | 'edit' | 'arguments') => {
    if (!uploadedFile) return;
    
    console.log(`File action: ${action}`, uploadedFile.name);
    // TODO: Implement file actions
    setUploadedFile(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLinkToCase = async () => {
    if (!selectedCaseId || !selectedChatId) return;

    try {
      // Update the chat to link it to the selected case
      await apiClient.put(`/api/chats/${selectedChatId}`, {
        linkedCaseId: selectedCaseId
      });

      setLinkedCaseId(selectedCaseId);
      setShowLinkModal(false);
      setSelectedCaseId('');
    } catch (error) {
      console.error('Error linking chat to case:', error);
    }
  };

  const handleUnlinkCase = async () => {
    if (!selectedChatId) return;

    try {
      // Remove the link from the chat
      await apiClient.put(`/api/chats/${selectedChatId}`, {
        linkedCaseId: null
      });

      setLinkedCaseId(null);
    } catch (error) {
      console.error('Error unlinking chat from case:', error);
    }
  };


  const getLinkedCaseName = () => {
    if (!linkedCaseId) return null;
    const caseItem = cases.find(c => c.id === linkedCaseId);
    return caseItem?.caseName || 'Unknown Case';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          {linkedCaseId ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlinkCase}
                className="text-green-600 hover:text-green-800"
              >
                <Check className="h-4 w-4 mr-1" />
                Linked to: {getLinkedCaseName()}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkModal(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Change Link
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkModal(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              Link to Case
            </Button>
          )}
          {!linkedCaseId && (
            <span className="text-sm text-gray-500">Not linked</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading || isChatLoading ? (
          <ConversationSkeleton />
        ) : !selectedChatId ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat</h3>
            <p className="text-gray-500 max-w-md">
              Choose a chat from the sidebar to start or continue a conversation.
            </p>
          </div>
        ) : messages.length === 0 && !isAssistantResponding ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to LexAI Assistant</h3>
            <p className="text-gray-500 max-w-md">
              Start a conversation about Indian law, upload documents for analysis, or ask for legal guidance.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Show conversation loading when assistant is responding */}
            {isAssistantResponding && (
              <ConversationLoading />
            )}
          </>
        )}
        
        {uploadedFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">{uploadedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedFile(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleFileAction('summarize')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="h-4 w-4 mr-1" />
                Summarize
              </Button>
              <Button
                onClick={() => handleFileAction('edit')}
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit in Draft
              </Button>
              <Button
                onClick={() => handleFileAction('arguments')}
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Zap className="h-4 w-4 mr-1" />
                Generate Arguments
              </Button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTools(!showTools)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Wrench className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-gray-600"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Indian law or upload a document..."
              className="min-h-[40px] max-h-32 resize-none pr-12"
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSend}
                size="sm"
                disabled={!input.trim() && !uploadedFile}
                className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tools Menu */}
        {showTools && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setIsCaseCreationModalOpen(true)}
              >
                Create New Case
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Generate from Draft
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt"
      />

      {/* Case Linking Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link Chat to Case</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select a case to link this chat to:
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a case...</option>
                {cases.map((caseItem) => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.caseName}
                  </option>
                ))}
              </select>
            </div>
            
            {cases.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No cases available. Create a case first to link this chat.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkModal(false);
                setSelectedCaseId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkToCase}
              disabled={!selectedCaseId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Link to Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CaseCreationModal
        isOpen={isCaseCreationModalOpen}
        onClose={() => setIsCaseCreationModalOpen(false)}
      />
    </div>
  );
}
