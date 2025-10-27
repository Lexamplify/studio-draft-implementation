# Legal 3-Pane Interface - UI Components and Interactions Documentation

## Overview

This document describes the modern legal 3-pane interface implementation with AI-powered chat, document analysis, case management, and draft editing capabilities. The interface consists of three main panes: Main Navigation, Left Panel (Cases & Chats), and Dynamic Main Content Area with comprehensive loading animations and file handling.

## Architecture

### Component Hierarchy
```
ThreeColumnLayout
├── MainNavigation (Far Left - Collapsed)
├── LeftPanel (Middle-Left - Cases & Chats)
│   ├── Cases Section (with skeleton loading)
│   ├── Chats Section (with skeleton loading)
│   └── Case Creation Modal
└── MiddlePanel (Right - Dynamic)
    ├── MainChatWindow (Chat Mode)
    │   ├── Chat Header (with title loading animation)
    │   ├── Message Area (with skeleton loading)
    │   ├── File Upload & Display
    │   └── Document Viewer Modal
    └── DraftEditorInterface (Draft Editor Mode)
        ├── EditorPane (Left 2/3)
        └── AIEditingPane (Right 1/3)
```

## 1. Main Navigation Pane (Far Left)

### Component: `MainNavigation`
**File:** `src/components/layout/main-navigation.tsx`

#### UI Structure
- **Width:** Fixed at `w-16` (64px)
- **Background:** Dark gray (`bg-gray-800`)
- **Layout:** Vertical stack with logo, navigation items, and profile

#### Content
1. **Logo Section**
   - Small blue square with "L" initial
   - Positioned at top

2. **Navigation Items**
   - Cases (briefcase icon)
   - Drafts (fileLines icon) 
   - Chat (comments icon) - **Default Active**
   - Each item: 48x48px button with hover states

3. **Profile Section**
   - User avatar at bottom
   - Positioned with `mt-auto`

#### Interactions
- **Click Navigation Items:** Changes active mode and updates app context
- **Hover States:** Gray background (`bg-gray-700`) and white text
- **Active State:** Gray background (`bg-gray-700`) with white text

#### Database Links
- Uses `useAppContext()` to manage state
- Calls `setActiveView()` to update application state

---

## 2. Left Panel (Middle-Left)

### Component: `LeftPanel`
**File:** `src/components/layout/left-panel.tsx`

#### UI Structure
- **Width:** `w-80` (320px) fixed width
- **Background:** White (`bg-white`)
- **Layout:** Header + Cases Section + Chats Section + Case Creation Modal

#### Content Sections

### 2.1 Header Section
- **Title:** "Cases & Chats"
- **New Case Button:** Prominent blue button with plus icon

### 2.2 Cases Section
- **Header:** "CASES" with count
- **Loading State:** Skeleton loading animation (`CaseSkeletonList`)
- **Case List:** Scrollable list of cases
- **Case Items:** Case name with folder icon and 3-dots menu
- **Hover Actions:** Rename, delete options

### 2.3 Chats Section
- **Header:** "CHATS" with count
- **Loading State:** Skeleton loading animation (`ChatSkeletonList`)
- **Chat List:** Scrollable list of chats
- **Chat Items:** Chat title with message icon and 3-dots menu
- **Loading Chat Items:** Blurred loading animation (no 3-dots menu)

### 2.4 Case Creation Modal
- **Trigger:** "New Case" button in header
- **Content:** Form with case details and document upload
- **AI Analysis:** Automatic document analysis for case metadata
- **File Support:** PDF, DOCX, DOC, TXT files

#### Loading Animations
- **Cases Loading:** `CaseSkeletonList` - 3 skeleton case items
- **Chats Loading:** `ChatSkeletonList` - 3 skeleton chat items
- **Title Loading:** `ChatTitleLoading` - blurred box animation for generating titles
- **Message Loading:** `MessageSkeletonList` - skeleton messages in chat area

#### Interactions
- **New Case:** Opens case creation modal with document upload
- **Case Click:** Selects case, updates context
- **Chat Click:** Selects chat, loads in main window
- **3-Dots Menu:** Rename, delete, link to case options
- **Document Upload:** AI-powered case analysis and metadata extraction

