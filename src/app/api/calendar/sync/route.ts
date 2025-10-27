import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService, LocalEvent } from '@/lib/google-calendar';
import { db } from '@/lib/firebase-admin';

// Sync local event to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const { eventId, userId, tokens } = await request.json();
    
    if (!eventId || !userId || !tokens) {
      return NextResponse.json({ error: 'Event ID, user ID, and tokens are required' }, { status: 400 });
    }

    // Set user's tokens
    googleCalendarService.setCredentials(tokens);

    // Get local event from database (use nested path)
    const eventDoc = await db.collection('users').doc(userId).collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const localEvent = { id: eventDoc.id, ...eventDoc.data() } as LocalEvent;

    // Convert to Google Calendar format
    const googleEvent = googleCalendarService.convertToGoogleEvent(localEvent);

    // Create event in Google Calendar
    const createdEvent = await googleCalendarService.createEvent(googleEvent);

    // Update local event with Google Calendar ID
    await db.collection('users').doc(userId).collection('events').doc(eventId).update({
      googleEventId: createdEvent.id,
      syncedToGoogle: true,
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      googleEventId: createdEvent.id,
      message: 'Event synced to Google Calendar'
    });
  } catch (error) {
    console.error('Error syncing event to Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to sync event to Google Calendar' }, { status: 500 });
  }
}

// Update Google Calendar event
export async function PUT(request: NextRequest) {
  try {
    const { eventId, userId, tokens, eventData } = await request.json();
    
    if (!eventId || !userId || !tokens) {
      return NextResponse.json({ error: 'Event ID, user ID, and tokens are required' }, { status: 400 });
    }

    // Set user's tokens
    googleCalendarService.setCredentials(tokens);

    // Get local event from database (use nested path)
    const eventDoc = await db.collection('users').doc(userId).collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const localEvent = { id: eventDoc.id, ...eventDoc.data() } as LocalEvent;

    if (!localEvent.googleEventId) {
      return NextResponse.json({ error: 'Event not synced to Google Calendar' }, { status: 400 });
    }

    // Convert updated data to Google Calendar format
    const updatedLocalEvent = { ...localEvent, ...eventData };
    const googleEvent = googleCalendarService.convertToGoogleEvent(updatedLocalEvent);

    // Update event in Google Calendar
    await googleCalendarService.updateEvent(localEvent.googleEventId, googleEvent);

    // Update local event
    await db.collection('users').doc(userId).collection('events').doc(eventId).update({
      ...eventData,
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Google Calendar event updated'
    });
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return NextResponse.json({ error: 'Failed to update Google Calendar event' }, { status: 500 });
  }
}

// Delete Google Calendar event
export async function DELETE(request: NextRequest) {
  try {
    const { eventId, userId, tokens } = await request.json();
    
    if (!eventId || !userId || !tokens) {
      return NextResponse.json({ error: 'Event ID, user ID, and tokens are required' }, { status: 400 });
    }

    // Set user's tokens
    googleCalendarService.setCredentials(tokens);

    // Get local event from database (use nested path)
    const eventDoc = await db.collection('users').doc(userId).collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const localEvent = { id: eventDoc.id, ...eventDoc.data() } as LocalEvent;

    if (!localEvent.googleEventId) {
      return NextResponse.json({ error: 'Event not synced to Google Calendar' }, { status: 400 });
    }

    // Delete event from Google Calendar
    await googleCalendarService.deleteEvent(localEvent.googleEventId);

    // Update local event to remove Google Calendar reference
    await db.collection('users').doc(userId).collection('events').doc(eventId).update({
      googleEventId: null,
      syncedToGoogle: false,
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Google Calendar event deleted'
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return NextResponse.json({ error: 'Failed to delete Google Calendar event' }, { status: 500 });
  }
}
