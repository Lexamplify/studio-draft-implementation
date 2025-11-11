"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface FloatingAIButtonProps {
  onAISuggest: (selectedText: string) => void;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const FloatingAIButton = ({ onAISuggest, isVisible, position }: FloatingAIButtonProps) => {
  const [selectedText, setSelectedText] = useState("");

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

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y - 50,
      }}
    >
      <div className="pointer-events-auto">
        <Button
          onClick={() => onAISuggest(selectedText)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm px-3 py-1"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          AI Suggest
        </Button>
      </div>
    </div>
  );
};
