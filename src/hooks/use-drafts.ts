"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface Draft {
  id: string;
  draftTitle: string;
  content: string;
  linkedCaseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/drafts');
      setDrafts(data.drafts);
    } catch (err) {
      console.log('API failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  const createDraft = async (draftData: { draftTitle: string; content?: string; linkedCaseId?: string }) => {
    try {
      const newDraft = await apiClient.post('/api/drafts', draftData);
      setDrafts(prev => [newDraft, ...prev]);
      return newDraft;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft');
      throw err;
    }
  };

  const updateDraft = async (id: string, updates: Partial<Draft>) => {
    try {
      await apiClient.put(`/api/drafts/${id}`, updates);
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update draft');
      throw err;
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      await apiClient.delete(`/api/drafts/${id}`);
      setDrafts(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
      throw err;
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  return {
    drafts,
    loading,
    error,
    createDraft,
    updateDraft,
    deleteDraft,
    refetch: fetchDrafts,
  };
}
