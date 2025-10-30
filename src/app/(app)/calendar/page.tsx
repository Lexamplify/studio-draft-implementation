'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { Icon } from '@/components/ui/icon';
import AddEventModal from '@/components/calendar/add-event-modal';
import type { CalendarEvent as CalendarEventType } from '@/types/backend';
import { useCases } from '@/context/cases-context';
import { useAppContext } from '@/context/app-context';
import { apiClient } from '@/lib/api-client';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

type View = 'month' | 'week' | 'day' | 'agenda';

interface CalendarPageEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: string;
  description: string;
  raw: any;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarPageEvent[]>([]);
  const [internalEvents, setInternalEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarPageEvent | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Get cases for filtering (optional feature)
  const { cases } = useCases();
  const { selectedCaseId } = useAppContext();

  // Get access token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('googleAccessToken');
    const tokenExpiry = localStorage.getItem('googleTokenExpiry');
    
    // Check if token is expired
    const isTokenExpired = () => {
      if (!tokenExpiry) return true;
      return Date.now() >= parseInt(tokenExpiry);
    };

    if (token && !isTokenExpired()) {
      setAccessToken(token);
    } else if (token && isTokenExpired()) {
      console.log('Google Calendar token expired, user needs to re-authenticate');
      // For now, let's just use the expired token and let Google API handle the refresh
      // In production, you'd want to implement proper token refresh
      setAccessToken(token);
    }
    // If no token, accessToken stays null and will show connection prompt
  }, []);

  const connectGoogleCalendar = async () => {
    try {
      // Use the existing API route for Google Calendar authentication
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        // Open popup window for OAuth
        const popup = window.open(
          data.authUrl,
          'googleCalendarAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check if auth was successful
            const newToken = localStorage.getItem('googleAccessToken');
            if (newToken) {
              setAccessToken(newToken);
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to connect to Google Calendar:', error);
      setAccessToken(null);
    }
  };

  // Fetch internal workspace events
  const fetchInternalEvents = useCallback(async () => {
    try {
      const caseIdParam = selectedCaseId ? `?caseId=${selectedCaseId}` : '';
      const response = await apiClient.get(`/api/workspace/events${caseIdParam}`);
      setInternalEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching internal events:', error);
      setInternalEvents([]);
    }
  }, [selectedCaseId]);

  // Fetch events from Google Calendar
  const fetchGoogleCalendarEvents = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        params: {
          singleEvents: true,
          orderBy: 'startTime',
          timeMin: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          maxResults: 2500,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const gEvents: CalendarPageEvent[] = response.data.items.map((ev: any) => {
        let start: Date;
        let end: Date;
        let allDay = false;

        if (ev.start.date) {
          // All-day event
          start = new Date(ev.start.date);
          end = new Date(ev.end.date);
          end = new Date(end.getTime() - 1000);
          allDay = true;
        } else {
          // Timed event
          start = new Date(ev.start.dateTime);
          end = new Date(ev.end.dateTime);
        }

        // Extract event type from description
        const type = ev.description?.split('TYPE:')[1]?.trim() || 'General';

        return {
          id: ev.id,
          title: ev.summary,
          start,
          end,
          allDay,
          type,
          description: ev.description?.split('TYPE:')[0]?.trim() || '',
          raw: ev,
        };
      });

      // Combine Google Calendar events with internal events
      const combinedEvents: CalendarPageEvent[] = [...gEvents, ...internalEvents.map(ev => ({
        id: `internal-${ev.id}`,
        title: ev.title,
        start: new Date(`${ev.date}T${ev.time || '00:00'}`),
        end: new Date(new Date(`${ev.date}T${ev.time || '00:00'}`).getTime() + 60 * 60 * 1000),
        allDay: false,
        type: ev.type || 'General',
        description: ev.description || '',
        raw: ev,
      }))];

      setEvents(combinedEvents);
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      // If Google Calendar fails, still show internal events
      const mappedEvents: CalendarPageEvent[] = internalEvents.map(ev => ({
        id: `internal-${ev.id}`,
        title: ev.title,
        start: new Date(`${ev.date}T${ev.time || '00:00'}`),
        end: new Date(new Date(`${ev.date}T${ev.time || '00:00'}`).getTime() + 60 * 60 * 1000),
        allDay: false,
        type: ev.type || 'General',
        description: ev.description || '',
        raw: ev,
      }));
      setEvents(mappedEvents);
    } finally {
      setLoading(false);
    }
  }, [accessToken, internalEvents]);

  // Load internal events on mount and when case changes
  useEffect(() => {
    fetchInternalEvents();
  }, [fetchInternalEvents]);

  useEffect(() => {
    if (accessToken && internalEvents.length > 0) {
      fetchGoogleCalendarEvents();
    } else if (!accessToken) {
      // Even without Google Calendar, show internal events
      const mappedEvents: CalendarPageEvent[] = internalEvents.map(ev => ({
        id: `internal-${ev.id}`,
        title: ev.title,
        start: new Date(`${ev.date}T${ev.time || '00:00'}`),
        end: new Date(new Date(`${ev.date}T${ev.time || '00:00'}`).getTime() + 60 * 60 * 1000),
        allDay: false,
        type: ev.type || 'General',
        description: ev.description || '',
        raw: ev,
      }));
      setEvents(mappedEvents);
      setLoading(false);
    }
  }, [accessToken, internalEvents, fetchGoogleCalendarEvents]);

  // Refresh events when modal closes (in case a Google Calendar event was added)
  useEffect(() => {
    if (!showAddModal && accessToken) {
      // Small delay to ensure any async operations complete
      const timer = setTimeout(() => {
        fetchGoogleCalendarEvents();
        fetchInternalEvents();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAddModal, accessToken]);


  // Handle deleting an event
  const handleDeleteEvent = async (eventId: string) => {
    if (!accessToken) return;

    try {
      await axios.delete(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setEvents(events.filter(ev => ev.id !== eventId));
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  // Custom event style
  const eventStyleGetter = (event: CalendarPageEvent) => {
    const typeColors: Record<string, string> = {
      Hearing: '#2563eb',
      Meeting: '#16a34a',
      Deadline: '#dc2626',
      General: '#64748b',
    };

    const color = typeColors[event.type] || '#64748b';

    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  // Handle event click
  const handleEventClick = (event: CalendarPageEvent) => {
    setSelectedEvent(event);
  };

  // Custom Event Component
  const EventComponent = ({ event }: { event: CalendarPageEvent }) => {
    return (
      <div className="px-2 py-1">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: event.type === 'Hearing' ? '#2563eb' : event.type === 'Meeting' ? '#16a34a' : event.type === 'Deadline' ? '#dc2626' : '#64748b' }}
          />
          <span className="text-xs font-semibold truncate">{event.title}</span>
        </div>
      </div>
    );
  };

  // If no access token, show connection prompt
  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="calendar" className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect Google Calendar</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Connect your Google Calendar to sync events and manage your legal schedule in one place.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={connectGoogleCalendar}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Icon name="link" className="w-5 h-5" />
              Connect Google Calendar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">Manage your legal events and deadlines</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
            >
              <Icon name="plus" className="w-5 h-5" />
              Add Event
            </button>
          </div>
        </div>

        {/* View Controls */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('agenda')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'agenda' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Agenda
            </button>
            
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setDate(moment(date).subtract(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon name="chevronLeft" className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDate(new Date())}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setDate(moment(date).add(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon name="chevronRight" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-6">
            <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={(v: View) => setView(v)}
            date={date}
            onNavigate={(d: Date) => setDate(d)}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleEventClick}
            components={{
              event: EventComponent,
            }}
          />
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddEventModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {moment(selectedEvent.start).format('MMMM D, YYYY • h:mm A')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon name="x" className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {selectedEvent.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-900">{selectedEvent.description}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleDeleteEvent(selectedEvent.id);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Event
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

