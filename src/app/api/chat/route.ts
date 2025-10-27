import { NextRequest, NextResponse } from 'next/server';
import { processChatMessage } from '@/ai/flows/chat-flow';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { message, chatHistory, context, document, documentName, chatId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch files for this chat if chatId is provided
    let chatFiles = [];
    if (chatId) {
      try {
        const filesSnapshot = await db.collection('chats').doc(chatId).collection('files').get();
        chatFiles = filesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate() || new Date()
        }));
        console.log('Fetched chat files:', chatFiles);
      } catch (error) {
        console.error('Error fetching chat files:', error);
        // Continue without files if there's an error
      }
    }

    // Convert Firestore timestamps to ISO strings for AI processing
    const processedChatHistory = chatHistory?.map((msg: any) => {
      let timestamp = msg.timestamp;
      
      // Handle Firebase Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
        // Convert Firebase Timestamp to JavaScript Date
        const date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
        timestamp = date.toISOString();
      } else if (timestamp?.toDate) {
        // Handle Firestore Timestamp objects with toDate method
        timestamp = timestamp.toDate().toISOString();
      } else if (timestamp instanceof Date) {
        // Handle JavaScript Date objects
        timestamp = timestamp.toISOString();
      }
      
      return {
        ...msg,
        timestamp
      };
    });

    // Process the chat message with AI
    const response = await processChatMessage({
      message,
      chatHistory: processedChatHistory,
      context: {
        ...context,
        userId: uid,
        files: chatFiles, // Include chat files in context
      },
      document,
      documentName,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
