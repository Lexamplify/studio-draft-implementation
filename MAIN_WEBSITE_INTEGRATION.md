# Main Website Integration Guide

This guide shows how to integrate the Clerk session management with your main website to prevent login prompts.

## Quick Fix for Your Current Issue

The problem is that your main website is not properly activating the Clerk session after receiving the session token. Here's how to fix it:

### 1. Update Your Main Website Code

Replace your current `createClerkSession` function with this improved version:

```typescript
// In your main website
const createClerkSession = async (firebaseUser: any) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/generate-session', {
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
    
    // NEW: Activate the session
    const activateResponse = await fetch('http://localhost:3001/api/auth/activate-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken })
    });
    
    const { user } = await activateResponse.json();
    
    // NEW: Set the session in Clerk
    if (window.Clerk && window.Clerk.setSession) {
      await window.Clerk.setSession(sessionToken);
    }
    
    return { sessionToken, clerkUserId, user };
  } catch (error) {
    console.error('Failed to create Clerk session:', error);
    return null;
  }
};
```

### 2. Alternative: Use the Provided Utilities

Copy these files to your main website:
- `src/lib/clerk-session-manager.ts`
- `src/hooks/use-clerk-session.ts`
- `src/components/clerk-session-provider.tsx`

Then use it like this:

```typescript
import { useClerkSession } from './hooks/use-clerk-session';

function YourComponent() {
  const { activateSession, isAuthenticated, user } = useClerkSession();
  
  const handleLogin = async () => {
    const success = await activateSession(
      firebaseUser.uid,
      {
        email: firebaseUser.email,
        firstName: firebaseUser.displayName?.split(' ')[0],
        lastName: firebaseUser.displayName?.split(' ')[1],
        avatar: firebaseUser.photoURL,
      }
    );
    
    if (success) {
      console.log('User is now authenticated!');
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <div>Welcome, {user?.firstName}!</div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## Why This Fixes the Issue

1. **Session Activation**: The new code properly activates the session using Clerk's `setSession()` method
2. **User State**: It updates the user state so Clerk knows the user is authenticated
3. **Proper Flow**: It follows Clerk's recommended authentication flow

## Testing

1. Make sure your development server is running on port 3000
2. Test the API endpoints:
   ```bash
   # Test session creation
   curl -X POST http://localhost:3000/api/auth/generate-session \
     -H "Content-Type: application/json" \
     -d '{"externalUserId":"test123","externalUserData":{"email":"test@example.com","firstName":"Test","lastName":"User"}}'
   
   # Test session activation
   curl -X POST http://localhost:3000/api/auth/activate-session \
     -H "Content-Type: application/json" \
     -d '{"sessionToken":"clerk_user_user_123_1234567890"}'
   ```

## Environment Variables

Make sure you have these environment variables set in your `.env.local`:

```bash
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Troubleshooting

If you're still getting login prompts:

1. Check the browser console for errors
2. Verify that `window.Clerk` is available
3. Make sure the session token is being passed correctly
4. Check that the user is being set in Clerk's state

The key is to call `window.Clerk.setSession(sessionToken)` after creating the session to activate it properly.
