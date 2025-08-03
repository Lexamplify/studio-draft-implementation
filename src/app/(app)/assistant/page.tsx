"use client";

import React, { useState, useRef } from 'react';
import ChatInterface from '@/components/ChatInterface';
import QuickActions from '@/components/Assistant/QuickActions';
import CalendarWidget from '@/components/Assistant/CalendarWidget';

export default function AssistantPage() {
  const [uploadedDoc, setUploadedDoc] = useState<File | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [triggerQuery, setTriggerQuery] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedDoc(file);
      setUploadedDocName(file.name);
    }
  };

  const handleWorkflowTrigger = (workflow: string, prompt: string) => {
    // Trigger the workflow by setting the query
    setTriggerQuery(prompt);
    // Reset after a brief moment to allow the chat interface to pick it up
    setTimeout(() => setTriggerQuery(""), 100);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gradient-to-br from-gray-50 to-blue-50">
      <main className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
        <div className="w-full max-w-5xl mx-auto h-full flex flex-col">
          <div className="flex-shrink-0 mb-4">
            <h1 className="text-xl font-bold text-foreground">LexAI Assistant</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered legal assistance with document analysis and expert guidance.
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <ChatInterface
              initialFile={uploadedDoc || undefined}
              initialFileName={uploadedDocName || undefined}
              initialQuery={triggerQuery}
              onWorkflowTrigger={handleWorkflowTrigger}
              className="h-full"
            />
          </div>
        </div>
      </main>
      
      <aside className="w-full md:w-96 bg-white border-l p-6 flex flex-col gap-6">
        <CalendarWidget />
        <QuickActions onWorkflowTrigger={handleWorkflowTrigger} />
      </aside>

      {/* Hidden file input for external upload trigger */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".txt,.md,.json,.pdf,.docx,.doc"
      />
    </div>
  );
}


