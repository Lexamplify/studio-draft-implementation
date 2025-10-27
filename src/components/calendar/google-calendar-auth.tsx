'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';

interface GoogleCalendarAuthProps {
  onAuthSuccess?: (tokens: any) => void;
  onAuthError?: (error: string) => void;
}

export default function GoogleCalendarAuth({ onAuthSuccess, onAuthError }: GoogleCalendarAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<any>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const storedTokens = localStorage.getItem('googleCalendarTokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored tokens:', error);
        localStorage.removeItem('googleCalendarTokens');
      }
    }
  }, []);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      // Get auth URL from backend
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get auth URL');
      }

      // Open popup window for OAuth
      const popup = window.open(
        data.authUrl,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          
          // Check if auth was successful by looking for tokens in localStorage
          const newTokens = localStorage.getItem('googleCalendarTokens');
          if (newTokens) {
            const parsedTokens = JSON.parse(newTokens);
            setTokens(parsedTokens);
            setIsAuthenticated(true);
            onAuthSuccess?.(parsedTokens);
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Auth error:', error);
      setIsLoading(false);
      onAuthError?.(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('googleCalendarTokens');
    setTokens(null);
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-green-600">
          <Icon name="checkCircle" className="w-4 h-4" />
          <span className="text-sm font-medium">Google Calendar Connected</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAuth}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Icon name="calendar" className="w-4 h-4" />
          <span>Connect Google Calendar</span>
        </>
      )}
    </button>
  );
}
