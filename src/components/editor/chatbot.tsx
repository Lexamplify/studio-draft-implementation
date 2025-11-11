"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed unused Card imports
import { MessageCircle, Send, Sparkles, Trash2, Code } from "lucide-react";
import { useConversationHistory } from "@/hooks/use-conversation-history";
import { ConversationMessage } from "./conversation-message";
import { useEditorStore } from "@/store/use-editor-store";

interface ChatbotProps {
  onSendMessage: (message: string) => void;
  onAcceptSuggestion?: (suggestion: string) => void;
  onRejectSuggestion?: () => void;
}

export const Chatbot = ({ onSendMessage, onAcceptSuggestion, onRejectSuggestion }: ChatbotProps) => {
  const [message, setMessage] = useState("");
  const { messages, addUserMessage, addAIMessage, addSuggestion, addJsonMessage, updateSuggestionStatus, clearHistory } = useConversationHistory();
  const { editor } = useEditorStore();

  const handleSendMessage = () => {
    if (message.trim()) {
      addUserMessage(message.trim());
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAISuggest = async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    console.log("🔍 Chatbot AI Suggest - Selection:", selection);
    console.log("🔍 Chatbot AI Suggest - Selected Text:", selectedText);
    
    if (!selectedText) {
      addAIMessage("Please select some text in the document to get AI suggestions.");
      return;
    }
    
    addUserMessage(`AI Suggest for: "${selectedText}"`);
    addAIMessage("Generating AI suggestion...");
    
    try {
      // Import AIService here to avoid circular dependencies
      const { AIService } = await import("@/lib/ai-service");
      const aiSuggestion = await AIService.rephraseText(selectedText);
      console.log("✅ AI Suggestion received in chatbot:", aiSuggestion);
      addSuggestion(selectedText, aiSuggestion);
    } catch (error) {
      console.error("❌ Error getting AI suggestion in chatbot:", error);
      addAIMessage("Sorry, I couldn't generate a suggestion. Please try again.");
    }
  };

  const handleAcceptSuggestion = (messageId: string, suggestion: string) => {
    updateSuggestionStatus(messageId, 'accepted');
    onAcceptSuggestion?.(suggestion);
    addAIMessage("Suggestion accepted and applied to the document!");
  };

  const handleRejectSuggestion = (messageId: string) => {
    updateSuggestionStatus(messageId, 'rejected');
    onRejectSuggestion?.();
    addAIMessage("Suggestion rejected.");
  };

  const handleShowJson = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    console.log("🔍 Chatbot Show JSON - Selection:", selection);
    console.log("🔍 Chatbot Show JSON - Selected Text:", selectedText);
    
    if (!selectedText) {
      addAIMessage("Please select some text in the document to show its JSON format.");
      return;
    }
    
    if (!editor) {
      addAIMessage("Editor not available. Please try again.");
      return;
    }
    
    addUserMessage(`Show JSON for: "${selectedText}"`);
    
    try {
      // Get the editor's JSON content
      const editorJson = editor.getJSON();
      
      // Extract the JSON content that corresponds to the selected text
      const selectedJsonContent = extractSelectedJsonContent(editorJson, selectedText);
      
      console.log("🔍 Extracted selected JSON content:", selectedJsonContent);
      console.log("🔍 Full editor JSON for reference:", editorJson);
      
      // Create a JSON representation with the selected content
      const jsonContent = {
        type: "doc",
        content: selectedJsonContent,
        selectedText: selectedText,
        timestamp: new Date().toISOString(),
        editorVersion: "TipTap",
        format: "TipTap JSON Document"
      };

      console.log("📄 Selected TipTap JSON Content created in chatbot:", jsonContent);
      addJsonMessage(
        `TipTap JSON representation of selected text: "${selectedText}"`,
        jsonContent,
        "Selected Text TipTap JSON"
      );
      console.log("📄 Selected TipTap JSON message added to conversation in chatbot");
    } catch (error) {
      console.error("❌ Error creating selected TipTap JSON content in chatbot:", error);
      addAIMessage("Sorry, I couldn't create the JSON representation. Please try again.");
    }
  };

  // Helper function to extract JSON content that corresponds to selected text
  const extractSelectedJsonContent = (editorJson: { content?: unknown[] }, selectedText: string): unknown[] => {
    if (!editorJson.content || !Array.isArray(editorJson.content)) {
      return [];
    }

    const selectedContent: unknown[] = [];
    
    // Function to recursively search through content and find matching text
    const searchContent = (content: unknown[], parentNode?: unknown): unknown[] => {
      const results: unknown[] = [];
      
      for (const item of content) {
        if (item && typeof item === 'object' && 'type' in item && 'text' in item) {
          const textItem = item as { type: string; text: string; marks?: unknown[] };
          // Check if this text node contains the selected text
          if (textItem.text.includes(selectedText)) {
            // Create a text node with the selected text and preserve formatting
            const textNode = {
              type: 'text',
              text: selectedText,
              marks: textItem.marks || []
            };
            
            // If we have a parent node, preserve its structure
            if (parentNode) {
              results.push({
                ...parentNode,
                content: [textNode]
              });
            } else {
              // Create a paragraph wrapper
              results.push({
                type: 'paragraph',
                content: [textNode]
              });
            }
          }
        } else if (item && typeof item === 'object' && 'content' in item && Array.isArray((item as { content: unknown }).content)) {
          // Recursively search in nested content
          const nestedResults = searchContent((item as { content: unknown[] }).content, item);
          if (nestedResults.length > 0) {
            results.push(...nestedResults);
          }
        } else if (item && typeof item === 'object' && 'text' in item) {
          const textItem = item as { text: string };
          if (textItem.text.includes(selectedText)) {
            // Direct text match in non-text nodes
            results.push({
              ...item,
              text: selectedText
            });
          }
        }
      }
      
      return results;
    };

    const searchResults = searchContent(editorJson.content);
    selectedContent.push(...searchResults);
    
    // If no specific content found, return a paragraph with the selected text
    if (selectedContent.length === 0) {
      return [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: selectedText
        }]
      }];
    }

    // Remove duplicates and return unique content
    const uniqueContent = selectedContent.filter((item, index, self) => 
      index === self.findIndex(t => JSON.stringify(t) === JSON.stringify(item))
    );

    return uniqueContent;
  };

  const handleClearHistory = () => {
    clearHistory();
    addAIMessage("Conversation history cleared.");
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="text-gray-500 hover:text-gray-700 p-1 h-6 w-6"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <Button
          onClick={handleAISuggest}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Suggest
        </Button>
        
        <Button
          onClick={handleShowJson}
          variant="outline"
          className="w-full border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
        >
          <Code className="w-4 h-4 mr-2" />
          Show JSON
        </Button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Welcome Message - only show if no messages */}
          {messages.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Hi! I&apos;m your AI assistant. I can help you improve your document content, suggest edits, or answer questions about your writing.
              </p>
            </div>
          )}
          
          {/* Conversation Messages */}
          {messages.map((message) => (
            <ConversationMessage
              key={message.id}
              message={message}
              onAcceptSuggestion={handleAcceptSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
            />
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your document..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
