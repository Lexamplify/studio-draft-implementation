import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from "@/lib/firebase-admin-editor";
import { getDocumentByIdServer } from "@/lib/firebase-document-service-server";

// Initialize Liveblocks with error handling
let liveblocks: Liveblocks | null = null;

function getLiveblocksClient() {
  if (liveblocks) {
    return liveblocks;
  }

  const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;
  
  if (!secretKey) {
    console.error("❌ LIVEBLOCKS_SECRET_KEY is not set in environment variables");
    throw new Error("Liveblocks secret key is not configured");
  }

  // Clean the secret key (remove whitespace, quotes, etc.)
  const cleanedKey = secretKey.trim().replace(/^["']|["']$/g, '');

  // Validate key format (should start with sk_ or sk_live_)
  if (!cleanedKey.startsWith('sk_')) {
    console.error("❌ Invalid Liveblocks secret key format. Key should start with 'sk_' or 'sk_live_'");
    console.error("   Key starts with:", cleanedKey.substring(0, 10) + "...");
    throw new Error("Invalid Liveblocks secret key format");
  }

  console.log("🔑 Initializing Liveblocks with key starting with:", cleanedKey.substring(0, 10) + "...");

  try {
    liveblocks = new Liveblocks({
      secret: cleanedKey,
    });
    console.log("✅ Liveblocks client initialized successfully");
    return liveblocks;
  } catch (error: any) {
    console.error("❌ Failed to initialize Liveblocks:", error);
    console.error("   Error message:", error?.message);
    throw new Error("Invalid Liveblocks secret key. Please check your LIVEBLOCKS_SECRET_KEY in .env.local");
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Liveblocks client
    const liveblocksClient = getLiveblocksClient();

    // Get Authorization header with Firebase ID token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("❌ No authorization header found");
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase ID token
    let decodedToken: any;
    
    if (!adminAuth) {
      // DEVELOPMENT ONLY: Skip token verification if Firebase Admin is not set up
      // ⚠️ WARNING: This is INSECURE and should only be used for development
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ WARNING: Firebase Admin not initialized. Using UNSECURE token parsing (development only)");
        console.warn("⚠️ Please set up Firebase Admin credentials for production security");
        
        try {
          // Parse the JWT token without verification (INSECURE!)
          const parts = token.split('.');
          if (parts.length !== 3) {
            throw new Error("Invalid token format");
          }
          
          // Decode the payload (second part)
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          // Use decoded payload (not verified!)
          decodedToken = {
            uid: payload.sub || payload.user_id,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          };
          
          console.warn("⚠️ Using unverified token for user:", decodedToken.email);
        } catch (error) {
          console.error("❌ Failed to parse token:", error);
          return NextResponse.json({ error: "Invalid token format" }, { 
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          });
        }
      } else {
        // Production: Require Firebase Admin
        console.error("❌ Firebase Admin not initialized");
        return NextResponse.json({ error: "Server configuration error" }, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
    } else {
      // Secure token verification
      decodedToken = await adminAuth.verifyIdToken(token);
      
      if (!decodedToken) {
        console.log("❌ Invalid Firebase token");
        return NextResponse.json({ error: "Unauthorized" }, { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
    }

    const { room } = await req.json();
    console.log("🔍 Liveblocks auth request for room:", room);
    console.log("👤 User:", { id: decodedToken.uid, email: decodedToken.email });

    // Get document from Firebase (skip ownership check in development if Admin not set up)
    let document = await getDocumentByIdServer(room);
    let isOwner = false;

    if (!document && process.env.NODE_ENV === 'development' && !adminAuth) {
      // DEVELOPMENT ONLY: Skip document check if Firebase Admin is not set up
      console.warn("⚠️ WARNING: Skipping document ownership check (development only)");
      console.warn("⚠️ This allows access to any document - INSECURE for production!");
      isOwner = true; // Allow access
    } else if (!document) {
      console.log("❌ Document not found:", room);
      return NextResponse.json({ error: "Document not found" }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } else {
      console.log("📄 Document found:", { 
        id: document.id, 
        ownerId: document.ownerId, 
      });

      // Check if user is the owner
      isOwner = document.ownerId === decodedToken.uid;

      console.log("🔐 Access check:", { 
        isOwner, 
        userId: decodedToken.uid,
        ownerId: document.ownerId 
      });

      if (!isOwner) {
        console.log("❌ Access denied - user is not the owner");
        return NextResponse.json({ error: "Unauthorized" }, { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
    }

    const name = decodedToken.name || decodedToken.email || "Anonymous";
    const nameToNumber = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = Math.abs(nameToNumber) % 360;
    const color = `hsl(${hue}, 80%, 60%)`;
    
    console.log("✅ Access granted, creating Liveblocks session for:", name);
    console.log("🔑 Preparing session with userId:", decodedToken.uid, "room:", room);
    
    try {
      const session = liveblocksClient.prepareSession(decodedToken.uid, {
        userInfo: {
          name,
          avatar: decodedToken.picture || "",
          color,
        },
      });
      
      console.log("🔐 Allowing room access:", room);
      session.allow(room, session.FULL_ACCESS);
      
      console.log("📤 Authorizing session with Liveblocks API...");
      const { body, status } = await session.authorize();

      console.log("🎉 Liveblocks session authorized successfully, status:", status);
      return new NextResponse(body, { 
        status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } catch (sessionError: any) {
      console.error("❌ Liveblocks session error:", sessionError);
      console.error("Error details:", {
        message: sessionError?.message,
        code: sessionError?.code,
        status: sessionError?.status,
        stack: sessionError?.stack,
      });
      throw sessionError;
    }
  } catch (error: any) {
    console.error("❌ Liveblocks auth error:", error);
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error status:", error?.status);
    
    // If it's a Liveblocks-specific error, provide more details
    if (error?.message?.includes('Forbidden') || error?.status === 403) {
      console.error("🔒 Liveblocks returned Forbidden. Possible causes:");
      console.error("   1. Invalid LIVEBLOCKS_SECRET_KEY");
      console.error("   2. Secret key doesn't match the Liveblocks project");
      console.error("   3. Room ID format is invalid");
      console.error("   4. Account doesn't have access to this project");
    }
    
    // Return a proper JSON error response
    const errorMessage = error?.message || "Internal Server Error";
    const statusCode = error?.status || 500;
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        type: error?.constructor?.name,
        code: error?.code,
        status: error?.status,
      } : undefined,
    }, { 
      status: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
    });
  }
}
