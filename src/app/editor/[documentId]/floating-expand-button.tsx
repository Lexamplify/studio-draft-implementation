"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Expand, X } from 'lucide-react';

interface FloatingExpandButtonProps {
  isVisible: boolean;
  position: { x: number; y: number };
}

export const FloatingExpandButton: React.FC<FloatingExpandButtonProps> = ({
  isVisible,
  position,
}) => {
  const [selectedText, setSelectedText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
      } else {
        setSelectedText("");
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  if (!isVisible || !selectedText) {
    return null;
  }

  const handleExpand = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <div
        className="fixed z-50 transition-all duration-200 ease-in-out"
        style={{
          left: `${position.x + 40}px`,
          top: `${position.y - 50}px`,
          transform: 'translateX(-50%)',
        }}
      >
        <Button
          onClick={handleExpand}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg border-0 rounded-full px-3 py-2 h-auto"
          title="Expand selected text"
        >
          <Expand className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">Expand</span>
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Selected Text</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedText}</p>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Character count: {selectedText.length} | Word count: {selectedText.split(/\s+/).filter(word => word.length > 0).length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
