"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { apiClient } from '@/lib/api-client';
import TodoList from './todo-list';
import NotesEditor from './notes-editor';

interface GeneralWorkspaceProps {
  onSwitchToCase?: () => void;
}

export default function GeneralWorkspace({ onSwitchToCase }: GeneralWorkspaceProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load general events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        console.log('Fetching general events...');
        const response = await apiClient.get('/api/workspace/events');
        console.log('General events response:', response);
        setUpcomingEvents(response.events || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleViewAllEvents = () => {
    // Navigate to main calendar page
    window.location.href = '/calendar';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onSwitchToCase && (
          <button
            onClick={onSwitchToCase}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Switch to Case
          </button>
        )}
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Upcoming Events</h4>
          <button
            onClick={handleViewAllEvents}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            View All
          </button>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-6">
            <Icon name="calendar" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {event.time && ` • ${event.time}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General To-Do List */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">General To-Do List</h4>
        <TodoList caseId={null} />
      </div>

      {/* General Notes */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">General Notes</h4>
        <NotesEditor 
          caseId={null} 
          placeholder="Add your general notes, reminders, or thoughts here..."
        />
      </div>
    </div>
  );
}
