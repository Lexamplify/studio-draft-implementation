import React from 'react';

interface CaseSkeletonProps {
  className?: string;
}

export function CaseSkeleton({ className = "" }: CaseSkeletonProps) {
  return (
    <div className={`p-3 rounded-lg border border-gray-100 ${className}`}>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-100 rounded-full animate-pulse w-16"></div>
          <div className="h-6 bg-gray-100 rounded-full animate-pulse w-20"></div>
        </div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-full"></div>
      </div>
    </div>
  );
}

export function CaseSkeletonList({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <CaseSkeleton key={index} />
      ))}
    </div>
  );
}
