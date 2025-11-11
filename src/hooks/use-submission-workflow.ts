"use client";

import { useState } from 'react';
import { uploadChatFile } from '@/lib/firebase-storage';
// AI analysis will be handled server-side
import { apiClient } from '@/lib/api-client';

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
  onStreamChunk?: (chunk: string) => void;
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
    onStreamChunk,
    onSuccess,
    onError
  }: SubmissionWorkflowProps) => {
    setIsProcessing(true);
    
    try {
      let uploadedFiles: any[] = [];
      let extractedMetadata: ExtractedMetadata = {};
      
      // Step 1: Read file content FIRST (before upload) from original File objects
      let filesWithContent: any[] = [];
      if (files.length > 0) {
        setCurrentStep('Reading files...');
        filesWithContent = await Promise.all(
          files.map(async (stagedFile: StagedFile) => {
            const fileObj = stagedFile.file; // Get original File object
            let content = '';
            try {
              content = await readFileContent(fileObj);
            } catch (error) {
              console.error('Error reading file content:', error);
              content = `Document: ${stagedFile.name}\nFile Size: ${Math.round(stagedFile.size / 1024)} KB\nType: ${stagedFile.type}\n\n[Document uploaded: ${stagedFile.name}]`;
            }
            return {
              id: stagedFile.id,
              name: stagedFile.name,
              type: stagedFile.type,
              size: stagedFile.size,
              file: fileObj, // Keep original File object for upload
              content: content // Include content for AI
            };
          })
        );
      }
      
      // Step 2: File Upload to Firebase Storage (if files exist)
      if (filesWithContent.length > 0 && chatId) {
        setCurrentStep('Uploading files...');
        uploadedFiles = await Promise.all(
          filesWithContent.map((fileWithContent: any) => 
            uploadChatFile(fileWithContent.file, chatId, userId)
          )
        );
        
        // Merge uploaded file metadata with content and save to database
        filesWithContent = await Promise.all(
          filesWithContent.map(async (fileWithContent: any, index: number) => {
            const uploadedFile = uploadedFiles[index];
            const mergedFile = {
              ...fileWithContent,
              ...uploadedFile, // Add id, url, path from uploaded file
              content: fileWithContent.content // Keep content for AI
            };
            
            // Save file metadata to database
            try {
              await apiClient.post(`/api/chats/${chatId}/files`, {
                id: uploadedFile.id,
                name: uploadedFile.name,
                type: uploadedFile.type,
                size: uploadedFile.size,
                url: uploadedFile.url,
                path: uploadedFile.path,
                uploadedAt: uploadedFile.uploadedAt
              });
            } catch (error) {
              console.error('Error saving file to database:', error);
              // Continue even if database save fails
            }
            
            return mergedFile;
          })
        );
      }
      
      // Step 3: AI Metadata Extraction (if files exist)
      if (filesWithContent.length > 0) {
        setCurrentStep('Analyzing documents...');
        extractedMetadata = await extractMetadataWithAI(filesWithContent);
      }
      
      // Step 4: Execute Action (if any)
      let actionResult = null;
      if (action) {
        setCurrentStep(`Executing ${action.label}...`);
        actionResult = await executeAction(action, extractedMetadata);
      }
      
        // Step 5: Send Chat Message with Context (using streaming)
        setCurrentStep('Sending message...');
        // Only include files that were actually uploaded in this message
        // filesWithContent contains only the new files uploaded now
        const newFiles = filesWithContent.length > 0 ? filesWithContent : uploadedFiles;
        
        console.log('Sending chat message with NEW files only:', newFiles.map(f => ({ id: f.id, name: f.name })));
        
        const chatResponse = await sendChatMessage(message, chatId, {
          files: newFiles, // Only include NEW files uploaded in this message
          metadata: extractedMetadata,
          action: actionResult,
          userId,
          chatId, // Pass chatId in context
          uploadedFileIds: newFiles.map(f => f.id).filter(Boolean) // Pass the exact file IDs that were uploaded
        }, onStreamChunk || undefined); // Pass streaming callback from props
      
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
    
    // Read file content (text files only, others just get file info)
    const fileContents = await Promise.all(
      uploadedFiles.map(async (file) => {
        console.log('Processing file:', file);
        const fileObj = file.file || file; // Handle both StagedFile and File objects
        console.log('File object:', fileObj);
        
        let content = '';
        try {
          content = await readFileContent(fileObj);
        } catch (error) {
          console.error('Error reading file content:', error);
          // Fallback to file info
          content = `Document: ${file.name}\nFile Size: ${Math.round(file.size / 1024)} KB\nType: ${file.type}\n\n[Document uploaded: ${file.name}]`;
        }
        
        console.log('File content extracted:', content.substring(0, 100) + '...');
        return {
          name: file.name,
          content: content,
          type: file.type,
          size: file.size,
          id: file.id // Include file ID for reference
        };
      })
    );
    
    // Only analyze text files or files with extractable content
    // For other files, skip metadata extraction
    const firstFile = fileContents[0];
    
    // Only call API if we have meaningful content (not just file info)
    if (firstFile.content && !firstFile.content.includes('[Document uploaded:') && !firstFile.content.includes('[This document has been uploaded')) {
      try {
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
        console.error('Error calling extract-details API:', error);
        // Continue without metadata extraction - document is still stored
      }
    }
    
    // Return empty metadata if extraction fails or file is not parseable
    // Document is still stored and AI can reference it by name
    return {};
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {};
  }
}

