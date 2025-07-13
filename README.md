# 🚀 Major Achievements & Technical Milestones (Today)

## 

# LegalEase AI - Firebase Studio Project

Welcome to LegalEase AI, a Next.js application built in Firebase Studio. This application serves as an intelligent assistant for legal queries and document drafting, leveraging AI capabilities for enhanced productivity.

## Table of Contents

- [Overview](#overview)
- [Key Technologies](#key-technologies)
- [Core Features](#core-features)
  - [Assistant Page (Homepage)](#assistant-page-homepage)
  - [Drafting Functionality (Draft Page)](#drafting-functionality-draft-page)
  - [Document Vault (Vault Page)](#document-vault-vault-page)
  - [Calendar Page](#calendar-page)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation & Running](#installation--running)
- [Project Structure Highlights](#project-structure-highlights)
- [AI Integration (Genkit)](#ai-integration-genkit)
- [Authentication](#authentication)
- [Vault Firestore Data Model (User-Specific)](#vault-firestore-data-model-user-specific)
  - [Structure](#structure)
  - [Benefits](#benefits)
  - [Migration](#migration)

## Overview

LegalEase AI provides a user-friendly interface for legal professionals to:
- Get quick answers to legal questions via an AI chat.
- Search for legal document templates.
- Draft new documents, with the ability to edit Google Docs directly within the app.
- Manage case files and associated documents.
- Track important dates and events with an integrated calendar.

The application is designed to be intuitive and integrate seamlessly with AI tools for a modern legal workflow.

## Key Technologies

- **Next.js (App Router)**: For the frontend framework, server-side rendering, and routing.
- **React**: For building user interfaces.
- **ShadCN UI Components**: For a pre-built, customizable component library.
- **Tailwind CSS**: For utility-first styling.
- **Genkit (Firebase Genkit)**: For integrating Generative AI functionalities (e.g., Gemini models).
  - Specifically `gemini-1.5-flash` for chat and content generation.
- **TypeScript**: For static typing and improved code quality.
- **Lucide React**: For icons.
- **Firebase Firestore**: For database (mock case data, document metadata).
- **Firebase Storage**: For file storage (mock document uploads).
- **date-fns**: For date utilities in the Calendar feature.

## Core Features

The application is primarily divided into sections accessible via the sidebar: Assistant (Home), Draft, Vault, and Calendar.

### Assistant Page (Homepage)

#### Purpose

Acts as a central launchpad for lawyers, providing AI-powered legal assistance, document analysis, and workflow shortcuts. The assistant streamlines legal work by centralizing chat, document handling, and expert guidance.

#### Key Features

- **Chat Interface:** Core chat for user queries, document uploads, and AI responses.
- **Quick Actions:** Workflow shortcuts (e.g., draft documents, view cases).
- **Calendar Widget:** Shows upcoming legal events.
- **File Upload:** Allows users to upload legal documents for analysis.
- **Prompt Suggestions:** Offers quick legal questions and actions.

#### Architecture & File Structure

| What                | Where (File)                                 | How (Key Logic)                                 |
|---------------------|----------------------------------------------|-------------------------------------------------|
| Page Orchestration  | `src/app/(app)/assistant/page.tsx`           | State, layout, file upload, workflow triggers    |
| Chat Logic          | `src/components/ChatInterface.tsx`           | Chat, file processing, AI calls, prompt sugg.    |
| Chat Input UI       | `src/components/Assistant/ChatBar.tsx`        | Input, upload, send, chat history                |
| Workflow Shortcuts  | `src/components/Assistant/QuickActions.tsx`   | Navigation, workflow triggers                    |
| Calendar            | `src/components/Assistant/CalendarWidget.tsx` | Upcoming events, calendar link                   |
| AI Flows            | `src/ai/flows/legal-advice-chat.ts`, ...      | AI chat, document analysis                       |

#### How It Works

- **Page Orchestration (`assistant/page.tsx`):**
  - Manages state for uploaded files and workflow triggers.
  - Renders the main chat area (`ChatInterface`), sidebar (`CalendarWidget`, `QuickActions`), and handles file uploads.

- **Chat Interface (`ChatInterface.tsx`):**
  - Manages chat history, input, loading, uploaded files, and extracted document data.
  - Handles file uploads (text, JSON, PDF, DOCX, images), converting files to base64 for AI processing.
  - Uses Genkit (AI backend) for document extraction and analysis.
  - User sends a message or uploads a file, which is processed and sent to the AI (legalAdviceChat, processDocument).
  - AI response is appended to chat history.
  - Offers prompt suggestions for quick legal questions.

- **Chat Bar (`ChatBar.tsx`):**
  - UI for chat input, file upload button, and send button.
  - Displays chat history with user/assistant roles.
  - Handles file selection and triggers upload logic.

- **Quick Actions (`QuickActions.tsx`):**
  - Renders navigation cards for common workflows (drafting, viewing cases).
  - Can trigger workflow-specific prompts in the chat.

- **Calendar Widget (`CalendarWidget.tsx`):**
  - Displays a static list of upcoming events.
  - Provides a link to the full calendar.

- **AI Logic:**
  - Abstracted in the `src/ai/flows/` directory, called from ChatInterface.
  - Handles both chat and document analysis.

#### Technologies Used

- **React/Next.js** for UI and state management.
- **Genkit (Firebase Genkit)** for AI chat and document analysis.
- **Tailwind CSS** for styling.
- **ShadCN UI** for UI components.
- **TypeScript** for type safety.

#### Summary

The Assistant page is the entry point for AI-powered legal workflows. It integrates chat, document analysis, workflow shortcuts, and event tracking in a single, responsive interface. The architecture is modular, with clear separation between UI, state management, and AI logic, making it easy to extend and maintain.

### Drafting Functionality (Draft Page - `/draft`)

- **Purpose**: Enables users to find legal document templates, view/edit them (especially Google Docs), and get AI assistance during the drafting process.
- **Functionality**:
   1. Legal Document Drafting & Template Search System
- **Template Storage:**
  - All legal document templates (DOCX, Google Docs, etc.) are stored in Firebase Storage under the `templates/` folder.
  - Metadata and vector embeddings for each template are stored in Firestore for fast retrieval and semantic search.
- **Python Automation:**
  - A Python script (`scripts/upload_templates_with_embeddings.py`) was created to:
    - Scan the `templates/` directory for DOCX files.
    - Extract metadata (title, description) from each file.
    - Generate vector embeddings using the `all-MiniLM-L6-v2` model (via `sentence-transformers`).
    - Upload each DOCX to Firebase Storage and store its public URL.
    - Save all metadata and embeddings to Firestore for later search.
  - **Bucket Name:** The correct bucket name for this project is `legalease-prod.firebasestorage.app` (as shown in the Firebase Console).

## 2. Vector Search API for Templates
- **FastAPI Backend:**
  - Implemented a FastAPI backend endpoint to handle template search:
    - Embeds the user query using the same MiniLM model.
    - Fetches all template embeddings from Firestore.
    - Computes cosine similarity and returns the top N most relevant templates.
  - **Frontend Integration:**
    - The frontend search handler now calls this API for template search.
    - The old LLM-based search was removed for speed and scalability.
  - **CORS:**
    - CORS middleware was added to the FastAPI backend to allow frontend requests.

## 3. Google Drive Copy & Edit Flow
- **Google Authentication:**
  - Integrated Google OAuth on the frontend using `@react-oauth/google`.
  - Users must sign in and grant Drive access to copy/edit templates.
- **Copy-to-Drive API:**
  - Implemented a Next.js API route (`/products/api/copy-to-drive`) to handle copying templates to the user's Google Drive:
    - **Google Docs:** Uses the Drive API to copy the doc directly.
    - **DOCX:** Downloads the file (using a signed URL if private), uploads it to Drive, and converts it to a Google Doc for editing.
  - **Signed URLs:**
    - Always generates a signed URL for DOCX files in Firebase Storage to ensure private files are accessible for download/upload.
    - Handles both Firebase Storage and Google Cloud Storage URL formats.
- **Frontend Flow:**
  - After login, users can copy a template to their Drive and immediately open it for editing in Google Docs.

## 4. Bucket Name & API Routing Troubleshooting
- **Bucket Name:**
  - The correct bucket name for all backend and SDK usage is `legalease-prod.firebasestorage.app` (not `.appspot.com`).
  - The bucket name must match exactly what is shown in the Firebase Console (`gs://legalease-prod.firebasestorage.app`).
- **API Routing:**
  - The project uses a custom `src` directory and a basePath (`/products`), so all API routes must be accessed via `/products/api/...`.
  - Conflicts between app directory and pages API routes were resolved by deleting the duplicate app directory route and using a pages API route for `/api/copy-to-drive`.
- **Node.js Compatibility:**
  - The backend logic for file streaming and Google Drive upload was moved to a pages API route to ensure Node.js runtime compatibility (fixing issues like `part.body.pipe is not a function`).

## 5. Google OAuth & Cloud Console Fixes
- **OAuth Errors Fixed:**
  - Updated Google Cloud Console settings to add correct origins and redirect URIs.
  - Added the user as a test user to resolve app verification and test user restrictions.
  
## 7.  **My Drafts (Robust, Real-Time)**:
        - When a user copies a template to Google Drive, the backend saves a draft record in Firestore under `users/{uid}/drafts/{fileId}`.
        - The draft record includes: fileId, fileName, Google Doc URL, templateType, and creation timestamp.
        - The frontend uses Firebase Auth (modular SDK) to authenticate the user and fetch drafts.
        - As soon as a draft is saved, the UI refetches and displays the latest drafts under "My Drafts"—no reload required.
        - This ensures a seamless, real-time experience for users managing their drafts.
- **Key Component**: `src/app/(app)/draft/page.tsx`

## 8. Final System Capabilities
- **Template Search:**
  - Users can search for legal templates using fast, scalable vector search.
- **Template Copy & Edit:**
  - Users can copy both Google Docs and DOCX templates to their Google Drive and edit them in Google Docs.
- **File Access:**
  - Private files in Firebase Storage are handled via signed URLs for secure access.
- **Robust Routing:**
  - All API endpoints are correctly routed and compatible with the custom Next.js setup.

# ⚠️ Google Docs Embedding Limitation & CSP Errors

## Issue
- Google Docs (and other Google services) set a strict Content Security Policy (CSP) header that prevents their pages from being embedded in an iframe on non-Google domains.
- Attempting to embed a Google Doc editor in an iframe will result in browser console errors like:
  - `Refused to frame 'https://docs.google.com/' because an ancestor violates the following Content Security Policy directive: "frame-ancestors ...".`
- Additional warnings about cross-origin policies and clipboard permissions may also appear.

## Impact
- The Google Docs editor may appear to load in an iframe, but many features will break, and Google can block this at any time.
- This is a security measure by Google and cannot be bypassed for public apps.

## Best Practice
- **Always open the Google Doc in a new tab or window for editing.**
- Example:
  ```js
  window.open(googleDocUrl, '_blank');
  ```
- This is the only reliable, Google-supported way for most apps.

## Reference
- [Google Docs API](https://developers.google.com/docs/api)
- [Content Security Policy: frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)

---
    

### Document Vault (Vault Page - `/vault`)

- **Purpose**: A central repository for managing case files and their associated documents.
- **Functionality**:
    - **Case Listing**: Displays a list of "cases" (mock data fetched from Firestore `cases` collection) as project cards.
    - **Case Detail View (`/vault/[caseId]`)**:
        - Clicking a case card navigates to a page displaying files associated with that case.
        - Files are fetched from a subcollection in Firestore (`cases/[caseId]/files`).
        - **File Operations**:
            - Upload new files (PDF, DOCX) to Firebase Storage, with metadata saved to Firestore.
            - List files with name, type, last modified date.
            - View/Download files.
            - Delete selected files (from both Storage and Firestore).
        - Search/filter files within a case.
- **Key Components**:
    - `src/app/(app)/vault/page.tsx` (Case listing)
    - `src/app/(app)/vault/[caseId]/page.tsx` (Case detail / file management)
    - `src/app/(app)/vault/_components/project-card.tsx`
    - `src/app/(app)/vault/_components/file-list.tsx`

### Vault UI Enhancements
- Each case card in the Vault now displays:
  - Petitioner name
  - Respondent name
  - Judge name
  - Filing date
  - Last modified date (of any file in the case)
  - File count
- This provides a richer, more informative user experience for managing cases.

### Calendar Page (`/calendar`)

- **Purpose**: Allows users to manage their schedule and important legal deadlines.
- **Functionality**:
    - **View Toggles**: Buttons to switch between Month, Week (placeholder), and Day (placeholder) views.
    - **Month View**: Displays a traditional calendar grid for the selected month.
        - Navigation for previous/next month.
        - Highlights the current day.
        - Displays mock events within day cells.
    - **Event Management (Conceptual/Mock)**:
        - "Create Event" button (shows toast).
        - "Sync with Google Calendar" button (shows toast).
        - Clicking on a day in month view can show details or switch to day view.
        - Mock events can be "deleted" from the local state.
- **Key Component**: `src/app/(app)/calendar/page.tsx`

### Dedicated Chat Page (`/chat`)

- **Purpose**: Provides a focused interface for AI chat interactions.
- **Functionality**:
    - Accessible when a user submits a query via the Assistant page's search bar.
    - The query (and an initial file context if uploaded) is passed via URL parameters.
    - Uses the `legalAdviceChat` Genkit flow (`src/ai/flows/legal-advice-chat.ts`) for responses.
    - Displays chat history with user and assistant messages.
    - Includes suggested prompts if the chat is initiated without a query.
- **Key Component**: `src/app/(app)/chat/page.tsx` and `src/app/(app)/chat/_components/ChatInterface.tsx`.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Firebase Project:
    - Firestore enabled (Native mode)
    - Firebase Storage enabled
    - Firebase Hosting (optional, for deployment)
    - Firebase App configured for web

### Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# For Genkit AI (Google Gemini)
GOOGLE_API_KEY=your_google_api_key_for_gemini_models

# For Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

Replace `your_...` placeholders with your actual Firebase project credentials and Google API Key.

### Installation & Running

1.  **Clone the repository (if applicable).**
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Run the Next.js development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The application will typically be available at `http://localhost:9002`.

4.  **Run the Genkit development server (in a separate terminal):**
    ```bash
    npm run genkit:dev
    # or
    # yarn genkit:dev
    ```
    Genkit usually runs on `http://localhost:3100`. This is necessary for the AI chat features to work.

5.  **Firebase Emulators (Optional but Recommended for Local Development):**
    If you want to test Firestore and Storage locally without affecting your live Firebase project, set up and use the Firebase Emulators.
    - Install Firebase CLI: `npm install -g firebase-tools`
    - Login: `firebase login`
    - Initialize Emulators: `firebase init emulators` (select Firestore and Storage)
    - Start Emulators: `firebase emulators:start`
    Your `firebaseClient.ts` might need slight adjustments to connect to emulators if not configured automatically.

## Project Structure Highlights

- `src/app/(app)/`: Contains the main application pages (Assistant, Draft, Vault, Calendar, Chat) and their layouts.
    - `assistant/`: Homepage/dashboard components.
    - `draft/`: Document drafting interface.
    - `vault/`: Case and file management.
    - `calendar/`: Calendar interface.
    - `_components/`: Shared components within the `(app)` group, like the sidebar.
- `src/ai/`: Houses Genkit AI flows and configurations.
    - `flows/`: Specific AI capabilities like `legal-advice-chat.ts`.
    - `genkit.ts`: Genkit plugin and model configuration (uses `gemini-1.5-flash`).
    - `dev.ts`: Entry point for running Genkit in development.
- `src/components/`: Shared UI components.
    - `ui/`: ShadCN UI components.
    - `icons.tsx`: Custom icon definitions using Lucide React.
    - `client-formatted-time.tsx`: Component for client-side date formatting.
- `src/types/`: TypeScript type definitions (`index.ts`, `types.ts`).
- `src/hooks/`: Custom React hooks (e.g., `use-toast.ts`, `use-mobile.ts`).
- `src/lib/`: Utility functions and Firebase client initialization (`firebaseClient.ts`, `utils.ts`).
- `public/`: Static assets.
- `tailwind.config.ts`: Tailwind CSS configuration.
- `next.config.ts`: Next.js configuration.
- `package.json`: Project dependencies and scripts.
- `.env`: For environment variables (API keys, Firebase config). **Ensure this is in your .gitignore!**

## AI Integration (Genkit)

- **Genkit Setup**: Configured in `src/ai/genkit.ts` to use the Google AI plugin with the `gemini-1.5-flash` model by default.
- **Flows**:
    - `legalAdviceChat` (`src/ai/flows/legal-advice-chat.ts`): Powers the AI chat functionality. Takes a user's question and optional chat history to provide legal information.

This README provides a comprehensive overview. For more specific details on individual components or flows, please refer to the JSDoc comments and code within the respective files.

## Authentication

This app uses Firebase Authentication for user login. Users must log in to access the main application features. Unauthenticated users are redirected to `/login`.

- **Login page:** `/login`
- **Protected routes:** All routes under `/products` except `/login` require authentication.
- **How it works:**
  - If a user is not logged in, they are redirected to `/login`.
  - After successful login, users are redirected to `/products/assistant`.

## Vault Firestore Data Model (User-Specific)

### Structure
- Each user's cases are stored under their UID:
  - `/users/{uid}/cases/{caseId}`
  - Each case document contains metadata (petitioner, respondent, judge, filing date, etc.)
  - Files for a case are stored as `/users/{uid}/cases/{caseId}/files/{fileId}`

### Benefits
- Only the logged-in user's cases are visible to them in the Vault.
- Easy to query, secure, and scalable for multi-user environments.
- File count and metadata are easily accessible for each case.

### Migration
- New cases are now created under `/users/{uid}/cases/` using the current user's UID (see case creation logic).
- (Optional) Existing cases can be migrated if needed.

### File Storage Update
- All file uploads, fetches, and deletes are now performed under `/users/{uid}/cases/{caseId}/files`.
- This ensures that files are private and isolated per user, matching the new Vault and case structure.

### Robust Auth State Handling
- The app uses a custom `useFirebaseUser` React hook to safely access the current Firebase user and loading state.
- All Firestore data fetching (Vault, Case, etc.) is gated on `!loading && user`.
- This prevents 'Not logged in' errors and empty data on page refresh, ensuring a seamless user experience.
