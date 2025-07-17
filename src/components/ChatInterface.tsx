"use client";

import type { FormEvent } from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { legalAdviceChat, type LegalAdviceChatInput, type LegalAdviceChatOutput } from "@/ai/flows/legal-advice-chat";
import { processDocument, type DocumentProcessingInput } from "@/ai/flows/document-processing";
import type { ChatMessage } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import ClientFormattedTime from "@/components/client-formatted-time";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  initialQuery?: string;
  initialFile?: File;
  initialFileName?: string;
  className?: string;
  onWorkflowTrigger?: (workflow: string, prompt: string) => void;
}

export default function ChatInterface({ 
  initialQuery = "", 
  initialFile, 
  initialFileName,
  className,
  onWorkflowTrigger
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(initialFile || null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(initialFileName || null);
  const [extractedDocText, setExtractedDocText] = useState<string>("");
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [keyInformation, setKeyInformation] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);

  const suggestedPrompts = [
    "Summarize the key points of my uploaded document",
    "Translate this document to Hindi",
    "Generate arguments and counter-arguments for this case",
    "Provide legal citations for this document",
    "What are the key elements of a valid contract under Indian law?",
    "Explain the process for filing a consumer complaint in India",
  ];

  // Convert file to base64 for Genkit processing
  const fileToBase64 = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:mime;base64, prefix to get just the base64 data
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle file upload using Genkit document processing
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadedFile(file);
    setUploadedFileName(file.name);
    
    try {
      // Handle simple text files directly for immediate preview
      if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const fileContent = await file.text();
        setExtractedDocText(fileContent);
        setDocumentType('Text Document');
        setKeyInformation(['Direct text content loaded']);
        
        toast({
          title: "Text document uploaded",
          description: `${file.name} has been processed and is ready for analysis.`,
        });
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const jsonContent = await file.text();
        try {
          const parsed = JSON.parse(jsonContent);
          const formattedContent = JSON.stringify(parsed, null, 2);
          setExtractedDocText(formattedContent);
          setDocumentType('JSON Document');
          setKeyInformation(['Structured data format']);
          
          toast({
            title: "JSON document uploaded",
            description: `${file.name} has been parsed and is ready for analysis.`,
          });
        } catch {
          setExtractedDocText(jsonContent);
          setDocumentType('Text Document');
          setKeyInformation(['Raw text content']);
          toast({
            title: "Document uploaded",
            description: `${file.name} content loaded as text.`,
          });
        }
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Use Genkit for PDF processing
        const base64Data = await fileToBase64(file);
        
        const result = await processDocument({
          fileData: base64Data,
          mimeType: file.type,
          fileName: file.name,
          prompt: "This is a legal document. Please extract all text content, identify the document type, key sections, required fields, and any important information that needs to be filled or completed."
        });
        
        setExtractedDocText(result.extractedText);
        setDocumentType(result.documentType || 'PDF Document');
        setKeyInformation(result.keyInformation || []);
        
        toast({
          title: "PDF uploaded successfully",
          description: `${file.name} has been uploaded. You can now ask questions about this document and get legal guidance.`,
        });
      } else {
        // For other file types (DOCX, images), try Genkit processing
        try {
          const base64Data = await fileToBase64(file);
          
          const result = await processDocument({
            fileData: base64Data,
            mimeType: file.type,
            fileName: file.name,
            prompt: file.type.includes('image') 
              ? "Extract and transcribe all text content from this image. If it's a legal document, identify the document type and key sections."
              : "Extract and summarize all text content from this document. If it's a legal document, identify the document type, key sections, and important information that needs to be filled or completed."
          });
          
          setExtractedDocText(result.extractedText);
          setDocumentType(result.documentType || 'Document');
          setKeyInformation(result.keyInformation || []);
          
          toast({
            title: "Document processed successfully",
            description: `${file.name} has been analyzed using Genkit and is ready for questions.`,
          });
        } catch (genkitError) {
          console.error('Genkit processing error:', genkitError);
          
          // Fallback to file reference
          const fallbackContent = `[Document: ${file.name}]
File type: ${file.type}
File size: ${(file.size / 1024).toFixed(2)} KB

This ${file.type.includes('pdf') ? 'PDF' : file.type.includes('word') || file.type.includes('document') ? 'Word document' : file.type.includes('image') ? 'image' : 'document'} has been uploaded but could not be fully processed using Genkit. You can still ask questions about it.`;

          setExtractedDocText(fallbackContent);
          setDocumentType('Unknown Document');
          setKeyInformation(['Processing failed - manual analysis available']);
          
          toast({
            variant: "destructive",
            title: "Processing limitation",
            description: "Document uploaded but Genkit processing failed. You can still ask questions about the file.",
          });
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      const fallbackContent = `[Document: ${file.name}]
File uploaded but could not be processed. You can still ask questions about this document.`;
      
      setExtractedDocText(fallbackContent);
      setDocumentType('Error');
      setKeyInformation(['Upload failed - please try again']);
      
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to process document. You can still chat about it.",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, fileToBase64]);

  // Process chat query with Gemini file context
  const processQuery = useCallback(async (queryToProcess: string, isInitial: boolean = false, workflowName?: string) => {
    if (!queryToProcess.trim() || (isLoading && !isInitial)) return;
    if (workflowName) setActiveWorkflow(workflowName);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: queryToProcess,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    if (!isInitial) setInput("");
    setIsLoading(true);

    try {
      // Format chat history for AI
      const chatHistory = messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }]
      }));

      // Prepare AI input with extracted document content

      
      const aiInput: LegalAdviceChatInput = {
        question: userMessage.content,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
        document: extractedDocText || undefined,
        documentName: uploadedFileName || undefined,
      };
      
      const result: LegalAdviceChatOutput = await legalAdviceChat(aiInput);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.answer,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response from LexAI. Please try again.",
      });
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setActiveWorkflow(null);
      if (isInitial) setHasProcessedInitialQuery(true);
    }
  }, [isLoading, messages, toast, extractedDocText, uploadedFileName]);

  // Handle initial query and dynamic queries
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      // For workflow triggers, always process the query
      if (messages.length > 0 || hasProcessedInitialQuery) {
        // This is a workflow trigger, process immediately
        let queryWithFileContext = initialQuery;
        if (uploadedFileName) {
          queryWithFileContext = `(Regarding uploaded file: ${uploadedFileName}) ${initialQuery}`;
        }
        processQuery(queryWithFileContext);
      } else if (!hasProcessedInitialQuery && messages.length === 0) {
        // This is the initial query on page load
        let queryWithFileContext = initialQuery;
        if (uploadedFileName) {
          queryWithFileContext = `(Regarding uploaded file: ${uploadedFileName}) ${initialQuery}`;
        }
        processQuery(queryWithFileContext, true);
      }
    }
  }, [initialQuery, uploadedFileName, hasProcessedInitialQuery, messages.length, processQuery]);

  // Handle initial file
  useEffect(() => {
    if (initialFile && !uploadedFile) {
      handleFileUpload(initialFile);
    }
  }, [initialFile, uploadedFile, handleFileUpload]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    processQuery(input);
  };

  // Handle suggested prompt click
  const handleSuggestedPromptClick = (promptText: string) => {
    setInput(promptText);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileName(null);
    setExtractedDocText("");
    setDocumentType(null);
    setKeyInformation([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const workflowActions = [
    { 
      title: 'Summarize', 
      prompt: 'Please summarize the key points of my uploaded document.',
      icon: Icons.Template,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
    },
    { 
      title: 'Citations', 
      prompt: 'Please provide legal citations for the issues in my uploaded document.',
      icon: Icons.CaseFile,
      color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
    },
    { 
      title: 'Translate', 
      prompt: 'Please translate my uploaded document to Hindi.',
      icon: Icons.Rephrase,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
    },
    { 
      title: 'Arguments', 
      prompt: 'Please generate arguments and counter-arguments for the legal position in my case.',
      icon: Icons.Scale,
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
    },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-card shadow-lg rounded-lg overflow-hidden", className)}>
      {/* LexAI Workflows Section */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icons.Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">LexAI Workflows</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {workflowActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 h-auto p-2 ${action.color} border ${activeWorkflow === action.title.toLowerCase() ? 'ring-2 ring-primary bg-primary/10' : ''}`}
              onClick={() => {
                setActiveWorkflow(action.title.toLowerCase());
                if (onWorkflowTrigger) {
                  onWorkflowTrigger(action.title.toLowerCase(), action.prompt);
                } else {
                  // Directly process the workflow prompt
                  processQuery(action.prompt, false, action.title.toLowerCase());
                }
              }}
              disabled={!!activeWorkflow}
            >
              {activeWorkflow === action.title.toLowerCase() ? (
                <Icons.Sparkles className="h-3 w-3 animate-spin flex-shrink-0" />
              ) : (
                <action.icon className="h-3 w-3 flex-shrink-0" />
              )}
              <span className="text-xs font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Messages Area - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-4 md:p-6" ref={scrollAreaRef}>
          {/* Welcome message and suggested prompts */}
          {messages.length === 0 && !isLoading && !initialQuery && !hasProcessedInitialQuery && (
            <div className="mb-6 p-6 border rounded-lg bg-muted/30">
              <div className="text-center mb-4">
                <Icons.Assistant className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Welcome to LexAI</h3>
                <p className="text-sm text-muted-foreground">
                  Your AI-powered Indian legal assistant. Ask any legal question or upload a document for analysis.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Quick Questions:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3 justify-start text-left whitespace-normal hover:bg-accent/50"
                      onClick={() => handleSuggestedPromptClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10">
                      <Icons.Assistant className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <Card
                  className={`max-w-xs md:max-w-md lg:max-w-lg shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border"
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">{children}</blockquote>,
                          code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <ClientFormattedTime 
                      date={message.timestamp} 
                      className="text-xs mt-2 opacity-70 text-right block"
                    />
                  </CardContent>
                </Card>
                
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted">
                      <Icons.User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-end gap-3 justify-start">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    <Icons.Assistant className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <Card className="max-w-xs md:max-w-md lg:max-w-lg shadow-sm bg-muted border">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Icons.Sparkles className="h-4 w-4 animate-pulse text-primary" />
                      <p className="text-sm text-muted-foreground">LexAI is thinking...</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Fixed Input Area */}
      <div className="border-t bg-background p-4 space-y-3">
        {/* File upload indicator */}
        {uploadedFileName && (
          <div className="p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Document: {uploadedFileName}
                </span>
                {isUploading && (
                  <Icons.Sparkles className="h-4 w-4 animate-pulse text-primary" />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-6 w-6 p-0"
                disabled={isUploading}
              >
                <Icons.Close className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Document analysis info */}
            {documentType && !isUploading && (
              <div className="text-xs text-muted-foreground space-y-1">
                                 <div className="flex items-center gap-1">
                   <Icons.Check className="h-3 w-3 text-green-600" />
                   <span>Type: {documentType}</span>
                 </div>
                {keyInformation.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {keyInformation.slice(0, 2).map((info, index) => (
                      <span key={index} className="inline-block bg-primary/10 text-primary px-1 py-0.5 rounded text-xs">
                        {info}
                      </span>
                    ))}
                    {keyInformation.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{keyInformation.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2 flex-shrink-0"
          >
            {isUploading ? (
              <Icons.Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <Icons.Paperclip className="h-4 w-4" />
            )}
            Upload
          </Button>
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a legal question..."
            className="flex-1"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="px-4 flex-shrink-0"
          >
            {isLoading ? (
              <Icons.Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <Icons.Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".txt,.md,.json,.pdf"
        />
      </div>
    </div>
  );
} 