// Helper function to read file content
async function readFileContent(file: File): Promise<string> {
  try {
    // For text files, read directly without parsing
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      const content = await file.text();
      return content;
    }

    // For PDF, DOCX, and DOC files, try to parse using the API
    // If parsing fails, fall back to file info
    try {
      // Use the document parser which handles API calls internally
      const { parseDocument } = await import('@/lib/document-parser');
      const parsed = await parseDocument(file);
      
      // Return the extracted content (truncate to avoid model/token limits)
      if (parsed.content && parsed.content.trim().length > 0) {
        const MAX_CHARS = 30000; // ~30k chars safeguard
        const content = parsed.content.length > MAX_CHARS
          ? `${parsed.content.slice(0, MAX_CHARS)}\n\n[Truncated to ${MAX_CHARS} characters for processing]`
          : parsed.content;
        return content;
      } else {
        throw new Error('Empty content extracted');
      }
    } catch (parseError) {
      console.error('Error parsing document:', parseError);
      // Fallback to file info if parsing fails
      const fileSizeKB = Math.round(file.size / 1024);
      const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown error';
      console.log(`Fallback for ${file.name}: ${errorMsg}`);
      
      // Return helpful message but still indicate file is uploaded
      return `Document: ${file.name}\nFile Size: ${fileSizeKB} KB\nType: ${file.type}\n\n[Note: The document "${file.name}" has been uploaded and stored, but I was unable to extract its text content automatically. This may be because:\n- The file format requires special parsing\n- The file is corrupted or encrypted\n- There was a server error processing the file\n\nPlease copy and paste the relevant text content from this document, or describe what you need help with regarding this document, and I'll be happy to assist you.]`;
    }
  } catch (error) {
    console.error('Error reading file:', error);
    // Fallback to file info if reading fails
    const fileSizeKB = Math.round(file.size / 1024);
    return `Document: ${file.name}\nFile Size: ${fileSizeKB} KB\nType: ${file.type}\n\n[Document uploaded: ${file.name}. Unable to read file contents.]`;
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

async function sendChatMessage(
  message: string, 
  chatId: string | null, 
  context: any,
  onStreamChunk?: (chunk: string) => void
) {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }
  
  try {
    // Prepare file IDs for attachments (use the uploaded file IDs, not temp staged IDs)
    // context.files should contain files with real IDs after upload
    const fileIds = (context.files || [])
      .map((file: any) => {
        // Use the real uploaded file ID (from Firebase) if available
        // This will be set after upload in the merged file object
        return file.id; // This should be the Firebase upload ID
      })
      .filter(Boolean);
    
    console.log('Sending message with file IDs:', fileIds, 'from files:', context.files);
    
    // Get the first file's content for document parameter
    const firstFile = context.files && context.files.length > 0 ? context.files[0] : null;
    const documentContent = firstFile?.content || firstFile?.text || '';
    const documentNameValue = firstFile?.name || '';
    
    // Fetch chat details to get linkedCaseId
    let linkedCaseId: string | null = null;
    try {
      const chatResponse = await apiClient.get(`/api/chats/${chatId}`);
      linkedCaseId = chatResponse?.linkedCaseId || null;
      console.log('Fetched chat linkedCaseId:', linkedCaseId);
    } catch (error) {
      console.error('Error fetching chat details:', error);
      // Continue without linkedCaseId if fetch fails
    }

    // Fetch chat history BEFORE saving current message (so it excludes current message)
    let fetchedChatHistory: any[] = [];
    try {
      const historyResponse = await apiClient.get(`/api/chats/${chatId}/messages`);
      if (historyResponse && historyResponse.messages) {
        // Format chat history for AI (last 10 messages to avoid token limits)
        fetchedChatHistory = historyResponse.messages
          .slice(-10) // Get last 10 messages
          .map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
            timestamp: msg.timestamp
          }));
        
        console.log('Fetched chat history:', fetchedChatHistory.length, 'messages');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // Continue without history if fetch fails
    }
    
    // Send user message to API with file IDs (AFTER fetching history)
    await apiClient.post(`/api/chats/${chatId}/messages`, {
      role: 'user',
      content: message,
      files: fileIds // Send real file IDs from uploaded files
    });
    
    // Use streaming endpoint for better UX
    let fullResponse = '';
    let caseData: any = null;
    let actionType: string | null = null;
    let citations: any[] = [];
    let suggestions: string[] = [];
    
    try {
      // Get auth token for streaming request from Firebase
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated for streaming');
      }
      
      const token = await user.getIdToken();
      
      // Use streaming endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          chatHistory: fetchedChatHistory,
          chatId: context.chatId,
          context: {
            caseId: linkedCaseId || context.metadata?.caseId, // Prioritize linkedCaseId from chat
            draftId: context.metadata?.draftId,
            userId: context.userId,
            files: context.files || []
          },
          document: documentContent || undefined,
          documentName: documentNameValue || undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available for streaming');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                // Append chunk to full response and notify callback
                fullResponse += data.content;
                if (onStreamChunk) {
                  onStreamChunk(data.content);
                }
              } else if (data.type === 'complete') {
                // Final complete message with all metadata
                fullResponse = data.response || fullResponse;
                caseData = data.caseData;
                actionType = data.actionType;
                citations = data.citations || [];
                suggestions = data.suggestions || [];
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Streaming error');
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (streamError) {
      console.error('Streaming failed, falling back to regular API:', streamError);
      // Fallback to regular API if streaming fails
      const response = await apiClient.post('/api/chat', {
        message,
        chatHistory: fetchedChatHistory,
        chatId: context.chatId,
        context: {
          caseId: linkedCaseId || context.metadata?.caseId, // Prioritize linkedCaseId from chat
          draftId: context.metadata?.draftId,
          userId: context.userId,
          files: context.files || []
        },
        document: documentContent || undefined,
        documentName: documentNameValue || undefined
      });
      
      fullResponse = response.response;
      caseData = response.caseData;
      actionType = response.actionType;
      citations = response.citations || [];
      suggestions = response.suggestions || [];
    }
    
    // Save AI response to chat
    await apiClient.post(`/api/chats/${chatId}/messages`, {
      role: 'assistant',
      content: fullResponse,
      attachments: [],
      caseData: caseData,
      actionType: actionType
    });
    
    return {
      id: `msg_${Date.now()}`,
      type: 'ai',
      content: fullResponse,
      timestamp: new Date(),
      caseData: caseData,
      actionType: actionType,
      citations: citations,
      suggestions: suggestions,
      context
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}
