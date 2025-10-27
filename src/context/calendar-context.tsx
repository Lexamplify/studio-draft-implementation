'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

interface CalendarContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (caseId: string | null) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  return (
    <CalendarContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentDate,
        setCurrentDate,
        selectedCaseId,
        setSelectedCaseId,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within CalendarProvider');
  }
  return context;
}


