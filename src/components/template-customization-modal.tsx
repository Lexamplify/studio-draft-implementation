"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Sparkles } from 'lucide-react';

export interface TemplateCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  };
  onSkip: (template: {
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  }) => void;
  onCustomize: (template: {
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  }, answers: Record<string, string>) => void;
  isProcessing?: boolean;
}

export const TemplateCustomizationModal: React.FC<TemplateCustomizationModalProps> = ({
  isOpen,
  onClose,
  template,
  onSkip,
  onCustomize,
  isProcessing = false
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handleAnswerChange = (query: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [query]: value
    }));
  };

  const handleSkip = () => {
    onSkip(template);
    onClose();
  };

  const handleCustomize = async () => {
    setIsCustomizing(true);
    try {
      await onCustomize(template, answers);
      onClose();
    } catch (error) {
      console.error('Error customizing template:', error);
    } finally {
      setIsCustomizing(false);
    }
  };

  const hasQueries = template.queries && template.queries.length > 0;
  const allAnswersProvided = hasQueries ? 
    template.queries!.every(query => answers[query]?.trim()) : 
    true;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customize Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div 
              className="w-16 h-20 bg-cover bg-center rounded border"
              style={{
                backgroundImage: `url(${template.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div>
              <h3 className="font-medium text-lg">{template.label}</h3>
              <p className="text-sm text-gray-600">
                {hasQueries 
                  ? `This template has ${template.queries!.length} customization option${template.queries!.length > 1 ? 's' : ''}`
                  : 'This template can be used as-is or customized'
                }
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Choose an option:</h4>
            
            {/* Skip Option */}
            <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                 onClick={handleSkip}>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium">Use Template As-Is</h5>
                <p className="text-sm text-gray-600">
                  Open the template with its original content
                </p>
              </div>
            </div>

            {/* Customize Option */}
            {hasQueries && (
              <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                   onClick={() => {}}>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium">Customize with AI</h5>
                  <p className="text-sm text-gray-600">
                    Answer questions to personalize the template
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Query Inputs */}
          {hasQueries && (
            <div className="space-y-4">
              <h4 className="font-medium text-base">Customization Questions:</h4>
              {template.queries!.map((query, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`query-${index}`} className="text-sm font-medium">
                    {query}
                  </Label>
                  <Textarea
                    id={`query-${index}`}
                    placeholder={`Enter your answer for: ${query}`}
                    value={answers[query] || ''}
                    onChange={(e) => handleAnswerChange(query, e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing || isCustomizing}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleSkip} 
            variant="secondary"
            disabled={isProcessing || isCustomizing}
          >
            <FileText className="h-4 w-4 mr-2" />
            Use As-Is
          </Button>

          {hasQueries && (
            <Button 
              onClick={handleCustomize}
              disabled={!allAnswersProvided || isProcessing || isCustomizing}
            >
              {isCustomizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Customizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Customized
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
