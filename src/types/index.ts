export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type LegalDocumentType = 'Case File' | 'Draft Template' | 'Generated Draft';

export type LegalDocument = {
  id: string;
  name: string;
  type: LegalDocumentType;
  url?: string; // Optional: for OnlyOffice or download link
  lastModified: string;
  content?: string; // For new drafts or templates not yet saved to a URL
  dataAiHint?: string; // For placeholder images if used
};

export type TemplateSearchResult = {
  id: string;
  name: string;
  description?: string;
  url?: string; // URL for the DOCX document
};

// New type for Vault Project Cards
export type ProjectAccessType = 'shared' | 'private';
export type ProjectIconType = 'book' | 'folder';

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  iconType: ProjectIconType;
  fileCount: number;
  queryCount: number;
  accessType: ProjectAccessType;
  dataAiHint?: string; // For placeholder image in project card (optional)
  // Metadata fields for Vault card display
  petitionerName?: string;
  respondentName?: string;
  judgeName?: string;
  filingDate?: string;
  lastModified?: string;
}
