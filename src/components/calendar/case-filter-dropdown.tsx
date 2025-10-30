'use client';

import React from 'react';
import { useCalendarContext } from '@/context/calendar-context';
import { useCases } from '@/context/cases-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CaseFilterDropdown() {
  const { selectedCaseId, setSelectedCaseId } = useCalendarContext();
  const { cases } = useCases();
  
  return (
    <Select value={selectedCaseId || 'all'} onValueChange={(value) => setSelectedCaseId(value === 'all' ? null : value)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Cases" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Cases</SelectItem>
        {cases.map((case_) => (
          <SelectItem key={case_.id} value={case_.id}>
            {case_.caseName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default CaseFilterDropdown;