#### Database Links
- **Cases:** `useCases()` from `CasesContext`
- **Chats:** `useChats()` from `ChatsContext`
- **State Management:** `useAppContext()` for selections
- **File Storage:** Firebase Storage + Firestore for document persistence

---

## 3. Main Content Area (Right - Dynamic)

### 3.1 Chat Mode - Main Chat Window

#### Component: `MainChatWindow`
**File:** `src/components/chat/main-chat-window.tsx`

#### UI Structure
- **Layout:** Full height with header, chat area, and input bar
- **Background:** White (`bg-white`)
- **Loading States:** Comprehensive skeleton loading animations

#### Content Sections

### 3.1.1 Dynamic Header
**General Chat:**
- Shows editable chat title with loading animation
- Title generation with blurred loading box
- "Create New Case" button

**Case-Linked Chat:**
- Case title prominently displayed
- Chat title below case title with loading animation
- "View Case" button (external link icon)

### 3.1.2 Chat History Area
- **User Messages:** Blue bubble, right-aligned with file attachments
- **AI Messages:** Gray bubble, left-aligned
- **File Display:** Clickable file cards with document viewer
- **Timestamps:** Small text below each message
- **Loading States:** `MessageSkeletonList` when switching chats
- **Typing Indicator:** Animated dots when AI is responding

### 3.1.3 Advanced Input Bar
- **File Upload:** Drag & drop or click to upload
- **File Preview:** Staged files with remove option
- **Text Input:** Full-width input field
- **Send Button:** Blue send button with send icon
- **File Support:** PDF, DOCX, DOC, TXT, images

### 3.1.4 Document Viewer Modal
- **PDF Display:** Embedded PDF viewer
- **Image Display:** Full-size image viewer
- **File Info:** File name, size, type
- **Actions:** Open in new tab, download

#### AI Context & Behavior
- **General Chat:** Standard AI knowledge base with file context
- **Case-Linked Chat:** Case-scoped AI with access to case data and files
- **File Integration:** AI can reference uploaded documents
- **Memory:** AI remembers conversation context and file attachments

#### File Management
- **Upload:** Firebase Storage for file storage
- **Persistence:** Firestore for file metadata
- **Context:** Files available to AI in subsequent messages
- **Display:** Files shown with messages, clickable for viewing

#### Database Links
- **Chat Data:** `useChats()` from `ChatsContext`
- **Messages:** `useMessages()` hook with file support
- **File Storage:** Firebase Storage + Firestore
- **Case Data:** `useCases()` from `CasesContext`

---

### 3.2 Draft Editor Mode - Draft Editor Interface

#### Component: `DraftEditorInterface`
**File:** `src/components/drafts/draft-editor-interface.tsx`

#### UI Structure
- **Layout:** Split into Editor Pane (2/3) and AI Editing Pane (1/3)
- **Background:** White (`bg-white`)

### 3.2.1 Editor Pane (Left 2/3)

#### Header
- Draft title
- Reopen workspace button (if collapsed)
- Save and Export buttons

#### Content
- **Rich Text Editor:** Full-height textarea
- **Font:** Georgia serif, 14px, 1.6 line height
- **Features:** Text selection detection

#### Footer
- **Stats:** Word count, character count
- **Formatting:** Bold, italic, list buttons

### 3.2.2 AI Editing Pane (Right 1/3)

#### Header
- "AI Draft Assistant" title
- Context: Current document name

#### Chat History
- **User Messages:** Blue bubble, right-aligned
- **AI Messages:** Gray bubble, left-aligned
- **AI Generated Text:** Blue highlighted box with "Apply" button

#### Input Bar
- **Selected Text Display:** Yellow highlight for selected text
- **Text Input:** "Ask AI to edit, improve, or analyze..."
- **Send Button:** Blue send button

#### AI Functionality
- **Text Selection:** Detects highlighted text for context
- **AI Responses:** Provides improved text suggestions
- **Apply Feature:** One-click application of AI suggestions

