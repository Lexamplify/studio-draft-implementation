# Firestore Contact Form Collections

This document describes the Firestore collections used for contact form submissions.

## Collections

### 1. `contactSubmissions`
Stores submissions from the main contact form.

**Structure:**
```typescript
{
  name: string;
  email: string;
  inquiryType: "Demo" | "Waitlist" | "Partnership" | "Feedback" | "Other";
  message: string;
  submittedAt: Timestamp;
  status: "new" | "contacted" | "resolved";
}
```

**Usage:**
- Created by: Contact form component (`src/components/contact-form.tsx`)
- Requires: User authentication
- Access: Only creation allowed from client, reads/updates must be done server-side

### 2. `demoRequests`
Stores demo requests from the "Book a Demo" banner.

**Structure:**
```typescript
{
  email: string;
  submittedAt: Timestamp;
  status: "new" | "contacted" | "resolved";
  source: "demo_banner";
}
```

**Usage:**
- Created by: Contact section component (`src/components/sections/contact-section.tsx`)
- Requires: No authentication (allows anonymous submissions for lead generation)
- Access: Only creation allowed from client

## Security Rules

See `firestore.rules` for complete security configuration. Key points:
- `contactSubmissions`: Requires authenticated user, creation only
- `demoRequests`: Allows anonymous submissions, creation only
- Both collections prevent client-side reads, updates, or deletes for data security

## Viewing Submissions

To view and manage submissions:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Find the `contactSubmissions` and `demoRequests` collections
5. View and manage submissions

## Deployment

To deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

Or deploy everything:
```bash
firebase deploy
```

