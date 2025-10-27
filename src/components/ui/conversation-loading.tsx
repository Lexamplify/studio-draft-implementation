"use client";

import { useState, useEffect } from 'react';

interface ConversationLoadingProps {
  className?: string;
}

export function ConversationLoading({ className = "" }: ConversationLoadingProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="max-w-3xl px-4 py-2 rounded-2xl bg-gray-200 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-32"></div>
        </div>
      </div>

      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="max-w-3xl px-4 py-2 rounded-2xl bg-gray-100 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="max-w-3xl px-4 py-2 rounded-2xl bg-gray-200 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      </div>

      {/* Assistant typing indicator */}
      <div className="flex justify-start">
        <div className="max-w-3xl px-4 py-2 rounded-2xl bg-white shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-500">Assistant is typing{dots}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationSkeleton({ className = "" }: ConversationLoadingProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Multiple conversation bubbles with different sizes */}
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-3xl px-4 py-2 rounded-2xl animate-pulse ${
            index % 2 === 0 
              ? 'bg-gray-200' 
              : 'bg-gray-100'
          }`}>
            <div className="space-y-2">
              <div className={`h-4 bg-gray-300 rounded ${
                index === 0 ? 'w-32' : 
                index === 1 ? 'w-full' : 
                index === 2 ? 'w-24' : 
                index === 3 ? 'w-3/4' :
                index === 4 ? 'w-40' :
                'w-2/3'
              }`}></div>
              {(index === 1 || index === 3 || index === 5) && (
                <>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </>
              )}
              {index === 4 && (
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
