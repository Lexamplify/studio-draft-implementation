"use client";

import { useState } from 'react';
import { uploadChatFile } from '@/lib/firebase-storage';
// AI analysis will be handled server-side
import { apiClient } from '@/lib/api-client';
import { parseDocument, isFileTypeSupported } from '@/lib/document-parser';

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

interface ExtractedMetadata {
  caseName?: string;
  summary?: string;
  keyFacts?: string[];
  legalSections?: string[];
  parties?: {
    petitioner?: string;
    respondent?: string;
  };
  courtDetails?: {
    courtName?: string;
    caseNumber?: string;
  };
}

interface SubmissionWorkflowProps {
  message: string;
  files: StagedFile[];
  action: StagedAction | null;
  chatId: string | null;
  userId: string;
  chatFiles?: any[]; // Existing chat files for context
  onSuccess: (response: any) => void;
  onError: (error: Error) => void;
}

export default function useSubmissionWorkflow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');

  const executeSubmission = async ({
    message,
    files,
    action,
    chatId,
    userId,
    chatFiles = [],
    onSuccess,
    onError
  }: SubmissionWorkflowProps) => {
    setIsProcessing(true);
    
    try {
      let uploadedFiles: any[] = [];
      let extractedMetadata: ExtractedMetadata = {};
      
      // Step 1: File Upload to Firebase Storage (if files exist)
      if (files.length > 0 && chatId) {
        setCurrentStep('Uploading files...');
        uploadedFiles = await uploadFilesToFirebase(files, chatId, userId);
        
        // Store files in chat context for future reference
        // This will be handled by the calling component
      }
      
      // Step 2: AI Metadata Extraction (if files exist)
      if (uploadedFiles.length > 0) {
        setCurrentStep('Analyzing documents...');
        extractedMetadata = await extractMetadataWithAI(uploadedFiles);
      }
      
      // Step 3: Execute Action (if any)
      let actionResult = null;
      if (action) {
        setCurrentStep(`Executing ${action.label}...`);
        actionResult = await executeAction(action, extractedMetadata);
      }
      
      // Step 4: Send Chat Message with Context
      setCurrentStep('Sending message...');
      const chatResponse = await sendChatMessage(message, chatId, {
        files: [...uploadedFiles, ...chatFiles], // Include both new and existing files
        metadata: extractedMetadata,
        action: actionResult,
        userId,
        chatId // Pass chatId in context
      });
      
      setCurrentStep('');
      onSuccess(chatResponse);
      
    } catch (error) {
      console.error('Submission workflow error:', error);
      onError(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    executeSubmission,
    isProcessing,
    currentStep
  };
}

// Real implementations using Firebase Storage
async function uploadFilesToFirebase(files: StagedFile[], chatId: string, userId: string) {
  const uploadPromises = files.map(file => 
    uploadChatFile(file.file, chatId, userId)
  );
  
  return await Promise.all(uploadPromises);
}

async function extractMetadataWithAI(uploadedFiles: any[]): Promise<ExtractedMetadata> {
  if (uploadedFiles.length === 0) return {};
  
  try {
    console.log('extractMetadataWithAI - uploadedFiles:', uploadedFiles);
    
    // Upload files to Firebase storage and get their content
    const fileContents = await Promise.all(
      uploadedFiles.map(async (file) => {
        console.log('Processing file:', file);
        // For now, we'll read the file content directly
        // In a real implementation, you might want to upload to storage first
        const fileObj = file.file || file; // Handle both StagedFile and File objects
        console.log('File object:', fileObj);
        const content = await readFileContent(fileObj);
        console.log('File content extracted:', content.substring(0, 100) + '...');
        return {
          name: file.name,
          content: content,
          type: file.type,
          size: file.size
        };
      })
    );
    
    // Call server-side API for document analysis with actual content
    const firstFile = fileContents[0];
    
    const response = await apiClient.post('/api/llm/extract-details', {
      document: firstFile.content,
      documentName: firstFile.name
    });
    
    return {
      caseName: response.caseName,
      summary: response.summary,
      keyFacts: response.keyFacts,
      legalSections: response.legalSections,
      parties: {
        petitioner: response.petitionerName,
        respondent: response.respondentName
      },
      courtDetails: {
        courtName: response.courtName,
        caseNumber: response.caseNumber
      }
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {};
  }
}

// Helper function to read file content
async function readFileContent(file: File): Promise<string> {
  try {
    // Check if file type is supported
    if (!isFileTypeSupported(file)) {
      return `Document: ${file.name}\nFile Size: ${Math.round(file.size / 1024)} KB\nType: ${file.type}\n\n[Unsupported file type - the AI can reference this document by name: "${file.name}"]`;
    }

    // Parse the document using the document parser
    const parsedDoc = await parseDocument(file);
    return parsedDoc.content;
  } catch (error) {
    console.error('Error parsing document:', error);
    // Fallback to file info if parsing fails
    return `Document: ${file.name}\nFile Size: ${Math.round(file.size / 1024)} KB\nType: ${file.type}\n\n[Error parsing document - the AI can reference this document by name: "${file.name}"]`;
  }
}

async function saveMetadataToFirestore(metadata: ExtractedMetadata): Promise<string> {
  // Simulate Firestore save delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock metadata ID
  return `metadata_${Date.now()}`;
}

async function executeAction(action: StagedAction, metadata: ExtractedMetadata) {
  // Simulate action execution delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (action.type === 'createCase') {
    return {
      type: 'caseCreated',
      caseId: `case_${Date.now()}`,
      caseName: metadata.caseName || 'New Case',
      metadata
    };
  }
  
  if (action.type === 'createDraft') {
    return {
      type: 'draftCreated',
      draftId: `draft_${Date.now()}`,
      draftTitle: metadata.caseName ? `Draft for ${metadata.caseName}` : 'New Legal Draft',
      metadata
    };
  }
  
  if (action.type === 'addEvent') {
    return {
      type: 'eventAdded',
      eventId: `event_${Date.now()}`,
      eventTitle: metadata.caseName ? `Event for ${metadata.caseName}` : 'New Event',
      metadata
    };
  }
  
  return null;
}

async function sendChatMessage(message: string, chatId: string | null, context: any) {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }
  
  try {
    // Send user message to API
    await apiClient.post(`/api/chats/${chatId}/messages`, {
      role: 'user',
      content: message,
      attachments: context.files || []
    });
    
    // Get AI response using the proper chat flow
    const response = await apiClient.post('/api/chat', {
      message,
      chatHistory: [], // In real implementation, fetch chat history
      chatId: context.chatId, // Pass chatId to fetch files
      context: {
        caseId: context.metadata?.caseId,
        draftId: context.metadata?.draftId,
        userId: context.userId,
        files: context.files || [] // Include all files for context
      },
      document: context.files?.[0]?.content || undefined,
      documentName: context.files?.[0]?.name || undefined
    });
    
    // Save AI response to chat
    await apiClient.post(`/api/chats/${chatId}/messages`, {
      role: 'assistant',
      content: response.response,
      attachments: []
    });
    
    return {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: response.response,
      timestamp: new Date(),
      context
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}
