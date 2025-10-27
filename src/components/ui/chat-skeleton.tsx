import React from 'react';

interface ChatSkeletonProps {
  className?: string;
}

export function ChatSkeleton({ className = "" }: ChatSkeletonProps) {
  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg ${className}`}>
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  );
}

export function ChatSkeletonList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <ChatSkeleton key={index} />
      ))}
    </div>
  );
}
