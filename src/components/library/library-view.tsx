"use client";

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface LibraryDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  sourceChat?: {
    id: string;
    title: string;
  };
  sourceCase?: {
    id: string;
    caseName: string;
  };
}

export default function LibraryView() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [filteredDocuments, setFilteredDocuments] = useState<LibraryDocument[]>([]);

  // Mock data for now - in real implementation, fetch from API
  useEffect(() => {
    const mockDocuments: LibraryDocument[] = [
      {
        id: '1',
        name: 'Contract Agreement.pdf',
        type: 'pdf',
        size: 1024000,
        url: '#',
        uploadedAt: new Date('2024-01-15'),
        sourceChat: { id: 'chat1', title: 'Contract Review' }
      },
      {
        id: '2',
        name: 'Court Order.docx',
        type: 'docx',
        size: 512000,
        url: '#',
        uploadedAt: new Date('2024-01-14'),
        sourceCase: { id: 'case1', caseName: 'State vs. John Doe' }
      },
      {
        id: '3',
        name: 'Evidence Photo.jpg',
        type: 'jpg',
        size: 2048000,
        url: '#',
        uploadedAt: new Date('2024-01-13'),
        sourceChat: { id: 'chat2', title: 'Evidence Analysis' }
      },
      {
        id: '4',
        name: 'Legal Brief.pdf',
        type: 'pdf',
        size: 1536000,
        url: '#',
        uploadedAt: new Date('2024-01-12'),
        sourceCase: { id: 'case2', caseName: 'Property Dispute' }
      }
    ];

    setDocuments(mockDocuments);
    setLoading(false);
  }, []);

  // Filter documents based on search and filters
  useEffect(() => {
    let filtered = documents;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sourceChat?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sourceCase?.caseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // File type filter
    if (selectedFileType !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedFileType);
    }

    // Source filter
    if (selectedSource === 'chats') {
      filtered = filtered.filter(doc => doc.sourceChat);
    } else if (selectedSource === 'cases') {
      filtered = filtered.filter(doc => doc.sourceCase);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedFileType, selectedSource]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'fileText';
      case 'docx':
      case 'doc':
        return 'fileText';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      case 'mp4':
      case 'avi':
        return 'video';
      case 'mp3':
      case 'wav':
        return 'music';
      case 'xlsx':
      case 'xls':
        return 'fileSpreadsheet';
      case 'pptx':
      case 'ppt':
        return 'filePresentation';
      default:
        return 'file';
    }
  };

  const getFileIconColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'text-red-600';
      case 'docx':
      case 'doc':
        return 'text-blue-600';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'text-green-600';
      case 'mp4':
      case 'avi':
        return 'text-purple-600';
      case 'mp3':
      case 'wav':
        return 'text-orange-600';
      case 'xlsx':
      case 'xls':
        return 'text-green-700';
      case 'pptx':
      case 'ppt':
        return 'text-orange-700';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fileTypes = ['all', 'pdf', 'docx', 'jpg', 'png', 'mp4', 'mp3', 'xlsx', 'pptx'];
  const sources = ['all', 'chats', 'cases'];

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Library</h1>
          <p className="text-gray-600">All your documents and media files</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* File Type Filter */}
            <div>
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fileTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All File Types' : type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sources.map(source => (
                  <option key={source} value={source}>
                    {source === 'all' ? 'All Sources' : source.charAt(0).toUpperCase() + source.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-500">
            {filteredDocuments.length} of {documents.length} documents
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="file" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedFileType !== 'all' || selectedSource !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload some documents to get started'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ${getFileIconColor(doc.type)}`}>
                      <Icon name={getFileIcon(doc.type)} className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    
                    <div className="mt-1 text-xs text-gray-500">
                      <div>{formatFileSize(doc.size)}</div>
                      <div>{formatDate(doc.uploadedAt)}</div>
                    </div>
                    
                    <div className="mt-2">
                      {doc.sourceChat && (
                        <div className="flex items-center space-x-1">
                          <Icon name="messageCircle" className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600 truncate" title={doc.sourceChat.title}>
                            {doc.sourceChat.title}
                          </span>
                        </div>
                      )}
                      {doc.sourceCase && (
                        <div className="flex items-center space-x-1">
                          <Icon name="folder" className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600 truncate" title={doc.sourceCase.caseName}>
                            {doc.sourceCase.caseName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(doc.url, '_blank')}
                    className="text-xs"
                  >
                    <Icon name="download" className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
