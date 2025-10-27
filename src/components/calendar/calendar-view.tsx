'use client';

import React, { useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import type { CalendarEvent } from '@/types/backend';
import { EventCard } from './event-card';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// Import moment
require('moment-timezone');

interface CalendarViewProps {
  events: CalendarEvent[];
  view: View;
  onViewChange: (view: View) => void;
  onNavigate: (date: Date) => void;
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

export function CalendarView({
  events,
  view,
  onViewChange,
  onNavigate,
  currentDate,
  onEventClick,
}: CalendarViewProps) {
  // Convert events to react-big-calendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      const startDate = event.startTime
        ? moment(`${event.date}T${event.startTime}`).toDate()
        : moment(event.date).startOf('day').toDate();
      
      const endDate = event.endTime
        ? moment(`${event.date}T${event.endTime}`).toDate()
        : event.startTime
        ? moment(`${event.date}T${event.startTime}`).add(1, 'hour').toDate()
        : moment(event.date).endOf('day').toDate();
      
      return {
        id: event.id,
        title: event.title,
        start: startDate,
        end: endDate,
        resource: event, // Store full event data
      };
    });
  }, [events]);
  
  // Custom event component
  const EventComponent = ({ event }: any) => {
    const calendarEvent = event.resource as CalendarEvent;
    
    return (
      <div onClick={() => onEventClick(calendarEvent)} className="cursor-pointer h-full">
        <EventCard event={calendarEvent} compact={true} />
      </div>
    );
  };
  
  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={onViewChange}
        date={currentDate}
        onNavigate={onNavigate}
        components={{
          event: EventComponent,
        }}
        className="calendar-container"
      />
    </div>
  );
}

export default CalendarView;


