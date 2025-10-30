"use client";

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { format } from 'date-fns';

interface CaseBoxProps {
  caseId?: string;
  caseName: string;
  createdAt?: string | Date;
  onViewCase?: () => void;
  onStartChat?: () => void;
}

export default function CaseBox({ 
  caseId, 
  caseName, 
  createdAt, 
  onViewCase, 
  onStartChat 
}: CaseBoxProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Just now';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Just now';
    }
  };

  // Always render the CaseBox if caseName exists, even without caseId
  // But only show buttons if caseId exists
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-3 animate-in slide-in-from-right fade-in duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name="briefcase" className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">{caseName}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {caseId ? `Created ${formatDate(createdAt)}` : 'Case details extracted'}
          </p>
          {caseId && (
            <div className="flex items-center space-x-2">
              {onViewCase && (
                <Button
                  onClick={onViewCase}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Icon name="externalLink" className="w-3 h-3 mr-1" />
                  View Case
                </Button>
              )}
              {onStartChat && (
                <Button
                  onClick={onStartChat}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Icon name="message" className="w-3 h-3 mr-1" />
                  Start Chat
                </Button>
              )}
            </div>
          )}
          {!caseId && (
            <p className="text-xs text-gray-600 italic">
              Case will be available after creation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