#### Database Links
- **Draft Data:** `useDrafts()` hook
- **Content Management:** Local state with save functionality

---

## 4. Loading Animations & UX

### 4.1 Skeleton Loading Components

#### CaseSkeletonList
**File:** `src/components/ui/case-skeleton.tsx`
- **Purpose:** Loading animation for cases list
- **Appearance:** 3 skeleton case items with animated shimmer
- **Usage:** Shown while cases are being fetched

#### ChatSkeletonList  
**File:** `src/components/ui/chat-skeleton.tsx`
- **Purpose:** Loading animation for chats list
- **Appearance:** 3 skeleton chat items with animated shimmer
- **Usage:** Shown while chats are being fetched

#### MessageSkeletonList
**File:** `src/components/ui/message-skeleton.tsx`
- **Purpose:** Loading animation for chat messages
- **Appearance:** Alternating user/AI message skeletons
- **Usage:** Shown when switching between chats

#### ChatTitleLoading
**File:** `src/components/ui/chat-loading-animation.tsx`
- **Purpose:** Loading animation for chat title generation
- **Appearance:** Blurred box with animated shimmer
- **Usage:** Shown while AI generates chat titles

### 4.2 Loading States Flow
1. **Initial Load:** Skeleton lists for cases and chats
2. **Chat Creation:** Title loading animation in header
3. **Chat Switching:** Message skeleton list in chat area
4. **File Upload:** Progress indicators during upload
5. **AI Processing:** Typing indicators during AI responses

---

## 5. State Management

### App Context (`src/context/app-context.tsx`)
```typescript
interface AppContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  selectedDraftId: string | null;
  setSelectedDraftId: (id: string | null) => void;
  chatFiles: ChatFile[];
  addFileToChat: (chatId: string, file: ChatFile) => void;
  removeFileFromChat: (chatId: string, fileId: string) => void;
}
```

### Chats Context (`src/context/chats-context.tsx`)
```typescript
interface ChatsContextType {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  createChat: (data: CreateChatData) => Promise<Chat>;
  updateChat: (id: string, data: UpdateChatData) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  useMessages: (chatId: string) => {
    messages: Message[];
    loading: boolean;
    error: string | null;
    addMessage: (role: 'user' | 'assistant', content: string, files?: any[]) => Promise<Message>;
  };
}
```

### Cases Context (`src/context/cases-context.tsx`)
```typescript
interface CasesContextType {
  cases: Case[];
  loading: boolean;
  error: string | null;
  createCase: (data: CreateCaseData) => Promise<Case>;
  updateCase: (id: string, data: UpdateCaseData) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
}
```

### View Types
- `chatView`: Main chat window
- `draftEditorView`: Draft editor interface
- `caseDetailView`: Case detail view
- `draftListView`: Draft list view

---

## 6. Data Flow

### Chat Mode Flow
1. User clicks chat in left panel
2. `setSelectedChatId()` updates context
3. `setActiveView('chatView')` switches to chat mode
4. `MainChatWindow` loads with chat data and files
5. AI context includes uploaded files and case data

### Case Creation Flow
1. User clicks "New Case" button
2. `CaseCreationModal` opens with document upload
3. Document is parsed and analyzed by AI
4. Case metadata is extracted and populated
5. New case and linked chat are created
6. User is navigated to the new case/chat

### File Upload Flow
1. User uploads file via drag & drop or click
2. File is uploaded to Firebase Storage
3. File metadata is saved to Firestore
4. File is added to chat context
5. AI can reference file in subsequent messages
6. File is displayed with messages, clickable for viewing

### Title Generation Flow
1. User sends first message in new chat
2. Chat is created with "Loading..." title
3. Loading animation appears in header and left panel
4. AI generates smart title based on conversation
5. Title is updated, loading animation disappears
6. Left panel refreshes to show new title

### Message Loading Flow
1. User switches between chats
2. `MessageSkeletonList` appears in chat area
3. Messages are fetched from database
4. Files are loaded and displayed with messages
5. Skeleton loading disappears, content is shown

