import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';
import { googleCalendarService } from '@/lib/google-calendar';
import type { CalendarEvent } from '@/types/backend';
import { EVENT_TYPE_STYLES } from '@/app/api/calendar/events/route';

export const createCalendarEventTool = ai.defineTool(
  {
    name: 'createCalendarEvent',
    description: 'Create a new calendar event in the user\'s calendar',
    inputSchema: z.object({
      title: z.string().describe('Event title'),
      description: z.string().optional().describe('Event description'),
      date: z.string().describe('Event date in YYYY-MM-DD format'),
      startTime: z.string().optional().describe('Start time in HH:MM format (24-hour)'),
      endTime: z.string().optional().describe('End time in HH:MM format (24-hour)'),
      eventType: z.enum(['filing_deadline', 'court_hearing', 'discovery_deadline', 'client_meeting', 'internal_task']).describe('Type of event'),
      caseId: z.string().optional().describe('Linked case ID if applicable'),
      caseName: z.string().optional().describe('Linked case name'),
      location: z.string().optional().describe('Event location'),
      attendees: z.array(z.string().email()).optional().describe('List of attendee email addresses'),
      isBillable: z.boolean().optional().describe('Whether the event is billable'),
      userId: z.string().describe('User ID'),
    }),
  },
  async (input) => {
    try {
      // Determine priority based on event type
      const priority = EVENT_TYPE_STYLES[input.eventType]?.priority || 'normal';
      
      const eventData: Partial<CalendarEvent> = {
        userId: input.userId,
        title: input.title,
        description: input.description,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        eventType: input.eventType,
        priority: priority as CalendarEvent['priority'],
        caseId: input.caseId,
        caseName: input.caseName,
        location: input.location,
        attendees: input.attendees || [],
        isBillable: input.isBillable || false,
        addReminderTask: false, // Will be handled separately if needed
        syncedToGoogle: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add event to Firestore
      const docRef = await db.collection('users').doc(input.userId).collection('events').add(eventData);
      
      return {
        success: true,
        eventId: docRef.id,
        message: `Event "${input.title}" created successfully for ${input.date}`,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        error: 'Failed to create calendar event',
      };
    }
  }
);

export const checkCalendarAvailabilityTool = ai.defineTool(
  {
    name: 'checkCalendarAvailability',
    description: 'Check if the user is available during a specific time period',
    inputSchema: z.object({
      date: z.string().describe('Date to check in YYYY-MM-DD format'),
      startTime: z.string().describe('Start time in HH:MM format'),
      endTime: z.string().describe('End time in HH:MM format'),
      userId: z.string().describe('User ID'),
    }),
  },
  async (input) => {
    try {
      // Get user's events for the specified date
      const eventsSnapshot = await db
        .collection('users')
        .doc(input.userId)
        .collection('events')
        .where('date', '==', input.date)
        .get();
      
      const events = eventsSnapshot.docs.map(doc => doc.data()) as CalendarEvent[];
      
      // Check for conflicts
      const conflicts = events.filter(event => {
        if (!event.startTime || !event.endTime) return false;
        
        const requestedStart = input.startTime;
        const requestedEnd = input.endTime;
        const eventStart = event.startTime;
        const eventEnd = event.endTime;
        
        // Check if there's any overlap
        return !(requestedEnd <= eventStart || requestedStart >= eventEnd);
      });
      
      return {
        available: conflicts.length === 0,
        conflictingEvents: conflicts.map(e => ({
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
        })),
        message: conflicts.length === 0
          ? `Available for the requested time slot on ${input.date}`
          : `Found ${conflicts.length} conflicting event(s)`,
      };
    } catch (error) {
      console.error('Error checking calendar availability:', error);
      return {
        available: false,
        error: 'Failed to check calendar availability',
      };
    }
  }
);

export const listUpcomingEventsTool = ai.defineTool(
  {
    name: 'listUpcomingEvents',
    description: 'List upcoming calendar events for the user',
    inputSchema: z.object({
      userId: z.string().describe('User ID'),
      days: z.number().optional().describe('Number of days to look ahead (default: 7)'),
    }),
  },
  async (input) => {
    try {
      const days = input.days || 7;
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const maxDate = futureDate.toISOString().split('T')[0];
      
      // Get user's upcoming events
      const eventsSnapshot = await db
        .collection('users')
        .doc(input.userId)
        .collection('events')
        .where('date', '>=', today)
        .where('date', '<=', maxDate)
        .get();
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEvent[];
      
      // Sort by date and time
      events.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (!a.startTime || !b.startTime) return 0;
        return a.startTime.localeCompare(b.startTime);
      });
      
      return {
        events: events.map(e => ({
          title: e.title,
          date: e.date,
          time: e.startTime || 'All day',
          eventType: e.eventType,
          caseName: e.caseName,
        })),
        count: events.length,
        message: `Found ${events.length} upcoming event(s) in the next ${days} days`,
      };
    } catch (error) {
      console.error('Error listing upcoming events:', error);
      return {
        events: [],
        count: 0,
        error: 'Failed to list upcoming events',
      };
    }
  }
);



