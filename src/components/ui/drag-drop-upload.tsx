"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Icon } from './icon';

interface DragDropUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
}

export default function DragDropUpload({
  onFilesSelected,
  accept = ".pdf,.doc,.docx",
  multiple = true,
  maxFiles = 10,
  maxSize = 10, // 10MB default
  className = ""
}: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxSize}MB.`;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedTypes.includes(fileExtension)) {
      return `File "${file.name}" is not a supported format. Accepted formats: ${accept}`;
    }

    return null;
  };

  const processFiles = useCallback((files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Validate each file
    const errors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    // Process valid files
    if (validFiles.length > 0) {
      setIsUploading(true);
      onFilesSelected(validFiles);
      // Reset uploading state after a short delay
      setTimeout(() => setIsUploading(false), 1000);
    }
  }, [onFilesSelected, maxFiles, maxSize, accept]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      } ${isUploading ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
      />
      
      <div className="flex flex-col items-center space-y-4">
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-blue-600 font-medium">Uploading files...</p>
          </>
        ) : (
          <>
            <div className={`p-4 rounded-full ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Icon 
                name="upload" 
                className={`w-8 h-8 ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`} 
              />
            </div>
            <div>
              <p className={`text-lg font-medium ${isDragOver ? 'text-blue-600' : 'text-gray-700'}`}>
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or <span className="text-blue-600 font-medium">click to browse</span>
              </p>
            </div>
            <div className="text-xs text-gray-400">
              <p>Accepted formats: {accept}</p>
              <p>Max {maxFiles} files, {maxSize}MB each</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
