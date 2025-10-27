'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import { CalendarProvider, useCalendarContext } from '@/context/calendar-context';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import CalendarView from '@/components/calendar/calendar-view';
import AgendaView from '@/components/calendar/agenda-view';
import AddEventModal from '@/components/calendar/add-event-modal';
import EventDetailModal from '@/components/calendar/event-detail-modal';
import CaseFilterDropdown from '@/components/calendar/case-filter-dropdown';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@/components/ui/icon';
import type { CalendarEvent } from '@/types/backend';
import { View } from 'react-big-calendar';

function CalendarPageContent() {
  const router = useRouter();
  const { currentView, setCurrentView, currentDate, setCurrentDate, selectedCaseId } = useCalendarContext();
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Calculate date range for fetching events (next 90 days)
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 90);
  
  const { events, loading, refetch } = useCalendarEvents({
    timeMin: timeMin.toISOString().split('T')[0],
    timeMax: timeMax.toISOString().split('T')[0],
  });
  
  // Filter events by selected case
  const filteredEvents = selectedCaseId
    ? events.filter(e => e.caseId === selectedCaseId)
    : events;
  
  useEffect(() => {
    refetch();
  }, [selectedCaseId, refetch]);
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };
  
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else if (direction === 'next') {
      if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    } else {
      newDate.setTime(Date.now());
    }
    
    setCurrentDate(newDate);
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Calendar</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                >
                  <Icon name="chevronLeft" className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('today')}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                >
                  <Icon name="chevronRight" className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                {currentDate.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CaseFilterDropdown />
              <Button onClick={() => setShowAddModal(true)}>
                <Icon name="plus" className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
          
          {/* View Switcher */}
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="agenda">Deadline View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Loading events...</p>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'agenda' ? (
                <AgendaView
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                />
              ) : (
                <CalendarView
                  events={filteredEvents}
                  view={currentView as View}
                  onViewChange={(view) => setCurrentView(view as any)}
                  onNavigate={setCurrentDate}
                  currentDate={currentDate}
                  onEventClick={handleEventClick}
                />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <AddEventModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        initialDate={currentDate}
      />
      
      <EventDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AuthGuard>
      <CalendarProvider>
        <CalendarPageContent />
      </CalendarProvider>
    </AuthGuard>
  );
}


