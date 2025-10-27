"use client";

import React, { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface ToolOption {
  id: 'createCase' | 'createDraft' | 'addEvent';
  label: string;
  description: string;
  icon: string;
}

interface ToolSelectionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolOption) => void;
}

const toolOptions: ToolOption[] = [
  {
    id: 'createCase',
    label: 'Create New Case',
    description: 'Create a new legal case with document analysis',
    icon: 'briefcase'
  },
  {
    id: 'createDraft',
    label: 'Create New Draft',
    description: 'Generate a new legal document draft',
    icon: 'fileLines'
  },
  {
    id: 'addEvent',
    label: 'Add New Event',
    description: 'Add a timeline event to current case',
    icon: 'calendar'
  }
];

export default function ToolSelectionPopover({ 
  isOpen, 
  onClose, 
  onSelectTool 
}: ToolSelectionPopoverProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-64">
        <div className="space-y-1">
          {toolOptions.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                onSelectTool(tool);
                onClose();
              }}
              className="w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon name={tool.icon} className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {tool.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tool.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

