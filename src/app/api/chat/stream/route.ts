import { NextRequest } from 'next/server';
import { processChatMessage } from '@/ai/flows/chat-flow';
import { auth, db } from '@/lib/firebase-admin';

// Streaming chat endpoint using Server-Sent Events
export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { message, chatHistory, context, document, documentName, chatId } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch files for this chat if chatId is provided
    let chatFiles = [];
    if (chatId) {
      try {
        const filesSnapshot = await db
          .collection('users')
          .doc(uid)
          .collection('chats')
          .doc(chatId)
          .collection('files')
          .get();
        chatFiles = filesSnapshot.docs.map(doc => {
          const data = doc.data();
          let uploadedAt = data.uploadedAt;
          if (uploadedAt?.toDate) {
            uploadedAt = uploadedAt.toDate();
          } else if (uploadedAt && typeof uploadedAt === 'object' && uploadedAt._seconds) {
            uploadedAt = new Date(uploadedAt._seconds * 1000 + uploadedAt._nanoseconds / 1000000);
          }
          return {
            id: doc.id,
            name: data.name,
            type: data.type,
            size: data.size,
            url: data.url,
            path: data.path,
            uploadedAt: uploadedAt || new Date()
          };
        });
      } catch (error) {
        console.error('Error fetching chat files:', error);
      }
    }
    
    // Extract document content
    let documentContent = document;
    let documentNameValue = documentName;
    
    if (!documentContent && context?.files && context.files.length > 0) {
      const fileWithContent = context.files.find((f: any) => f.content || f.text);
      if (fileWithContent) {
        documentContent = fileWithContent.content || fileWithContent.text || '';
        documentNameValue = documentNameValue || fileWithContent.name || '';
      }
    }

    // Fetch case documents and full case metadata if this is a case-scoped chat
    let documentContext: Array<{docId: string, fileName: string, summary: string}> = [];
    let caseName: string | undefined;
    let caseMetadata: any = undefined;
    
    if (context?.caseId && uid) {
      try {
        // Fetch full case data (including details with caseNumber, caseType, etc.)
        const caseDoc = await db
          .collection('users')
          .doc(uid)
          .collection('cases')
          .doc(context.caseId)
          .get();
        
        if (caseDoc.exists) {
          const caseData = caseDoc.data();
          caseName = caseData?.caseName;
          
          // Include full case metadata so AI knows about caseNumber, caseType, etc.
          caseMetadata = {
            caseName: caseData?.caseName,
            tags: caseData?.tags || [],
            details: {
              caseNumber: caseData?.details?.caseNumber,
              caseType: caseData?.details?.caseType,
              courtName: caseData?.details?.courtName,
              petitionerName: caseData?.details?.petitionerName,
              respondentName: caseData?.details?.respondentName,
              judgeName: caseData?.details?.judgeName,
              filingDate: caseData?.details?.filingDate,
              nextHearingDate: caseData?.details?.nextHearingDate,
              status: caseData?.details?.status,
              jurisdiction: caseData?.details?.jurisdiction,
              caseCategory: caseData?.details?.caseCategory,
            }
          };
          
          // Fetch case documents
          const documentsSnapshot = await db
            .collection('users')
            .doc(uid)
            .collection('cases')
            .doc(context.caseId)
            .collection('documents')
            .get();
          
          documentContext = documentsSnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
              docId: doc.id,
              fileName: docData.name || docData.fileName || 'Unknown Document',
              summary: docData.summary || docData.description || `Document: ${docData.name || 'Unknown'}`,
            };
          });
          
          console.log('[Stream API] Fetched case data and documents:', {
            caseName,
            metadata: caseMetadata,
            documentCount: documentContext.length
          });
        }
      } catch (error) {
        console.error('[Stream API] Error fetching case data:', error);
        // Continue without document context if fetch fails
      }
    }

    // Convert Firestore timestamps to ISO strings
    const processedChatHistory = chatHistory?.map((msg: any) => {
      let timestamp = msg.timestamp;
      if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
        const date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
        timestamp = date.toISOString();
      } else if (timestamp?.toDate) {
        timestamp = timestamp.toDate().toISOString();
      } else if (timestamp instanceof Date) {
        timestamp = timestamp.toISOString();
      }
      return {
        ...msg,
        timestamp
      };
    });

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: 'processing' })}\n\n`));

          // Process chat message and stream the response
          const response = await processChatMessage({
            message,
            chatHistory: processedChatHistory,
            context: {
              ...context,
              caseName: caseName, // Add case name if available
              caseMetadata: caseMetadata, // Add full case metadata (caseNumber, caseType, etc.)
              documentContext: documentContext.length > 0 ? documentContext : undefined, // Add document context if available
              userId: uid,
              files: chatFiles,
            },
            document: documentContent,
            documentName: documentNameValue,
          });

          // Stream the response text character by character for smooth typing effect
          const responseText = response.response || '';
          
          // Send chunks progressively (character by character for smooth effect)
          for (let i = 0; i < responseText.length; i++) {
            const char = responseText[i];
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'chunk', 
                content: char 
              })}\n\n`)
            );
            // Small delay for smooth streaming effect (adjust for speed)
            // Character-by-character gives smoother effect than word-by-word
            await new Promise(resolve => setTimeout(resolve, 15));
          }

          // Send final data (caseData, actionType, etc.)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              response: responseText,
              caseData: response.caseData,
              actionType: response.actionType,
              citations: response.citations,
              suggestions: response.suggestions
            })}\n\n`)
          );

        } catch (error) {
          console.error('[Stream API] Error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Failed to process message'
            })}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for nginx
      },
    });
  } catch (error) {
    console.error('Error in streaming chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
