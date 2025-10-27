// app/page.js - Main Page with Document Editor Integration
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useState } from 'react';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);

  const openDocumentEditor = async (documentId) => {
    if (!user) {
      // Redirect to sign in
      window.location.href = '/sign-in';
      return;
    }

    setIsOpeningEditor(true);
    
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
      alert('Failed to open document editor. Please try again.');
    } finally {
      setIsOpeningEditor(false);
    }
  };

  const createNewDocument = async () => {
    if (!user) {
      window.location.href = '/sign-in';
      return;
    }

    // Generate a new document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await openDocumentEditor(documentId);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Document Editor
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sign in to start creating and editing documents with our powerful editor.
          </p>
          <div className="space-y-4">
            <a
              href="/sign-in"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600">
          Ready to create some amazing documents?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Document */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Document</h3>
            <p className="text-sm text-gray-500 mb-4">Start with a blank document</p>
            <button
              onClick={createNewDocument}
              disabled={isOpeningEditor}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOpeningEditor ? 'Opening...' : 'Create Document'}
            </button>
          </div>
        </div>

        {/* Sample Documents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sample Document</h3>
            <p className="text-sm text-gray-500 mb-4">Try our editor with a sample</p>
            <button
              onClick={() => openDocumentEditor('sample-doc-123')}
              disabled={isOpeningEditor}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOpeningEditor ? 'Opening...' : 'Open Sample'}
            </button>
          </div>
        </div>

        {/* Template Gallery */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100 mb-4">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Templates</h3>
            <p className="text-sm text-gray-500 mb-4">Choose from templates</p>
            <button
              onClick={() => openDocumentEditor('template-gallery')}
              disabled={isOpeningEditor}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOpeningEditor ? 'Opening...' : 'Browse Templates'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Documents</h2>
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">No recent documents yet. Create your first document to get started!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
