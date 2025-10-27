import React from 'react';

interface MessageSkeletonProps {
  className?: string;
  isUser?: boolean;
}

export function MessageSkeleton({ className = "", isUser = false }: MessageSkeletonProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-white border border-gray-200'
      }`}>
        <div className="space-y-2">
          <div className={`h-4 bg-gray-200 rounded animate-pulse ${
            isUser ? 'bg-blue-300' : 'bg-gray-200'
          } w-full`}></div>
          <div className={`h-4 bg-gray-200 rounded animate-pulse ${
            isUser ? 'bg-blue-300' : 'bg-gray-200'
          } w-3/4`}></div>
          <div className={`h-4 bg-gray-200 rounded animate-pulse ${
            isUser ? 'bg-blue-300' : 'bg-gray-200'
          } w-1/2`}></div>
        </div>
      </div>
    </div>
  );
}

export function MessageSkeletonList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton 
          key={index} 
          isUser={index % 2 === 0} // Alternate between user and AI messages
        />
      ))}
    </div>
  );
}

// Skeleton for the entire chat area
export function ChatAreaSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-32"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      </div>
      
      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageSkeletonList count={4} />
      </div>
      
      {/* Input area skeleton */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse flex-1"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
