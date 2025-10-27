"use client";

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
  } | null;
}

export default function DocumentViewer({ isOpen, onClose, file }: DocumentViewerProps) {
  if (!isOpen || !file) return null;

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'filePdf';
    if (type.includes('word') || type.includes('document')) return 'fileWord';
    if (type.includes('image')) return 'image';
    return 'file';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name={getFileIcon(file.type)} className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(file.url, '_blank')}
              className="text-gray-400 hover:text-blue-600"
              title="Open in new tab"
            >
              <Icon name="externalLink" className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="x" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="h-full">
              <iframe
                src={file.url}
                className="w-full h-full border-0"
                title={file.name}
                onError={(e) => {
                  // Fallback if iframe fails
                  const iframe = e.currentTarget;
                  iframe.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'flex items-center justify-center h-full p-8 text-center';
                  fallback.innerHTML = `
                    <div>
                      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                      </div>
                      <h3 class="text-lg font-medium text-gray-900 mb-2">Unable to display PDF</h3>
                      <p class="text-gray-500 mb-4">This PDF cannot be displayed in the browser.</p>
                      <button 
                        onclick="window.open('${file.url}', '_blank')" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Open in new tab
                      </button>
                    </div>
                  `;
                  iframe.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name={getFileIcon(file.type)} className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h3>
                <p className="text-gray-500 mb-4">
                  This file type cannot be previewed in the browser.
                </p>
                <Button
                  onClick={() => window.open(file.url, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Icon name="externalLink" className="w-4 h-4 mr-2" />
                  Open in new tab
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
