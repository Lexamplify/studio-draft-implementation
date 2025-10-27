"use client";

import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface ChatFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

interface FileDisplayProps {
  files: ChatFile[];
  onRemoveFile: (fileId: string) => void;
  compact?: boolean;
}

export default function FileDisplay({ files, onRemoveFile, compact = false }: FileDisplayProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'filePdf';
    if (type.includes('word') || type.includes('document')) return 'fileWord';
    if (type.includes('image')) return 'image';
    if (type.includes('text')) return 'file';
    return 'file';
  };

  const getFileTypeColor = (type: string) => {
    if (type.includes('pdf')) return 'text-red-600 bg-red-50';
    if (type.includes('word') || type.includes('document')) return 'text-blue-600 bg-blue-50';
    if (type.includes('image')) return 'text-green-600 bg-green-50';
    if (type.includes('text')) return 'text-gray-600 bg-gray-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (files.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-100 text-xs"
          >
            <Icon name={getFileIcon(file.type)} className="w-3 h-3" />
            <span className="truncate max-w-20">{file.name}</span>
            <button
              onClick={() => onRemoveFile(file.id)}
              className="text-gray-400 hover:text-red-500"
            >
              <Icon name="x" className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Attached Files</h4>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getFileTypeColor(file.type)}`}>
                <Icon name={getFileIcon(file.type)} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon name="externalLink" className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(file.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Icon name="x" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
