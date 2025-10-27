# Iframe Integration Guide

This guide shows how to integrate the document editor with your main website using a simple iframe approach with a home page.

## Overview

The main website shows a home page by default, and only displays the document editor when there's a document ID in the query parameters.

## Flow

1. **Main Website**: Shows home page by default
2. **Query Parameter**: When `?doc=document-id` is present, shows document editor
3. **Document Editor**: Handles Clerk authentication internally
4. **User Experience**: Seamless navigation between home and editor

## Main Website Integration

### 1. Home Page with Conditional Document Editor

The main website shows a home page by default and only displays the document editor when there's a document ID in the URL.

```html
<!-- Home page by default -->
<div id="homePage">
  <h1>Welcome to Document Editor</h1>
  <p>Create, edit, and collaborate on documents</p>
  <button onclick="openDocument('sample-doc-123')">Open Document</button>
</div>

<!-- Document editor (hidden by default) -->
<div id="documentEditor" style="display: none;">
  <iframe 
    src="http://localhost:3001/embed/your-document-id"
    width="100%" 
    height="600px"
    frameborder="0">
  </iframe>
</div>
```

### 2. URL-based Navigation

- **Home page**: `http://localhost:3000/`
- **Document editor**: `http://localhost:3000/?doc=document-id`

### 3. JavaScript Implementation

```javascript
// Check for document ID in URL on page load
window.addEventListener('load', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('doc');
  
  if (docId) {
    openDocument(docId);
  }
});

function openDocument(docId) {
  // Show document editor
  document.getElementById('homePage').style.display = 'none';
  document.getElementById('documentEditor').style.display = 'block';
  
  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('doc', docId);
  window.history.pushState({}, '', url);
  
  // Load iframe
  const iframe = document.getElementById('editorIframe');
  iframe.src = `http://localhost:3001/embed/${docId}`;
}

function goHome() {
  // Clear URL parameters
  const url = new URL(window.location);
  url.searchParams.delete('doc');
  window.history.pushState({}, '', url);
  
  // Show home page
  document.getElementById('documentEditor').style.display = 'none';
  document.getElementById('homePage').style.display = 'block';
}
```

### 2. React Component Integration

```jsx
// components/DocumentEditor.jsx
import { useState, useRef } from 'react';

export function DocumentEditor({ documentId, onClose }) {
  const iframeRef = useRef(null);

  const handleMessage = (event) => {
    // Handle messages from the iframe
    if (event.origin !== 'http://localhost:3001') return;
    
    switch (event.data.type) {
      case 'DOCUMENT_SAVED':
        console.log('Document saved:', event.data.content);
        break;
      case 'DOCUMENT_CLOSED':
        onClose?.();
        break;
      case 'AUTHENTICATION_REQUIRED':
        console.log('User needs to sign in');
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="document-editor-container">
      <div className="editor-header">
        <h2>Document Editor</h2>
        <button onClick={onClose}>Close</button>
      </div>
      <iframe
        ref={iframeRef}
        src={`http://localhost:3001/embed/${documentId}`}
        width="100%"
        height="600px"
        frameBorder="0"
        allowFullScreen
        title="Document Editor"
      />
    </div>
  );
}
```

### 3. Full Page Integration

```jsx
// pages/document/[id].jsx
import { DocumentEditor } from '../components/DocumentEditor';

export default function DocumentPage({ params }) {
  const { id } = params;

  return (
    <div className="min-h-screen">
      <DocumentEditor 
        documentId={id} 
        onClose={() => window.history.back()} 
      />
    </div>
  );
}
```

## Document Editor Setup

### 1. Environment Variables

Make sure your document editor has these environment variables:

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/documents
```

### 2. Clerk Configuration

The document editor will handle authentication automatically:

- Users will be redirected to sign-in if not authenticated
- After sign-in, they'll be redirected back to the document
- All authentication state is managed within the iframe

### 3. CORS Configuration

Update your `next.config.js` to allow iframe embedding:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:3000 https://yourdomain.com",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Communication Between Main Website and Iframe

### 1. Send Messages to Iframe

```javascript
// From main website to iframe
const iframe = document.getElementById('document-editor');
iframe.contentWindow.postMessage({
  type: 'SAVE_DOCUMENT',
  data: { content: 'document content' }
}, 'http://localhost:3001');
```

### 2. Listen for Messages from Iframe

```javascript
// In main website
window.addEventListener('message', (event) => {
  if (event.origin !== 'http://localhost:3001') return;
  
  switch (event.data.type) {
    case 'DOCUMENT_SAVED':
      // Handle document save
      console.log('Document saved:', event.data);
      break;
    case 'DOCUMENT_CLOSED':
      // Handle document close
      console.log('Document closed');
      break;
    case 'AUTHENTICATION_REQUIRED':
      // Handle authentication requirement
      console.log('User needs to sign in');
      break;
  }
});
```

### 3. Send Messages from Iframe

```javascript
// In document editor (iframe)
// Send message to parent window
window.parent.postMessage({
  type: 'DOCUMENT_SAVED',
  data: { content: 'saved content', documentId: 'doc-123' }
}, 'http://localhost:3000');
```

## Styling the Iframe

### 1. Responsive Iframe

```css
.document-editor-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.document-editor-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}
```

### 2. Loading State

```jsx
const [isLoading, setIsLoading] = useState(true);

return (
  <div className="document-editor-container">
    {isLoading && (
      <div className="loading-overlay">
        <div className="spinner">Loading...</div>
      </div>
    )}
    <iframe
      src={`http://localhost:3001/embed/${documentId}`}
      onLoad={() => setIsLoading(false)}
      style={{ display: isLoading ? 'none' : 'block' }}
    />
  </div>
);
```

## Security Considerations

### 1. Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src 'self' http://localhost:3001;">
```

### 2. X-Frame-Options

Make sure your document editor allows iframe embedding:

```javascript
// In your document editor
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
```

## Testing

### 1. Local Development

1. Start document editor: `npm run dev` (port 3001)
2. Start main website: `npm run dev` (port 3000)
3. Open main website and test iframe integration

### 2. Production Deployment

1. Deploy document editor to your domain
2. Update iframe src to production URL
3. Update CORS settings for production domain

## Benefits of This Approach

1. **Simple Integration**: Just embed an iframe
2. **Independent Authentication**: Document editor handles its own auth
3. **Easy Maintenance**: No complex session management
4. **Secure**: Authentication happens within the iframe
5. **Flexible**: Easy to customize and extend

## Troubleshooting

### Common Issues:

1. **Iframe not loading**: Check CORS settings
2. **Authentication not working**: Verify Clerk configuration
3. **Messages not passing**: Check origin validation
4. **Styling issues**: Check iframe dimensions and CSS

### Debug Steps:

1. Check browser console for errors
2. Verify iframe src URL is correct
3. Test authentication flow in iframe directly
4. Check network requests in dev tools

This approach is much simpler and more maintainable than complex session token passing!
