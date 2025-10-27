"use client";

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/app-context';
import { useDrafts } from '@/hooks/use-drafts';

interface EditorMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  aiGeneratedText?: string;
}

interface DraftEditorInterfaceProps {
  draftId: string | null;
  onReopenWorkspace?: () => void;
}

export default function DraftEditorInterface({ draftId, onReopenWorkspace }: DraftEditorInterfaceProps) {
  const { selectedDraftId } = useAppContext();
  const { drafts } = useDrafts();
  
  const [draftContent, setDraftContent] = useState('');
  const [editorMessages, setEditorMessages] = useState<EditorMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const currentDraft = drafts.find(draft => draft.id === draftId);

  useEffect(() => {
    if (draftId && currentDraft) {
      // Load draft content
      setDraftContent(currentDraft.content || '');
      
      // Initialize AI editor with context
      setEditorMessages([
        {
          id: '1',
          type: 'ai',
          content: `This draft "${currentDraft.title || 'Untitled Draft'}" is loaded. You can highlight any text to refine it, or ask me to perform actions like 'Check citations' or 'Suggest a stronger conclusion'.`,
          timestamp: new Date()
        }
      ]);
    }
  }, [draftId, currentDraft]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [editorMessages]);

  const handleTextSelection = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
      } else {
        setSelectedText('');
      }
    }
  };

  const handleSendEditorMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: EditorMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setEditorMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response with generated text
    setTimeout(() => {
      const aiMessage: EditorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Certainly. Here is a revised version for that section:",
        timestamp: new Date(),
        aiGeneratedText: selectedText 
          ? `Here's an improved version of your selected text: "${selectedText}" → "This is an enhanced version with better legal terminology and stronger arguments."`
          : "Here's a suggested improvement for the highlighted section with more precise legal language and stronger supporting arguments."
      };
      setEditorMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendEditorMessage();
    }
  };

  const handleApplyAIText = (text: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        setDraftContent(editorRef.current.value);
      }
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Editor Pane (Left 2/3) */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Editor Header */}
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
              
              <h1 className="text-lg font-semibold text-gray-900">
                {currentDraft?.title || 'Untitled Draft'}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Icon name="save" className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Icon name="download" className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-4">
          <textarea
            ref={editorRef}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            className="w-full h-full resize-none border-none outline-none text-gray-900 leading-relaxed"
            placeholder="Start writing your legal document..."
            style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.6' }}
          />
        </div>

        {/* Editor Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Words: {draftContent.split(/\s+/).filter(word => word.length > 0).length}</span>
              <span>Characters: {draftContent.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Icon name="formatBold" className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Icon name="formatItalic" className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Icon name="list" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Editing Pane (Right 1/3) */}
      <div className="w-1/3 flex flex-col border-l border-gray-200">
        {/* AI Editor Header */}
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Draft Assistant</h2>
          <p className="text-sm text-gray-600 mt-1">
            Context: {currentDraft?.title || 'Current Document'}
          </p>
        </div>

        {/* AI Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {editorMessages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>

              {message.aiGeneratedText && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-800">AI Generated Text:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyAIText(message.aiGeneratedText!)}
                      className="text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                  <p className="text-sm text-blue-900">{message.aiGeneratedText}</p>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
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

        {/* AI Input Bar */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-2">
            {selectedText && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-xs text-yellow-800 font-medium">Selected text:</p>
                <p className="text-xs text-yellow-700 truncate">"{selectedText}"</p>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask AI to edit, improve, or analyze..."
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleSendEditorMessage}
                disabled={!inputValue.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Icon name="send" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
