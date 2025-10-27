# Iframe Integration Test Guide

## Quick Test Steps

### 1. Environment Setup
Create a `.env.local` file in your project root with :
```bash
NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL=http://localhost:3001
```

### 2. Start Your Applications

**Main Application** (this project) :
```bash
npm run dev
# Should run on http://localhost:3000
```

**Google Docs Editor** (separate project):
```bash
# In your google-docs editor project directory
npm run dev
# Should run on http://localhost:3001
```

### 3. Test the Integration

1. **Visit the draft page**: `http://localhost:3000/draft`
2. **You should see**: A home page with three document options:
   - Sample Document
   - New Document  
   - Template

3. **Click on any option**: This should open the editor in an iframe
4. **URL should change to**: `http://localhost:3000/draft?doc=document-id`

### 4. Test Navigation

1. **Close the editor**: Click the "Close" button
2. **Should return to**: Home page with URL `http://localhost:3000/draft`

### 5. Test Direct URL Access

1. **Visit directly**: `http://localhost:3000/draft?doc=sample-doc-123`
2. **Should show**: Editor iframe directly (skipping home page)

## Expected Behavior

### ✅ Working Correctly
- Home page displays with document options
- Clicking options opens editor in iframe
- URL updates when opening/closing editor
- Direct URL access works
- Close button returns to home page
- Loading states display properly

### ❌ Common Issues

**Iframe doesn't load**:
- Check `NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL` is set
- Verify editor is running on port 3001
- Check browser console for errors

**Authentication issues**:
- Editor should handle its own authentication
- Check if editor requires specific auth setup

**CORS errors**:
- Check Next.js config headers
- Verify editor allows iframe embedding

## Debug Information

### Console Messages
The integration sends these message types:
- `DOCUMENT_SAVED`: When document is saved
- `DOCUMENT_CLOSED`: When editor is closed
- `AUTHENTICATION_REQUIRED`: When user needs to sign in
- `EDITOR_LOADED`: When editor finishes loading
- `EDITOR_ERROR`: When editor encounters an error

### Network Requests
Check that:
- Editor URL is accessible
- No CORS errors in network tab
- Iframe loads without errors

## Production Testing

1. **Deploy your editor** to a domain (e.g., Vercel, Netlify)
2. **Update environment variable**:
   ```bash
   NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL=https://your-editor-domain.com
   ```
3. **Deploy your main app** with the updated environment variable
4. **Test the same steps** with production URLs

## Troubleshooting Commands

```bash
# Check if editor is running
curl http://localhost:3001

# Check if main app is running  
curl http://localhost:3000

# Check environment variables
echo $NEXT_PUBLIC_GOOGLE_DOCS_EDITOR_URL
```

## Success Criteria

- [ ] Home page loads correctly
- [ ] Document options are clickable
- [ ] Editor opens in iframe
- [ ] URL updates properly
- [ ] Close button works
- [ ] Direct URL access works
- [ ] No console errors
- [ ] Loading states work
- [ ] Error handling works
