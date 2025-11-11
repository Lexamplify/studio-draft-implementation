"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Scale, Wand2 } from 'lucide-react';

interface FloatingLegalAIButtonProps {
  onLegalAI: () => void;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const FloatingLegalAIButton: React.FC<FloatingLegalAIButtonProps> = ({
  onLegalAI,
  isVisible,
  position,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 transition-all duration-200 ease-in-out"
      style={{
        left: `${position.x - 40}px`,
        top: `${position.y - 50}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <Button
        onClick={onLegalAI}
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg border-0 rounded-full px-3 py-2 h-auto"
        title="Open Legal AI Assistant"
      >
        <Scale className="h-4 w-4 mr-1" />
        <span className="text-xs font-medium">Legal AI</span>
      </Button>
    </div>
  );
};
