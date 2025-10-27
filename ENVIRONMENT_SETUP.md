# Environment Variables Setup for Iframe Integration

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google Docs Editor URL
# This should point to your deployed Google Docs editor instance
NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL=http://localhost:3001

# For production, use your actual domain:
# NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL=https://your-editor-domain.com

# Firebase Configuration (already configured in your project)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Development Setup

1. **Local Development**:
   ```bash
   # In your .env.local
   NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL=http://localhost:3001
   ```

2. **Production Setup**:
   ```bash
   # In your production environment
   NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL=https://your-editor-domain.com
   ```

## Testing the Integration

1. **Start your main application**:
   ```bash
   npm run dev
   # Runs on http://localhost:3000
   ```

2. **Start your Google Docs editor** (separate project):
   ```bash
   # In your google-docs editor project
   npm run dev
   # Should run on http://localhost:3001
   ```

3. **Test the integration**:
   - Visit `http://localhost:3000/draft`
   - You should see the home page with document options
   - Click on any document option to open the editor in an iframe

## URL Structure

- **Home page**: `http://localhost:3000/draft`
- **Document editor**: `http://localhost:3000/draft?doc=document-id`

## Troubleshooting

### If iframe doesn't load:
1. Check that `NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL` is set correctly
2. Verify your editor is running on the specified port
3. Check browser console for CORS errors
4. Ensure your editor allows iframe embedding

### If authentication fails:
1. Make sure your editor handles authentication properly
2. Check that the editor URL is accessible
3. Verify CORS settings in your editor

### If messages don't pass between iframe and parent:
1. Check that the editor URL matches `NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL`
2. Verify message event origins are correct
3. Check browser console for message errors
