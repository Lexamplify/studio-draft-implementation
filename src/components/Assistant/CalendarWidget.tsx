import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

const CalendarWidget = () => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('googleAccessToken') || '' : '';
      if (!accessToken) {
        setEvents([]);
        setLoading(false);
        return;
      }
      try {
        const now = new Date().toISOString();
        const res = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: now,
            maxResults: 3,
          },
        });
        setEvents(res.data.items || []);
      } catch (err) {
        setError('Failed to fetch events.');
        setEvents([]);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return dateStr.length > 10 ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'All Day';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="font-semibold text-lg mb-3">Upcoming Events</div>
      {loading ? (
        <div className="text-blue-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-gray-400 text-sm">No upcoming events found.</div>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col border-b pb-2 last:border-b-0 last:pb-0">
              <span className="text-blue-600 font-medium">{formatDate(event.start.dateTime || event.start.date)}</span>
              <span className="text-gray-700">{event.summary}</span>
              <span className="text-gray-400 text-xs">{formatTime(event.start.dateTime || event.start.date)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/calendar" className="mt-4 inline-block text-blue-600 hover:underline text-sm">View Full Calendar</Link>
    </div>
  );
};

export default CalendarWidget; 

