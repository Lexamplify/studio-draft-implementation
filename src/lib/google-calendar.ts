import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Google Calendar API configuration
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface LocalEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: string;
  priority: string;
  location?: string;
  attendees?: string;
  caseId?: string;
  googleEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
  }

  // Generate Google OAuth URL for user authorization
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  // Set user's stored tokens
  setCredentials(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
  }

  // Create a calendar event
  async createEvent(event: GoogleCalendarEvent): Promise<any> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          attendees: event.attendees,
          reminders: event.reminders || {
            useDefault: true,
          },
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  // Update a calendar event
  async updateEvent(eventId: string, event: GoogleCalendarEvent): Promise<any> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          attendees: event.attendees,
          reminders: event.reminders || {
            useDefault: true,
          },
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  // Delete a calendar event
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  // Get events from Google Calendar
  async getEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw error;
    }
  }

  // Convert local event to Google Calendar event format
  convertToGoogleEvent(localEvent: LocalEvent): GoogleCalendarEvent {
    const startDateTime = localEvent.time 
      ? `${localEvent.date}T${localEvent.time}:00`
      : localEvent.date;
    
    const endDateTime = localEvent.time 
      ? `${localEvent.date}T${localEvent.time}:00`
      : localEvent.date;

    return {
      summary: localEvent.title,
      description: localEvent.description || `Case Event: ${localEvent.type}`,
      start: {
        dateTime: localEvent.time ? startDateTime : undefined,
        date: localEvent.time ? undefined : localEvent.date,
        timeZone: 'Asia/Kolkata', // Default to Indian timezone
      },
      end: {
        dateTime: localEvent.time ? endDateTime : undefined,
        date: localEvent.time ? undefined : localEvent.date,
        timeZone: 'Asia/Kolkata',
      },
      location: localEvent.location,
      attendees: localEvent.attendees ? 
        localEvent.attendees.split(',').map(email => ({ email: email.trim() })) : 
        undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
    };
  }

  // Convert Google Calendar event to local event format
  convertFromGoogleEvent(googleEvent: any, caseId?: string): Partial<LocalEvent> {
    const start = googleEvent.start?.dateTime || googleEvent.start?.date;
    const end = googleEvent.end?.dateTime || googleEvent.end?.date;
    
    return {
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      date: start ? start.split('T')[0] : new Date().toISOString().split('T')[0],
      time: start && start.includes('T') ? start.split('T')[1].substring(0, 5) : undefined,
      type: 'Meeting',
      priority: 'medium',
      location: googleEvent.location,
      attendees: googleEvent.attendees?.map((a: any) => a.email).join(', '),
      caseId,
      googleEventId: googleEvent.id,
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();

