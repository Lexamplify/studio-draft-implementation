# Clerk Integration Guide

This guide shows how to integrate the document editor with your main website using Clerk authentication directly.

## Overview

The new flow is much simpler:
1. **Main Website**: Uses Clerk authentication
2. **Document Editor**: Receives Clerk session token and verifies it
3. **No Firebase**: Direct Clerk-to-Clerk integration

## Main Website Setup

### 1. Install Clerk in Your Main Website

```bash
npm install @clerk/nextjs
```

### 2. Configure Clerk

Create `.env.local` in your main website:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 3. Set Up Clerk Provider

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 4. Create Authentication Pages

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return <SignIn />
}

// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return <SignUp />
}
```

### 5. Open Document Editor

```typescript
// components/DocumentEditor.tsx
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function DocumentEditor({ documentId }: { documentId: string }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const openEditor = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      // Get the session token
      const sessionToken = await getToken();
      
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      // Open document editor with session token
      const editorUrl = `http://localhost:3001/documents/${documentId}?token=${sessionToken}`;
      window.open(editorUrl, '_blank');
    } catch (error) {
      console.error('Failed to open editor:', error);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <button onClick={() => router.push('/sign-in')}>
        Sign in to edit document
      </button>
    );
  }

  return (
    <div>
      <h2>Welcome, {user.firstName}!</h2>
      <button onClick={openEditor}>
        Open Document Editor
      </button>
    </div>
  );
}
```

## Document Editor Setup

### 1. Environment Variables

Create `.env.local` in your document editor:

```bash
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_MAIN_WEBSITE_URL=http://localhost:3000
```

### 2. Update Middleware

The middleware will automatically:
- Check for session token in URL
- Verify token with Clerk
- Redirect to main website if invalid
- Add user info to headers

### 3. Use Authentication in Components

```typescript
// In any component
import { useClerkAuth } from '@/components/clerk-auth-provider';

export function MyComponent() {
  const { user, isAuthenticated, isLoading } = useClerkAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h2>Welcome, {user?.firstName}!</h2>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

## API Endpoints

### 1. Verify Clerk Session
- **Endpoint**: `POST /api/auth/verify-clerk-session`
- **Purpose**: Verify a Clerk session token
- **Body**: `{ "sessionToken": "clerk_session_..." }`
- **Response**: User information and verification status

## Benefits of This Approach

1. **Simplified Flow**: No Firebase → Clerk conversion needed
2. **Better Security**: Direct Clerk session verification
3. **Easier Maintenance**: Single authentication system
4. **Better UX**: Seamless authentication experience
5. **Real-time Updates**: Clerk handles session management

## Testing

1. **Start both servers**:
   ```bash
   # Main website (port 3000)
   npm run dev
   
   # Document editor (port 3001)
   npm run dev
   ```

2. **Test the flow**:
   - Sign in to main website
   - Click "Open Document Editor"
   - Should open editor with user authenticated

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure CORS headers are set correctly
2. **Session Token Issues**: Verify Clerk configuration
3. **Redirect Loops**: Check middleware logic
4. **User Not Found**: Verify user exists in Clerk

### Debug Steps:

1. Check browser console for errors
2. Verify session token in URL
3. Check server logs for authentication errors
4. Test API endpoints directly

## Migration from Firebase

If you're migrating from Firebase:

1. **Export user data** from Firebase
2. **Import users** to Clerk (or let them re-register)
3. **Update main website** to use Clerk
4. **Remove Firebase** authentication code
5. **Test thoroughly** before going live

This new flow is much cleaner and more maintainable!
