'use client';

import React from 'react';
import type { CalendarEvent } from '@/types/backend';
import { EventCard } from './event-card';

interface AgendaViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);
  
  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => a.localeCompare(b));
  
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let label = '';
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Tomorrow';
    else if (diffDays === -1) label = 'Yesterday';
    else if (diffDays > 1 && diffDays <= 7) label = `In ${diffDays} days`;
    else if (diffDays < -1 && diffDays >= -7) label = `${Math.abs(diffDays)} days ago`;
    
    return {
      dateStr,
      weekday: date.toLocaleDateString(undefined, { weekday: 'long' }),
      month: date.toLocaleDateString(undefined, { month: 'long' }),
      day: date.toLocaleDateString(undefined, { day: 'numeric' }),
      year: date.toLocaleDateString(undefined, { year: 'numeric' }),
      label,
    };
  };
  
  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-400 text-lg">No events scheduled</p>
        <p className="text-gray-400 text-sm mt-2">Create an event to get started</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const header = formatDateHeader(dateStr);
        const dayEvents = eventsByDate[dateStr];
        
        return (
          <div key={dateStr} className="space-y-2">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {header.weekday}, {header.month} {header.day}, {header.year}
                  </h3>
                  {header.label && (
                    <p className="text-sm text-gray-500">{header.label}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                  compact={true}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AgendaView;