---

## 6. Responsive Design

### Breakpoints
- **Desktop:** Full 3-pane layout
- **Tablet:** Collapsible workspace sidebar
- **Mobile:** Stacked layout (future enhancement)

### Transitions
- **Sidebar Collapse:** 300ms ease-in-out transition
- **Mode Switching:** Instant view changes
- **Hover States:** 150ms transition

---

## 7. Accessibility Features

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter key to send messages
- Escape key to close modals

### Screen Reader Support
- Proper ARIA labels on all buttons
- Semantic HTML structure
- Alt text for icons

### Visual Indicators
- Clear focus states
- Hover feedback
- Loading states

---

## 8. Future Enhancements

### Planned Features
1. **Real-time Collaboration:** Multiple users editing same draft
2. **Version Control:** Draft version history
3. **Advanced AI Features:** Citation checking, legal research
4. **Mobile App:** Native mobile interface
5. **Offline Support:** Local storage and sync

### API Integration Points
1. **Chat API:** `/api/chat` for message handling
2. **Chat Files API:** `/api/chats/[chatId]/files` for file management
3. **Messages API:** `/api/chats/[chatId]/messages` for message CRUD
4. **Case API:** `/api/cases` for case data
5. **Document Analysis API:** `/api/analyze-document` for AI analysis
6. **Document Parsing API:** `/api/parse-document` for server-side parsing
7. **Title Generation API:** `/api/generate-title` for smart titles
8. **AI API:** `/api/llm` for AI processing

---

## 8. Document Processing & AI Integration

### Document Parsing Pipeline
1. **Client Upload:** Files uploaded via drag & drop or click
2. **Server Processing:** PDF/DOCX/DOC files parsed server-side
3. **AI Analysis:** Document content analyzed for case metadata
4. **Storage:** Files stored in Firebase Storage, metadata in Firestore
5. **Context Integration:** Files available to AI in chat context

### AI Flows
- **Legal Advice Chat:** General legal consultation with file context
- **Document Analysis:** Case metadata extraction from documents
- **Title Generation:** Smart chat titles based on conversation content
- **Case Processing:** Comprehensive case analysis and structuring

### File Support
- **PDF:** Server-side parsing with `pdf-parse`
- **DOCX/DOC:** Server-side parsing with `mammoth`
- **TXT:** Client-side parsing
- **Images:** Direct display in document viewer

---

## 9. File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── main-navigation.tsx
│   │   ├── left-panel.tsx
│   │   ├── middle-panel.tsx
│   │   └── three-column-layout.tsx
│   ├── chat/
│   │   ├── main-chat-window.tsx
│   │   ├── chat-view.tsx
│   │   ├── advanced-chat-input-bar.tsx
│   │   └── file-display.tsx
│   ├── modals/
│   │   ├── case-creation-modal.tsx
│   │   └── document-viewer.tsx
│   ├── ui/
│   │   ├── case-skeleton.tsx
│   │   ├── chat-skeleton.tsx
│   │   ├── message-skeleton.tsx
│   │   └── chat-loading-animation.tsx
│   └── drafts/
│       └── draft-editor-interface.tsx
├── context/
│   ├── app-context.tsx
│   ├── chats-context.tsx
│   └── cases-context.tsx
├── ai/
│   └── flows/
│       ├── chat-flow.ts
│       ├── legal-advice-chat.ts
│       └── document-processing.ts
├── lib/
│   ├── document-parser.ts
│   ├── server/
│   │   └── document-parser.ts
│   ├── firebase-storage.ts
│   └── api-client.ts
└── app/(app)/assistant/
    └── page.tsx
```

---

## 10. Testing Considerations

### Unit Tests
- Component rendering
- State management
- User interactions

### Integration Tests
- Chat flow end-to-end
- Draft editing workflow
- Workspace navigation

### E2E Tests
- Complete user journeys
- Cross-browser compatibility
- Performance testing

---

This documentation provides a comprehensive overview of the 3-pane legal interface implementation, covering all UI components, interactions, data flows, and technical details necessary for development and maintenance.
