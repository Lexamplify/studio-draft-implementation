"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Loader2 } from "lucide-react";

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  suggestion: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const SuggestionModal = ({
  isOpen,
  onClose,
  originalText,
  suggestion,
  onAccept,
  onReject,
  isLoading = false
}: SuggestionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-blue-600">✨ AI Suggestion</span>
          </DialogTitle>
          <DialogDescription>
            Review the AI-generated rephrasing suggestion below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Text */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Original Text:</h4>
            <Card>
              <CardContent className="p-3">
                <p className="text-sm text-gray-600 italic">&ldquo{originalText}&ldquo</p>
              </CardContent>
            </Card>
          </div>

          {/* Suggestion */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggestion:</h4>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm text-gray-600">Generating suggestion...</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-800">&ldquo{suggestion}&rdquo</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Reject
          </Button>
          <Button
            onClick={onAccept}
            disabled={isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
