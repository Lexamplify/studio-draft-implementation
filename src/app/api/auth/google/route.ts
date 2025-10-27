import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarService } from '@/lib/google-calendar';

// Initiate Google OAuth flow
export async function GET(request: NextRequest) {
  try {
    const authUrl = googleCalendarService.getAuthUrl();
    
    return NextResponse.json({ 
      authUrl,
      message: 'Redirect user to this URL to authorize Google Calendar access'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}

// Handle OAuth callback and store tokens
export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();
    
    if (!code || !userId) {
      return NextResponse.json({ error: 'Authorization code and user ID are required' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokens(code);
    
    // TODO: Store tokens in database associated with userId
    // For now, we'll return the tokens (in production, store securely)
    console.log('Google Calendar tokens obtained for user:', userId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Google Calendar access granted',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      }
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.json({ error: 'Failed to complete OAuth flow' }, { status: 500 });
  }
}

