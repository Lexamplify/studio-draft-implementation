'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { CalendarEvent } from '@/types/backend';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import { EVENT_TYPE_STYLES } from '@/app/api/calendar/events/route';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EventDetailModalProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

export function EventDetailModal({ open, onClose, event }: EventDetailModalProps) {
  const { deleteEvent, updateEvent } = useCalendarEvents();
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!event) return null;
  
  const style = EVENT_TYPE_STYLES[event.eventType] || EVENT_TYPE_STYLES.internal_task;
  const getPriorityEmoji = () => {
    if (event.eventType === 'filing_deadline') return '⚠️';
    if (event.eventType === 'court_hearing') return '⚖️';
    if (event.eventType === 'discovery_deadline') return '📋';
    if (event.eventType === 'client_meeting') return '💼';
    return '📌';
  };
  
  const getEventTypeLabel = () => {
    const labels = {
      filing_deadline: 'Filing Deadline',
      court_hearing: 'Court Hearing',
      discovery_deadline: 'Discovery Deadline',
      client_meeting: 'Client Meeting',
      internal_task: 'Internal Task',
    };
    return labels[event.eventType];
  };
  
  const getPriorityLabel = () => {
    const labels = {
      critical: 'Critical',
      high: 'High',
      normal: 'Normal',
      low: 'Low',
    };
    return labels[event.priority];
  };
  
  const handleDelete = async () => {
    if (!event.id) return;
    
    if (confirm('Are you sure you want to delete this event?')) {
      setIsDeleting(true);
      try {
        const tokens = localStorage.getItem('googleCalendarTokens');
        await deleteEvent({
          id: event.id,
          tokens: tokens || undefined,
        });
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{getPriorityEmoji()}</span>
            {event.title}
          </DialogTitle>
          <DialogDescription>
            {getEventTypeLabel()} • {getPriorityLabel()} Priority
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-sm">{new Date(event.date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
            </div>
            
            {event.startTime && (
              <div>
                <p className="text-sm font-medium text-gray-500">Time</p>
                <p className="text-sm">
                  {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                </p>
              </div>
            )}
          </div>
          
          {event.caseName && event.caseId && (
            <div>
              <p className="text-sm font-medium text-gray-500">Linked Case</p>
              <Link
                href={`/vault?case=${event.caseId}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {event.caseName}
              </Link>
            </div>
          )}
          
          {event.description && (
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-sm">{event.description}</p>
            </div>
          )}
          
          {event.location && (
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="text-sm">📍 {event.location}</p>
            </div>
          )}
          
          {event.attendees && event.attendees.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500">Attendees</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {event.attendees.map((email, index) => (
                  <span key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-4 flex-wrap">
            {event.isBillable && (
              <span className="text-sm font-semibold bg-yellow-100 text-yellow-800 px-3 py-1 rounded">
                $ Billable
              </span>
            )}
            {event.syncedToGoogle && (
              <span className="text-sm font-semibold bg-green-100 text-green-800 px-3 py-1 rounded flex items-center gap-1">
                <span>✓</span> Synced to Google Calendar
              </span>
            )}
            {event.addReminderTask && (
              <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded">
                📋 Reminder Task Enabled
              </span>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EventDetailModal;


