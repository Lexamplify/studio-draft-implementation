"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/icon';
import { apiClient } from '@/lib/api-client';
import { WorkspaceNotes } from '@/types/backend';

interface NotesEditorProps {
  caseId?: string | null;
  placeholder?: string;
}

export default function NotesEditor({ caseId, placeholder = "Add your notes here..." }: NotesEditorProps) {
  const [notes, setNotes] = useState<WorkspaceNotes | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/workspace/notes?caseId=${caseId || ''}`);
        const notesData = response.notes;
        
        if (notesData) {
          setNotes(notesData);
          setContent(notesData.content || '');
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [caseId]);

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (content !== (notes?.content || '')) {
      setSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await apiClient.put('/api/workspace/notes', {
            content,
            caseId,
          });
          setLastSaved(new Date());
        } catch (error) {
          console.error('Failed to save notes:', error);
        } finally {
          setSaving(false);
        }
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, caseId, notes?.content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {saving ? (
            <>
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Icon name="check" className="w-3 h-3 text-green-500" />
              <span>Saved {formatLastSaved(lastSaved)}</span>
            </>
          ) : (
            <span>Ready</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Icon name="lock" className="w-3 h-3" />
          <span>Auto-save</span>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px] font-mono"
        style={{ minHeight: '120px' }}
      />

      {/* Character count */}
      <div className="text-xs text-gray-400 text-right">
        {content.length} characters
      </div>
    </div>
  );
}
