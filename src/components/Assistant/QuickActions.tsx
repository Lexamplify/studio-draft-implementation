import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface QuickActionsProps {
  onWorkflowTrigger?: (workflow: string, prompt: string) => void;
}

const actions = [
  { title: 'Draft a Document', description: 'Start drafting new legal documents with AI assistance.', href: '/draft', icon: Icons.Draft },
  { title: 'Show My Cases', description: 'Access and manage your existing case files and documents.', href: '/vault', icon: Icons.Vault },
];

const QuickActions = ({ onWorkflowTrigger }: QuickActionsProps) => {
  return (
    <div className="space-y-4">
      {/* Navigation Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Link 
              key={action.title} 
              href={action.href}
              className="flex flex-col items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-3 hover:bg-blue-50 transition-colors min-h-[80px] text-center"
            >
              <action.icon className="h-5 w-5 text-gray-600" />
              <div className="font-medium text-xs text-gray-900 truncate">{action.title}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <Icons.Sparkles className="h-3 w-3 inline mr-1" />
        LexAI workflows are now available above the chat area for quick access!
      </div>
    </div>
  );
};

export default QuickActions; 