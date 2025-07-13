'use client';
import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Gavel } from 'lucide-react';
import { Icons } from '@/components/icons';
import { ChevronLeft } from 'lucide-react';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const EVENT_TYPES = [
  { label: 'Hearing', color: '#2563eb' },
  { label: 'Meeting', color: '#16a34a' },
  { label: 'Deadline', color: '#dc2626' },
  { label: 'General', color: '#64748b' },
];

type EventType = 'Hearing' | 'Meeting' | 'Deadline' | 'General';

type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: EventType;
  description: string;
  raw: any;
}

function getEventColor(type: EventType) {
  const found = EVENT_TYPES.find(t => t.label === type);
  return found ? found.color : '#64748b';
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [addForm, setAddForm] = useState({
    title: '',
    type: 'General' as EventType,
    start: '',
    end: '',
    description: '',
  });
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('googleAccessToken') || '' : '';

  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const timeMin = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
      const res = await axios.get(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            singleEvents: true,
            orderBy: 'startTime',
            timeMin,
            maxResults: 2500,
          },
        }
      );
      console.log('Google Calendar API raw response:', res.data);
      const gEvents: CalendarEvent[] = (res.data.items || []).map((ev: any) => {
        const type = (ev.description?.split('TYPE:')[1]?.trim() || 'General') as EventType;
        // Handle all-day and timed events
        let start: Date, end: Date, allDay = false;
        if (ev.start.date) {
          // All-day event
          start = new Date(ev.start.date);
          // Google Calendar all-day events are exclusive of the end date
          end = new Date(ev.end.date);
          // Subtract 1 second to make it inclusive for react-big-calendar
          end = new Date(end.getTime() - 1000);
          allDay = true;
        } else {
          // Timed event
          start = new Date(ev.start.dateTime);
          end = new Date(ev.end.dateTime);
        }
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
      console.log('Mapped events for calendar:', gEvents);
      setEvents(gEvents);
    } catch (err) {
      setEvents([]);
      console.error('Error fetching Google Calendar events:', err);
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) fetchEvents();
  }, [fetchEvents, accessToken]);

  // Add event handler
  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addForm.title || !addForm.start || !addForm.end) return;
    try {
      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          summary: addForm.title,
          description: `${addForm.description}\nTYPE: ${addForm.type}`,
          start: { dateTime: new Date(addForm.start).toISOString() },
          end: { dateTime: new Date(addForm.end).toISOString() },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // Only close modal and refresh after successful creation
      if (response.status === 200 || response.status === 201) {
        setShowAddModal(false);
        setAddForm({ title: '', type: 'General', start: '', end: '', description: '' });
        await fetchEvents();
      } else {
        alert('Failed to add event. Please try again.');
      }
    } catch (err) {
      alert('Failed to add event. Please check your input and try again.');
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSelectedEvent(null);
      fetchEvents();
    } catch (err) {
      // handle error
    }
  };

  // Prompt to connect Google Calendar if no access token
  if (!accessToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg flex flex-col items-center">
          <Gavel className="h-12 w-12 text-blue-700 mb-4" />
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Connect Google Calendar</h2>
          <p className="text-gray-600 mb-6 text-center">To use the legal calendar, please sign in with Google and grant calendar access.</p>
          <a href="/products/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition">Connect Google Calendar</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <Gavel className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight font-sans">My Legal Calendar</h1>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-2xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="text-lg font-semibold text-blue-700 font-sans">Upcoming Events</div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => setShowAddModal(true)}
            >
              + Add Event
            </button>
          </div>
          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex gap-2 bg-blue-50 rounded-full p-1 shadow-inner border border-blue-100">
              {[
                { key: 'month', label: 'Month' },
                { key: 'week', label: 'Week' },
                { key: 'day', label: 'Day' },
                { key: 'agenda', label: 'Agenda' },
              ].map(v => (
                <button
                  key={v.key}
                  className={`px-4 py-1 rounded-full font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-200
                    ${view === v.key ? 'bg-white text-blue-700 shadow font-semibold' : 'bg-transparent text-blue-500 hover:bg-blue-100'}`}
                  onClick={() => setView(v.key as View)}
                  aria-pressed={view === v.key}
                  tabIndex={0}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <button
                className="rounded-full p-2 bg-white hover:bg-blue-50 border border-gray-200 shadow-sm"
                onClick={() => setDate(addDays(date, -1 * (view === 'month' ? 30 : view === 'week' ? 7 : 1)))}
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </button>
              <span className="font-semibold text-gray-700 text-base">{format(date, view === 'month' ? 'MMMM yyyy' : 'PPP')}</span>
              <button
                className="rounded-full p-2 bg-white hover:bg-blue-50 border border-gray-200 shadow-sm"
                onClick={() => setDate(addDays(date, view === 'month' ? 30 : view === 'week' ? 7 : 1))}
                aria-label="Next"
              >
                <Icons.ChevronRight className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              allDayAccessor="allDay"
              style={{ height: 600, background: 'transparent', borderRadius: 24 }}
              eventPropGetter={(event: CalendarEvent) => ({
                style: {
                  backgroundColor: 'rgba(59,130,246,0.08)',
                  color: '#1e293b',
                  borderRadius: 12,
                  border: 'none',
                  padding: '6px 12px',
                  fontWeight: 500,
                  fontSize: 15,
                  boxShadow: '0 1px 4px 0 rgba(59,130,246,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }
              })}
              components={{
                event: ({ event }: { event: CalendarEvent }) => (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: getEventColor(event.type) }}></span>
                    <span className="truncate font-medium">{event.title}</span>
                  </div>
                ),
                toolbar: () => null
              }}
              onSelectEvent={(event: CalendarEvent) => setSelectedEvent(event)}
              view={view}
              date={date}
              onView={setView}
              onNavigate={setDate}
            />
            {!loading && events.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none bg-white/80 rounded-2xl">
                <Gavel className="h-10 w-10 mb-2 text-blue-200" />
                <span className="text-gray-400">No events found. Start by adding your first event!</span>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-2xl">
                <span className="animate-pulse text-blue-400 text-lg">Loading events…</span>
              </div>
            )}
          </div>
        </div>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <form
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-5 border border-blue-100"
              onSubmit={handleAddEvent}
            >
              <h2 className="text-2xl font-bold mb-2 text-blue-800">Add Event</h2>
              <input
                className="border border-blue-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
                placeholder="Title"
                value={addForm.title}
                onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                required
              />
              <select
                className="border border-blue-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
                value={addForm.type}
                onChange={e => setAddForm(f => ({ ...f, type: e.target.value as EventType }))}
              >
                {EVENT_TYPES.map(t => (
                  <option key={t.label} value={t.label}>{t.label}</option>
                ))}
              </select>
              <input
                className="border border-blue-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
                type="datetime-local"
                value={addForm.start}
                onChange={e => setAddForm(f => ({ ...f, start: e.target.value }))}
                required
              />
              <input
                className="border border-blue-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
                type="datetime-local"
                value={addForm.end}
                onChange={e => setAddForm(f => ({ ...f, end: e.target.value }))}
                required
              />
              <textarea
                className="border border-blue-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
                placeholder="Description (optional)"
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full px-4 py-2 border border-gray-200"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 font-semibold shadow"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-5 border border-blue-100">
              <h2 className="text-2xl font-bold mb-2 text-blue-800 flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: getEventColor(selectedEvent.type) }}></span>
                {selectedEvent.title}
              </h2>
              <div className="text-gray-600 whitespace-pre-line">{selectedEvent.description}</div>
              <div className="text-gray-500 text-sm">
                {selectedEvent.start.toLocaleString()} - {selectedEvent.end.toLocaleString()}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full px-4 py-2 border border-gray-200"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
                <button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full px-4 py-2 font-semibold shadow"
                  onClick={() => handleDeleteEvent(selectedEvent)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 