"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import StagingArea from './staging-area';
import ToolSelectionPopover from './tool-selection-popover';

interface StagedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

interface StagedAction {
  id: string;
  type: 'createCase' | 'createDraft' | 'addEvent';
  label: string;
}

interface AdvancedChatInputBarProps {
  onSendMessage: (message: string, files: StagedFile[], action: StagedAction | null) => Promise<void>;
  disabled?: boolean;
  isCentered?: boolean;
}

export default function AdvancedChatInputBar({ 
  onSendMessage, 
  disabled = false,
  isCentered = false
}: AdvancedChatInputBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [stagedAction, setStagedAction] = useState<StagedAction | null>(null);
  const [isToolPopoverOpen, setIsToolPopoverOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles: StagedFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file
    }));
    
    setStagedFiles(prev => [...prev, ...newFiles]);
    
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Remove file from staging
  const handleRemoveFile = useCallback((fileId: string) => {
    setStagedFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  // Handle tool selection
  const handleSelectTool = useCallback((tool: any) => {
    setStagedAction({
      id: `${Date.now()}-${Math.random()}`,
      type: tool.id,
      label: tool.label
    });
  }, []);

  // Remove action from staging
  const handleRemoveAction = useCallback(() => {
    setStagedAction(null);
  }, []);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() && stagedFiles.length === 0 && !stagedAction) return;
    
    setIsSubmitting(true);
    
    try {
      await onSendMessage(inputValue, stagedFiles, stagedAction);
      
      // Reset UI after successful send
      setInputValue('');
      setStagedFiles([]);
      setStagedAction(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [inputValue, stagedFiles, stagedAction, onSendMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={`border-t rounded-full  border-gray-200 bg-white ${isCentered ? 'border-0' : ''}`}>
      {/* Staging Area */}
      <StagingArea
        stagedFiles={stagedFiles}
        stagedAction={stagedAction}
        onRemoveFile={handleRemoveFile}
        onRemoveAction={handleRemoveAction}
      />

      {/* Input Control Bar */}
      <div 
        className={`p-4 transition-colors ${isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''} ${isCentered ? 'p-0' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <Icon name="upload" className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 font-medium">Drop files here</p>
            </div>
          </div>
        )}

        <div className={`flex items-center ${isCentered ? 'w-full max-w-3xl mx-auto px-4 py-3' : 'space-x-3'}`}>
          {/* Add File Button - ChatGPT style */}
          <button
            onClick={() => {
              // Reset the input value first to ensure change event fires
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
            disabled={disabled || isSubmitting}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Icon name="plus" className="w-5 h-5" />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />
{/* Tool Selection Button - Hidden in centered mode */}
{!isCentered && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsToolPopoverOpen(!isToolPopoverOpen)}
                disabled={disabled || isSubmitting}
                className={`p-2 rounded-full transition-all duration-200 ${
                  stagedAction 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon name="sparkles" className="w-4 h-4" />
              </button>
              
              <ToolSelectionPopover
                isOpen={isToolPopoverOpen}
                onClose={() => setIsToolPopoverOpen(false)}
                onSelectTool={handleSelectTool}
              />
            </div>
          )}
          {/* Text Input Field - ChatGPT style */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything"
              disabled={disabled || isSubmitting}
              className="w-full resize-none border-0 outline-none px-3 py-2 text-gray-900 placeholder-gray-500 min-h-[24px] max-h-32 text-base leading-relaxed bg-transparent"
              rows={1}
            />
          </div>

          {/* Voice Button - ChatGPT style */}
          <button
            disabled={disabled || isSubmitting}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Icon name="mic" className="w-5 h-5" />
          </button>

          {/* Send Button - Hidden for ChatGPT style, only show when there's content */}
          {(inputValue.trim() || stagedFiles.length > 0 || stagedAction) && (
            <button
              onClick={handleSend}
              disabled={disabled || isSubmitting}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="send" className="w-5 h-5" />
              )}
            </button>
          )}

          
        </div>
      </div>
    </div>
  );
}
