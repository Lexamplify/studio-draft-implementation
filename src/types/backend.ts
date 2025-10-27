export interface Case {
  id?: string; // Firestore doc ID
  caseName: string;
  tags: string[];
  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
  aiSubtitle?: string; // AI-generated one-sentence summary
  details?: {
    // Existing fields
    respondentName?: string;
    courtName?: string;
    judgeName?: string;
    petitionerName?: string;
    caseNumber?: string;
    caseType?: string;
    status?: string;
    filingDate?: string;
    nextHearingDate?: string;
    jurisdiction?: string;
    caseCategory?: string;
    // New contact fields
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    opposingCounselName?: string;
    opposingCounselPhone?: string;
    opposingCounselEmail?: string;
    courtClerkName?: string;
    courtClerkPhone?: string;
    courtClerkEmail?: string;
    // Analytics
    documentCount?: number;
    messageCount?: number;
  };
}

export interface Draft {
  id?: string;
  draftTitle: string;
  content: string;
  linkedCaseId?: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}

export interface Chat {
  id?: string;
  title: string;
  linkedCaseId?: string | null;
  messageCount?: number;
  description?: string;
  lastMessage?: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: FirebaseFirestore.Timestamp | Date;
}

// Workspace Data interfaces
export interface WorkspaceTodo {
  id: string;
  text: string;
  completed: boolean;
  caseId?: string | null; // null for general todos
  createdAt: Date;
  order: number;
}

export interface WorkspaceNotes {
  id: string;
  content: string;
  caseId?: string | null; // null for general notes
  updatedAt: Date;
}

export interface CalendarEvent {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // ISO format YYYY-MM-DD
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  
  // Lawyer-specific metadata
  eventType: 'filing_deadline' | 'court_hearing' | 'discovery_deadline' | 'client_meeting' | 'internal_task';
  priority: 'critical' | 'high' | 'normal' | 'low';
  caseId?: string; // Link to cases collection
  caseName?: string; // Denormalized for display
  
  // Additional fields
  location?: string;
  attendees?: string[]; // Email addresses
  isBillable: boolean;
  addReminderTask: boolean; // AI creates task 3 days before
  
  // Google Calendar sync
  googleEventId?: string;
  syncedToGoogle: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}