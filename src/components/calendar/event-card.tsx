'use client';

import React from 'react';
import Link from 'next/link';
import type { CalendarEvent } from '@/types/backend';
import { EVENT_TYPE_STYLES } from '@/app/api/calendar/events/route';

interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  compact?: boolean;
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const style = EVENT_TYPE_STYLES[event.eventType] || EVENT_TYPE_STYLES.internal_task;
  
  const borderClass = {
    solid: 'border-l-4',
    dashed: 'border-l-4 border-dashed',
    dotted: 'border-l-4 border-dotted',
  }[style.borderStyle];
  
  const colorClass = {
    red: 'border-red-500 bg-red-50',
    blue: 'border-blue-500 bg-blue-50',
    orange: 'border-orange-500 bg-orange-50',
    green: 'border-green-500 bg-green-50',
    gray: 'border-gray-500 bg-gray-50',
  }[style.color];
  
  const getPriorityEmoji = () => {
    if (event.eventType === 'filing_deadline') return '⚠️';
    if (event.eventType === 'court_hearing') return '⚖️';
    if (event.eventType === 'discovery_deadline') return '📋';
    if (event.eventType === 'client_meeting') return '💼';
    return '📌';
  };
  
  if (compact) {
    return (
      <div
        className={`${borderClass} ${colorClass} rounded p-2 cursor-pointer hover:shadow-md transition-shadow`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <span>{getPriorityEmoji()}</span>
          <span className="font-medium text-sm truncate flex-1">{event.title}</span>
          {event.isBillable && <span className="text-xs">$</span>}
        </div>
        {event.caseName && (
          <div className="text-xs text-gray-600 mt-1 truncate">
            {event.caseName}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div
      className={`${borderClass} ${colorClass} rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getPriorityEmoji()}</span>
            <h4 className="font-semibold text-sm">{event.title}</h4>
            {event.isBillable && (
              <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                $
              </span>
            )}
          </div>
          
          {event.caseName && event.caseId && (
            <Link
              href={`/vault?case=${event.caseId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              {event.caseName}
            </Link>
          )}
          
          {event.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {event.startTime && (
              <span>🕐 {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>
            )}
            {event.location && <span>📍 {event.location}</span>}
          </div>
        </div>
        
        {event.syncedToGoogle && (
          <div className="flex-shrink-0">
            <span className="text-xs text-green-600">✓ Synced</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventCard;


