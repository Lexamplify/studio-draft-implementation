"use client";

import React from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface EditorToolOption {
  id: 'formatDocument' | 'addCitation' | 'checkCompliance' | 'summarizeSection' | 'translateText' | 'improveClarity';
  label: string;
  description: string;
  icon: string;
}

interface EditorToolSelectionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: EditorToolOption) => void;
}

const editorToolOptions: EditorToolOption[] = [
  {
    id: 'formatDocument',
    label: 'Format Document',
    description: 'Apply proper legal document formatting',
    icon: 'fileEdit'
  },
  {
    id: 'addCitation',
    label: 'Add Citation',
    description: 'Insert legal citations and references',
    icon: 'bookOpen'
  },
  {
    id: 'checkCompliance',
    label: 'Check Compliance',
    description: 'Verify document compliance with legal standards',
    icon: 'shield'
  },
  {
    id: 'summarizeSection',
    label: 'Summarize Section',
    description: 'Create a summary of selected text',
    icon: 'fileText'
  },
  {
    id: 'translateText',
    label: 'Translate Text',
    description: 'Translate text to another language',
    icon: 'refreshCw'
  },
  {
    id: 'improveClarity',
    label: 'Improve Clarity',
    description: 'Enhance text clarity and readability',
    icon: 'sparkles'
  }
];

export default function EditorToolSelectionPopover({ 
  isOpen, 
  onClose, 
  onSelectTool 
}: EditorToolSelectionPopoverProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-64 max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {editorToolOptions.map((tool) => (
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

