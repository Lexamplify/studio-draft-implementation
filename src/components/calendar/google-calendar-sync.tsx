'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui/icon';

interface GoogleCalendarSyncProps {
  eventId: string;
  isSynced: boolean;
  googleEventId?: string;
  onSyncChange?: (synced: boolean, googleEventId?: string) => void;
}

export default function GoogleCalendarSync({ 
  eventId, 
  isSynced, 
  googleEventId, 
  onSyncChange 
}: GoogleCalendarSyncProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get stored tokens
      const storedTokens = localStorage.getItem('googleCalendarTokens');
      if (!storedTokens) {
        throw new Error('Google Calendar not connected. Please connect first.');
      }

      const tokens = JSON.parse(storedTokens);
      const userId = 'current-user-id'; // TODO: Get from auth context

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          userId,
          tokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync event');
      }

      onSyncChange?.(true, data.googleEventId);
    } catch (error) {
      console.error('Sync error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sync event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const storedTokens = localStorage.getItem('googleCalendarTokens');
      if (!storedTokens) {
        throw new Error('Google Calendar not connected');
      }

      const tokens = JSON.parse(storedTokens);
      const userId = 'current-user-id'; // TODO: Get from auth context

      const response = await fetch('/api/calendar/sync', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          userId,
          tokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unsync event');
      }

      onSyncChange?.(false);
    } catch (error) {
      console.error('Unsync error:', error);
      setError(error instanceof Error ? error.message : 'Failed to unsync event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {isSynced ? (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-green-600">
            <Icon name="checkCircle" className="w-4 h-4" />
            <span className="text-sm">Synced</span>
          </div>
          <button
            onClick={handleUnsync}
            disabled={isLoading}
            className="text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
          >
            {isLoading ? 'Unsyncing...' : 'Unsync'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleSync}
          disabled={isLoading}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Syncing...</span>
            </>
          ) : (
            <>
              <Icon name="calendar" className="w-4 h-4" />
              <span className="text-sm">Sync to Google</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
