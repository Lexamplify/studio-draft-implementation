"use client";

import React from 'react';
import { Icon } from '@/components/ui/icon';

interface StagedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

interface StagedAction {
  id: string;
  type: 'createCase' | 'createDraft' | 'addEvent';
  label: string;
}

interface StagingAreaProps {
  stagedFiles: StagedFile[];
  stagedAction: StagedAction | null;
  onRemoveFile: (fileId: string) => void;
  onRemoveAction: () => void;
}

export default function StagingArea({ 
  stagedFiles, 
  stagedAction, 
  onRemoveFile, 
  onRemoveAction 
}: StagingAreaProps) {
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'fileText';
    if (type.includes('word') || type.includes('document')) return 'fileLines';
    if (type.includes('image')) return 'image';
    return 'fileLines';
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'createCase': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'createDraft': return 'bg-green-100 text-green-800 border-green-200';
      case 'addEvent': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (stagedFiles.length === 0 && !stagedAction) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-4">
      <div className="flex flex-wrap gap-2">
        {/* File Pills */}
        {stagedFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center space-x-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-full px-3 py-1.5 text-sm"
          >
            <Icon name={getFileIcon(file.type)} className="w-4 h-4" />
            <span className="font-medium truncate max-w-32" title={file.name}>
              {file.name}
            </span>
            <span className="text-xs text-blue-600">
              ({formatFileSize(file.size)})
            </span>
            <button
              onClick={() => onRemoveFile(file.id)}
              className="ml-1 p-0.5 rounded-full hover:bg-blue-200 transition-colors"
            >
              <Icon name="x" className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Action Pill */}
        {stagedAction && (
          <div
            className={`flex items-center space-x-2 border rounded-full px-3 py-1.5 text-sm ${getActionColor(stagedAction.type)}`}
          >
            <Icon name="sparkles" className="w-4 h-4" />
            <span className="font-medium">
              {stagedAction.label}
            </span>
            <button
              onClick={onRemoveAction}
              className="ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors"
            >
              <Icon name="x" className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

