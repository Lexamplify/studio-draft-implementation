"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, User, Bot, Sparkles, FileText } from "lucide-react";
import { Message } from "@/hooks/use-conversation-history";
import { JsonContentDisplay } from "./json-content-display";

interface ConversationMessageProps {
  message: Message;
  onAcceptSuggestion?: (messageId: string, suggestion: string) => void;
  onRejectSuggestion?: (messageId: string) => void;
}

export const ConversationMessage = ({ 
  message, 
  onAcceptSuggestion, 
  onRejectSuggestion 
}: ConversationMessageProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'ai':
        return <Bot className="w-4 h-4" />;
      case 'suggestion':
        return <Sparkles className="w-4 h-4" />;
      case 'json':
        return <FileText className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getMessageBgColor = () => {
    switch (message.type) {
      case 'user':
        return 'bg-blue-50 border-blue-200';
      case 'ai':
        return 'bg-gray-50 border-gray-200';
      case 'suggestion':
        return 'bg-purple-50 border-purple-200';
      case 'json':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (message.type === 'json') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {getMessageIcon()}
          <span className="font-medium">JSON Content</span>
          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
        </div>
        
        <JsonContentDisplay
          content={message.jsonContent}
          title={message.jsonTitle || "Selected Content"}
          onCopy={(content) => console.log("JSON copied:", content)}
        />
      </div>
    );
  }

  if (message.type === 'suggestion') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {getMessageIcon()}
          <span className="font-medium">AI Suggestion</span>
          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
        </div>
        
        <Card className={`${getMessageBgColor()} border-l-4 border-l-purple-400`}>
          <CardContent className="p-3">
            <div className="space-y-3">
              {/* Original Text */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Original:</p>
                <p className="text-sm text-gray-700 italic">"{message.originalText}"</p>
              </div>
              
              {/* Suggestion */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Suggestion:</p>
                <p className="text-sm text-gray-800 font-medium">"{message.suggestion}"</p>
              </div>
              
              {/* Status */}
              {message.status && (
                <div className="flex items-center gap-2">
                  {message.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onAcceptSuggestion?.(message.id, message.suggestion || '')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRejectSuggestion?.(message.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-2 py-1 h-6"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {message.status === 'accepted' && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Accepted
                    </span>
                  )}
                  {message.status === 'rejected' && (
                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Rejected
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {getMessageIcon()}
        <span className="font-medium capitalize">{message.type}</span>
        <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
      </div>
      
      <Card className={getMessageBgColor()}>
        <CardContent className="p-3">
          <p className="text-sm text-gray-800">{message.content}</p>
        </CardContent>
      </Card>
    </div>
  );
};
