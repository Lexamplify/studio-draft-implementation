"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthToken } from '@/hooks/use-auth-token';

interface Case {
  id: string;
  caseName: string;
  tags: string[];
  details: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface CasesContextType {
  cases: Case[];
  loading: boolean;
  error: string | null;
  createCase: (caseData: { caseName: string; tags?: string[]; details?: Record<string, any> }) => Promise<Case>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<Case>;
  deleteCase: (id: string, deleteChats?: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

const CasesContext = createContext<CasesContextType | undefined>(undefined);

export function CasesProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, loading: authLoading } = useAuthToken();

  const fetchCases = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/cases');
      setCases(data.cases);
    } catch (err) {
      console.log('API failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createCase = useCallback(async (caseData: { caseName: string; tags?: string[]; details?: Record<string, any> }) => {
    try {
      const newCase = await apiClient.post('/api/cases', caseData);
      setCases(prev => [newCase, ...prev]);
      return newCase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
      throw err;
    }
  }, []);

  const updateCase = useCallback(async (id: string, updates: Partial<Case>) => {
    try {
      const updatedCase = await apiClient.put(`/api/cases/${id}`, updates);
      setCases(prev => {
        const newCases = prev.map(c => c.id === id ? { ...c, ...updatedCase } : c);
        return newCases;
      });
      return updatedCase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update case');
      throw err;
    }
  }, []);

  const deleteCase = useCallback(async (id: string, deleteChats: boolean = false) => {
    try {
      const url = `/api/cases/${id}${deleteChats ? '?deleteChats=true' : ''}`;
      await apiClient.delete(url);
      setCases(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete case');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!authLoading && token) {
      fetchCases();
    } else if (!authLoading && !token) {
      setLoading(false);
      setCases([]);
    }
  }, [fetchCases, authLoading, token]);

  const contextValue = useMemo(() => ({
    cases,
    loading,
    error,
    createCase,
    updateCase,
    deleteCase,
    refetch: fetchCases,
  }), [cases, loading, error, createCase, updateCase, deleteCase, fetchCases]);

  return (
    <CasesContext.Provider value={contextValue}>
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const context = useContext(CasesContext);
  if (context === undefined) {
    throw new Error('useCases must be used within a CasesProvider');
  }
  return context;
}
