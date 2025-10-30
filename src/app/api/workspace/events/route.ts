import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const userId = 'current-user-id'; // TODO: Get from auth

    let query = db.collection('events')
      .where('userId', '==', userId);

    // If caseId is provided and not empty/null, only get events for that specific case
    // If caseId is not provided, get only general workspace events (where caseId is null)
    if (caseId && caseId !== 'null' && caseId !== 'undefined' && caseId.trim() !== '') {
      query = query.where('caseId', '==', caseId);
    } else {
      // When no caseId is provided, only get general workspace events (where caseId is null)
      query = query.where('caseId', '==', null);
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter upcoming events (next 30 days) and sort on client side
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= thirtyDaysFromNow;
    });

    // Sort by date and time
    upcomingEvents.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // If dates are the same, sort by time
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    });

    return NextResponse.json({ events: upcomingEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, date, time, type, priority, location, attendees, caseId } = await request.json();
    const userId = 'current-user-id'; // TODO: Get from auth

    const eventData = {
      title,
      description,
      date,
      time,
      type,
      priority,
      location,
      attendees,
      caseId: caseId || null,
      userId,
      syncedToGoogle: false,
      googleEventId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create event in database
    const docRef = await db.collection('events').add(eventData);

    // Automatically sync to Google Calendar if credentials are available
    try {
      const { googleCalendarService } = await import('@/lib/google-calendar');
      
      // Check if we have Google Calendar credentials (you can set these as environment variables)
      const googleTokens = {
        access_token: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
        expiry_date: process.env.GOOGLE_CALENDAR_EXPIRY_DATE,
      };

      if (googleTokens.access_token) {
        googleCalendarService.setCredentials(googleTokens);

        const googleEvent = googleCalendarService.convertToGoogleEvent({
          id: docRef.id,
          ...eventData,
        });

        const createdGoogleEvent = await googleCalendarService.createEvent(googleEvent);

        // Update local event with Google Calendar ID
        await docRef.update({
          googleEventId: createdGoogleEvent.id,
          syncedToGoogle: true,
        });

        console.log('Event automatically synced to Google Calendar:', createdGoogleEvent.id);
      }
    } catch (googleError) {
      console.error('Failed to auto-sync to Google Calendar:', googleError);
      // Don't fail the entire request if Google sync fails
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
