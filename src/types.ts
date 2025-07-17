// src/types.ts
export interface Case {
  id: string;
  name: string;
  description: string;
  caseSummary: string;
  files?: Array<{ id: string; name: string; url: string; type: string; uploadedAt: string }>;
  // add any other fields you need from Firestore
}
