"use client";

interface ChatTitleLoadingProps {
  className?: string;
}

export default function ChatTitleLoading({ className = "" }: ChatTitleLoadingProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded animate-pulse blur-sm"></div>
      </div>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
