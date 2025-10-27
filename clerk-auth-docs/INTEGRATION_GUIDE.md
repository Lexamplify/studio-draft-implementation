# Google Docs Clone - External Integration Guide

This guide explains how to integrate the Google Docs clone with your main website using Clerk as the single authentication system.

## Overview

The integration allows you to:
1. Use Clerk authentication across both applications
2. Embed the document editor in your main website via iframe
3. Sync documents between your main database and the editor
4. Maintain real-time collaboration features

## Architecture

```
Your Main Website (Firebase Auth) 
    ↓ (Generate Clerk Session)
Google Docs Clone (Clerk Auth)
    ↓ (Iframe Embed)
Document Editor
```

## Setup Instructions

### 1. Environment Configuration

Update your `.env.local` file with the following variables:

```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Liveblocks Configuration
LIVEBLOCKS_SECRET_KEY=your-liveblocks-secret-key

# External Integration
MAIN_WEBSITE_URL=https://your-main-website.com
WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 2. Deploy the Google Docs Clone

1. Deploy your Google Docs clone to a hosting service (Vercel, Netlify, etc.)
2. Update the `MAIN_WEBSITE_URL` in your environment variables
3. Ensure CORS is configured to allow your main website domain

### 3. Integration in Your Main Website

#### A. Create Clerk Session from Your User Data

```typescript
// In your main website
const createClerkSession = async (firebaseUser: any) => {
  try {
    const response = await fetch('https://your-docs-editor.com/api/auth/generate-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalUserId: firebaseUser.uid,
        externalUserData: {
          email: firebaseUser.email,
          firstName: firebaseUser.displayName?.split(' ')[0],
          lastName: firebaseUser.displayName?.split(' ')[1],
          avatar: firebaseUser.photoURL,
        }
      })
    });

    const { sessionToken, clerkUserId } = await response.json();
    return { sessionToken, clerkUserId };
  } catch (error) {
    console.error('Failed to create Clerk session:', error);
    return null;
  }
};
```

#### B. Open Document Editor

```typescript
// In your main website
const openDocumentEditor = async (documentId: string) => {
  const firebaseUser = getAuth().currentUser;
  if (!firebaseUser) {
    // Redirect to login
    return;
  }

  // Create Clerk session
  const clerkSession = await createClerkSession(firebaseUser);
  if (!clerkSession) {
    console.error('Failed to create Clerk session');
    return;
  }

  // Open editor in iframe
  const iframe = document.createElement('iframe');
  iframe.src = `https://your-docs-editor.com/embed/${documentId}?token=${clerkSession.sessionToken}`;
  iframe.style.width = '100%';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  
  // Listen for events from iframe
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://your-docs-editor.com') return;
    
    switch (event.data.type) {
      case 'CLOSE_EDITOR':
        iframe.remove();
        break;
      case 'DOCUMENT_SAVED':
        // Handle document save in your main database
        saveDocumentToMainDB(documentId, event.data.content);
        break;
    }
  });
  
  document.body.appendChild(iframe);
};
```

#### C. Document Synchronization

```typescript
// In your main website - API endpoint to receive document updates
export async function POST(req: Request) {
  try {
    const { documentId, content, clerkUserId } = await req.json();
    
    // Verify the request (you can add your own verification logic)
    
    // Update document in your main database
    await updateDocumentInMainDB(documentId, content);
    
    return Response.json({ success: true });
  } catch (error) {
    return new Response("Sync failed", { status: 500 });
  }
}
```

## API Endpoints

### 1. Generate Clerk Session
- **Endpoint**: `POST /api/auth/generate-session`
- **Purpose**: Create a Clerk session from external user data
- **Body**: 
  ```json
  {
    "externalUserId": "string",
    "externalUserData": {
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "avatar": "string"
    }
  }
  ```

### 2. External Document Access
- **Endpoint**: `GET /api/documents/external?id={documentId}`
- **Purpose**: Get document data for external access
- **Headers**: Requires Clerk authentication

### 3. Document Synchronization
- **Endpoint**: `POST /api/documents/sync`
- **Purpose**: Sync document content between systems
- **Body**:
  ```json
  {
    "documentId": "string",
    "content": "string",
    "externalDocumentId": "string",
    "externalSyncUrl": "string"
  }
  ```

### 4. Embed Page
- **Endpoint**: `GET /embed/{documentId}?token={sessionToken}`
- **Purpose**: Iframe-embeddable document editor
- **Parameters**: 
  - `documentId`: Convex document ID
  - `token`: Clerk session token

## Security Considerations

1. **CORS Configuration**: Ensure your editor domain allows requests from your main website
2. **Token Validation**: Always validate Clerk session tokens
3. **Document Access Control**: Users can only access documents they own or have organization access to
4. **HTTPS**: Use HTTPS for all communications

## Features Supported

- ✅ Real-time collaboration via Liveblocks
- ✅ Document creation and editing
- ✅ Organization-based access control
- ✅ Document synchronization
- ✅ Iframe embedding
- ✅ Clerk authentication
- ✅ Legal AI integration
- ✅ Template system

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your main website domain is allowed in CORS settings
2. **Authentication Failures**: Check that Clerk session tokens are valid
3. **Document Access Denied**: Verify user has proper permissions
4. **Sync Failures**: Check that external sync URLs are accessible

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Support

For issues or questions regarding the integration, please check the logs and ensure all environment variables are properly configured.




