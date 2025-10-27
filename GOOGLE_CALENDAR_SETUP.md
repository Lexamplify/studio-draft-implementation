# Google Calendar Integration Setup

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Automatic Google Calendar Sync (Optional)
GOOGLE_CALENDAR_ACCESS_TOKEN=your_access_token_here
GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_CALENDAR_EXPIRY_DATE=your_expiry_date_here
```

## Google Cloud Console Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required fields:
     - App name: "LexAmplify"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`

## Features Implemented

### 1. Automatic Google Calendar Sync
- **Functionality**: Events are automatically synced to Google Calendar when created
- **Configuration**: Set environment variables for automatic sync
- **Fallback**: If sync fails, events are still created locally
- **No User Interaction**: Completely automatic, no buttons or user prompts

### 2. API Endpoints
- **`/api/auth/google`**: OAuth authentication flow (for manual setup)
- **`/api/calendar/sync`**: Manual sync/unsync events
- **`/api/calendar/events`**: Fetch Google Calendar events
- **`/api/workspace/events`**: Enhanced with automatic Google sync support

### 3. Event Creation with Auto-Sync
- **Automatic**: Events are automatically synced when created
- **Error Handling**: Graceful fallback if Google sync fails
- **Status Tracking**: Events track their sync status

## Usage Instructions

### For Users

1. **Automatic Sync**
   - Create events normally through the UI
   - Events are automatically synced to Google Calendar (if configured)
   - No user interaction required

2. **Event Management**
   - All events show sync status
   - Events work normally even if Google sync is not configured

### For Developers

1. **Environment Setup**
   - Add Google API credentials to `.env.local`
   - Set automatic sync tokens (optional)
   - Ensure Google Calendar API is enabled in Google Cloud Console

2. **Automatic Integration**
   - Events are automatically synced when created
   - Sync status is tracked in the database
   - Failed syncs don't prevent local event creation

3. **Configuration**
   - Set `GOOGLE_CALENDAR_ACCESS_TOKEN` for automatic sync
   - Set `GOOGLE_CALENDAR_REFRESH_TOKEN` for token refresh
   - Set `GOOGLE_CALENDAR_EXPIRY_DATE` for token expiry

## Security Considerations

- **Token Storage**: Server-side environment variables (secure)
- **HTTPS Required**: Google OAuth requires HTTPS in production
- **Scope Limitation**: Only calendar access is requested
- **Token Expiry**: Automatic handling of expired tokens

## Future Enhancements

1. **Bidirectional Sync**: Sync changes from Google Calendar back to local events
2. **Bulk Operations**: Sync all events at once
3. **Calendar Selection**: Choose which Google Calendar to sync to
4. **Event Categories**: Map local event types to Google Calendar categories
5. **Recurring Events**: Support for recurring events
6. **Attendee Management**: Sync attendee information
7. **Reminder Settings**: Customize Google Calendar reminders
