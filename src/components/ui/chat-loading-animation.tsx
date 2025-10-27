"use client";

interface ChatLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function ChatLoadingAnimation({ 
  size = 'md' 
}: ChatLoadingAnimationProps) {

  return (
    <div className="flex-1 bg-gray-50 flex flex-col relative transition-all duration-700 ease-in-out overflow-hidden" style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
      {/* Messages Area with Blurred Placeholders */}
      <div className="flex-1 overflow-y-auto p-8 transition-all duration-700 ease-in-out animate-in slide-in-from-bottom-8 fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* AI Message 1 - LEFT SIDE */}
          <div className="flex flex-col space-y-2 animate-pulse">
            <div className="flex justify-start">
              <div className="max-w-4xl mr-12">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 blur-sm"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 blur-sm"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 blur-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* User Message 1 - RIGHT SIDE */}
          <div className="flex flex-col space-y-2 animate-pulse" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-end">
              <div className="bg-gray-200 rounded-2xl rounded-tr-md px-6 py-3 max-w-3xl ml-12 shadow-md blur-sm">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Message 2 - LEFT SIDE */}
          <div className="flex flex-col space-y-2 animate-pulse" style={{ animationDelay: '400ms' }}>
            <div className="flex justify-start">
              <div className="max-w-4xl mr-12">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-4/5 blur-sm"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5 blur-sm"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 blur-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* User Message 2 - RIGHT SIDE */}
          <div className="flex flex-col space-y-2 animate-pulse" style={{ animationDelay: '600ms' }}>
            <div className="flex justify-end">
              <div className="bg-gray-200 rounded-2xl rounded-tr-md px-6 py-3 max-w-3xl ml-12 shadow-md blur-sm">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Message 3 - LEFT SIDE */}
          <div className="flex flex-col space-y-2 animate-pulse" style={{ animationDelay: '800ms' }}>
            <div className="flex justify-start">
              <div className="max-w-4xl mr-12">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-5/6 blur-sm"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 blur-sm"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 blur-sm"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 blur-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* User Message 3 - RIGHT SIDE */}
          <div className="flex flex-col space-y-2 animate-pulse" style={{ animationDelay: '1000ms' }}>
            <div className="flex justify-end">
              <div className="bg-gray-200 rounded-2xl rounded-tr-md px-6 py-3 max-w-3xl ml-12 shadow-md blur-sm">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
