import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { googleCalendarService } from '@/lib/google-calendar';
import { auth } from '@/lib/firebase-admin';
import type { CalendarEvent } from '@/types/backend';

// Event type configuration
export const EVENT_TYPE_STYLES = {
  filing_deadline: { color: 'red', borderStyle: 'solid', priority: 'critical' },
  court_hearing: { color: 'blue', borderStyle: 'solid', priority: 'high' },
  discovery_deadline: { color: 'orange', borderStyle: 'solid', priority: 'high' },
  client_meeting: { color: 'green', borderStyle: 'dashed', priority: 'normal' },
  internal_task: { color: 'gray', borderStyle: 'dotted', priority: 'low' },
};

// Get user ID from authorization header
async function getUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await auth.verifyIdToken(idToken);
  return decodedToken.uid;
}

// GET: Fetch user's events (optionally merge with Google Calendar)
export async function GET(request: NextRequest) {
  try {
    const uid = await getUserId(request);
    const { searchParams } = new URL(request.url);
    
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const includeGoogle = searchParams.get('includeGoogle') === 'true';
    
    // Get user's events from Firestore
    let query = db.collection('users').doc(uid).collection('events');
    
    if (timeMin || timeMax) {
      if (timeMin) query = query.where('date', '>=', timeMin);
      if (timeMax) query = query.where('date', '<=', timeMax);
    }
    
    const snapshot = await query.get();
    const events: CalendarEvent[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CalendarEvent[];
    
    // Optionally merge with Google Calendar events
    if (includeGoogle) {
      try {
        const storedTokens = searchParams.get('tokens');
        if (storedTokens) {
          const tokens = JSON.parse(storedTokens);
          googleCalendarService.setCredentials(tokens);
          
          const googleEvents = await googleCalendarService.getEvents(
            timeMin || undefined,
            timeMax || undefined
          );
          
          // Merge Google events with local events
          const googleEventMap = new Map(events
            .filter(e => e.googleEventId)
            .map(e => [e.googleEventId!, e]));
          
          // Add new Google events that aren't synced yet
          for (const googleEvent of googleEvents) {
            if (!googleEventMap.has(googleEvent.id)) {
              events.push({
                id: googleEvent.id,
                title: googleEvent.summary || 'Untitled Event',
                description: googleEvent.description,
                date: googleEvent.start?.dateTime ? googleEvent.start.dateTime.split('T')[0] : googleEvent.start?.date || '',
                startTime: googleEvent.start?.dateTime ? googleEvent.start.dateTime.split('T')[1].substring(0, 5) : undefined,
                endTime: googleEvent.end?.dateTime ? googleEvent.end.dateTime.split('T')[1].substring(0, 5) : undefined,
                location: googleEvent.location,
                attendees: googleEvent.attendees?.map((a: any) => a.email) || [],
                eventType: 'client_meeting',
                priority: 'normal',
                isBillable: false,
                addReminderTask: false,
                syncedToGoogle: true,
                googleEventId: googleEvent.id,
                userId: uid,
                createdAt: googleEvent.created ? new Date(googleEvent.created) : new Date(),
                updatedAt: googleEvent.updated ? new Date(googleEvent.updated) : new Date(),
              } as CalendarEvent);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        // Continue without Google events if there's an error
      }
    }
    
    return NextResponse.json({ 
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST: Create new event
export async function POST(request: NextRequest) {
  try {
    const uid = await getUserId(request);
    const body = await request.json();
    
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      eventType,
      caseId,
      caseName,
      location,
      attendees,
      isBillable,
      addReminderTask,
      syncedToGoogle,
      googleEventId,
    } = body;
    
    if (!title || !date || !eventType) {
      return NextResponse.json({ error: 'Title, date, and eventType are required' }, { status: 400 });
    }
    
    // Determine priority based on event type
    const priority = EVENT_TYPE_STYLES[eventType as keyof typeof EVENT_TYPE_STYLES]?.priority || 'normal';
    
    const eventData: Partial<CalendarEvent> = {
      userId: uid,
      title,
      description,
      date,
      startTime,
      endTime,
      eventType: eventType as CalendarEvent['eventType'],
      priority: priority as CalendarEvent['priority'],
      caseId,
      caseName,
      location,
      attendees: attendees || [],
      isBillable: isBillable || false,
      addReminderTask: addReminderTask || false,
      syncedToGoogle: syncedToGoogle || false,
      googleEventId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add event to Firestore
    const docRef = await db.collection('users').doc(uid).collection('events').add(eventData);
    
    // If syncedToGoogle flag is set, create in Google Calendar
    if (syncedToGoogle && !googleEventId) {
      try {
        const tokens = body.tokens;
        if (tokens) {
          googleCalendarService.setCredentials(JSON.parse(tokens));
          
          const googleEvent = {
            summary: title,
            description,
            start: {
              dateTime: startTime ? `${date}T${startTime}:00` : date,
              date: startTime ? undefined : date,
              timeZone: 'Asia/Kolkata',
            },
            end: {
              dateTime: endTime ? `${date}T${endTime}:00` : date,
              date: endTime ? undefined : date,
              timeZone: 'Asia/Kolkata',
            },
            location,
            attendees: attendees?.map((email: string) => ({ email })),
          };
          
          const createdEvent = await googleCalendarService.createEvent(googleEvent);
          
          // Update Firestore with Google Calendar ID
          await db.collection('users').doc(uid).collection('events').doc(docRef.id).update({
            googleEventId: createdEvent.id,
            syncedToGoogle: true,
          });
          
          return NextResponse.json({ 
            id: docRef.id,
            ...eventData,
            googleEventId: createdEvent.id,
          });
        }
      } catch (error) {
        console.error('Error syncing to Google Calendar:', error);
        // Continue without Google sync if it fails
      }
    }
    
    return NextResponse.json({ 
      id: docRef.id,
      ...eventData,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

// PUT: Update event
export async function PUT(request: NextRequest) {
  try {
    const uid = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    const eventRef = db.collection('users').doc(uid).collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const existingEvent = eventDoc.data() as CalendarEvent;
    
    // Update event in Firestore
    await eventRef.update({
      ...body,
      updatedAt: new Date(),
    });
    
    // If synced to Google, update Google Calendar event
    if (existingEvent.syncedToGoogle && existingEvent.googleEventId) {
      try {
        const tokens = body.tokens;
        if (tokens) {
          googleCalendarService.setCredentials(JSON.parse(tokens));
          
          const googleEvent = {
            summary: body.title || existingEvent.title,
            description: body.description || existingEvent.description,
            start: {
              dateTime: body.startTime ? `${body.date}T${body.startTime}:00` : body.date || existingEvent.date,
              date: body.startTime ? undefined : body.date || existingEvent.date,
              timeZone: 'Asia/Kolkata',
            },
            end: {
              dateTime: body.endTime ? `${body.date}T${body.endTime}:00` : body.date || existingEvent.date,
              date: body.endTime ? undefined : body.date || existingEvent.date,
              timeZone: 'Asia/Kolkata',
            },
            location: body.location || existingEvent.location,
            attendees: body.attendees?.map((email: string) => ({ email })),
          };
          
          await googleCalendarService.updateEvent(existingEvent.googleEventId, googleEvent);
        }
      } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        // Continue even if Google update fails
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE: Remove event
export async function DELETE(request: NextRequest) {
  try {
    const uid = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    const eventRef = db.collection('users').doc(uid).collection('events').doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const existingEvent = eventDoc.data() as CalendarEvent;
    
    // Delete from Google Calendar if synced
    if (existingEvent.syncedToGoogle && existingEvent.googleEventId) {
      try {
        const tokens = searchParams.get('tokens');
        if (tokens) {
          googleCalendarService.setCredentials(JSON.parse(tokens));
          await googleCalendarService.deleteEvent(existingEvent.googleEventId);
        }
      } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        // Continue with Firestore deletion even if Google deletion fails
      }
    }
    
    // Delete from Firestore
    await eventRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}