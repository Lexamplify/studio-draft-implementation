"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { X, Plus, Upload, FileText, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAppContext } from '@/context/app-context';
import { useCases } from '@/context/cases-context';


interface PrefilledCaseData {
  caseName?: string;
  tags?: string[];
  details?: {
    petitionerName?: string;
    respondentName?: string;
    caseNumber?: string;
    courtName?: string;
    judgeName?: string;
    petitionerCounsel?: string;
    respondentCounsel?: string;
    caseType?: string;
    filingDate?: string;
    nextHearingDate?: string;
    summary?: string;
    legalSections?: string[];
    keyFacts?: string[];
  };
}

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledData?: PrefilledCaseData;
  onCaseCreated?: (caseData: { id: string; caseName: string; createdAt: Date }) => void;
}

// Helper function to create the initial empty form state
const createInitialFormData = () => ({
  caseName: '',
  tags: [] as string[],
  details: {
    petitionerName: '',
    respondentName: '',
    caseNumber: '',
    courtName: '',
    judgeName: '',
    petitionerCounsel: '',
    respondentCounsel: '',
    caseType: '',
    filingDate: '',
    nextHearingDate: '',
    summary: '',
  }
});

export default function NewCaseModal({ isOpen, onClose, prefilledData, onCaseCreated }: NewCaseModalProps) {
  const { createCase, refetch } = useCases();
  const { setActiveView, setSelectedCaseId } = useAppContext();
  const [formData, setFormData] = useState(() => {
    if (prefilledData) {
      return {
        caseName: prefilledData.caseName || '',
        tags: prefilledData.tags || [],
        details: {
          ...createInitialFormData().details,
          ...prefilledData.details,
        }
      };
    }
    return createInitialFormData();
  });
  const [newTag, setNewTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or prefilledData changes
  useEffect(() => {
    if (isOpen) {
      if (prefilledData) {
        setFormData({
          caseName: prefilledData.caseName || '',
          tags: prefilledData.tags || [],
          details: {
            ...createInitialFormData().details,
            ...prefilledData.details,
          }
        });
      } else {
        setFormData(createInitialFormData());
      }
    }
  }, [isOpen, prefilledData]);

  // Case templates for quick setup
  const caseTemplates = [
    {
      id: 'criminal-appeal',
      name: 'Criminal Appeal',
      description: 'Appeal against criminal conviction',
      fields: {
        caseType: 'Criminal Appeal',
        courtName: 'High Court',
        tags: ['criminal', 'appeal', 'conviction']
      }
    },
    {
      id: 'civil-suit',
      name: 'Civil Suit',
      description: 'Commercial or property dispute',
      fields: {
        caseType: 'Civil Suit',
        courtName: 'District Court',
        tags: ['civil', 'commercial', 'property']
      }
    },
    {
      id: 'writ-petition',
      name: 'Writ Petition',
      description: 'Constitutional or administrative matter',
      fields: {
        caseType: 'Writ Petition',
        courtName: 'High Court',
        tags: ['constitutional', 'administrative', 'writ']
      }
    },
    {
      id: 'family-dispute',
      name: 'Family Dispute',
      description: 'Divorce, custody, or maintenance',
      fields: {
        caseType: 'Family Dispute',
        courtName: 'Family Court',
        tags: ['family', 'divorce', 'custody']
      }
    }
  ];

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.caseName.trim()) {
      errors.caseName = 'Case name is required';
    }
    
    if (formData.details.filingDate && formData.details.nextHearingDate) {
      const filingDate = new Date(formData.details.filingDate);
      const hearingDate = new Date(formData.details.nextHearingDate);
      if (hearingDate < filingDate) {
        errors.nextHearingDate = 'Next hearing date cannot be before filing date';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      const newCase = await createCase({
        caseName: formData.caseName,
        tags: formData.tags,
        details: formData.details,
      });
      
      // Refresh cases list
      await refetch();
      
      // Notify parent component about case creation
      if (onCaseCreated) {
        onCaseCreated({
          id: newCase.id,
          caseName: newCase.caseName,
          createdAt: newCase.createdAt || new Date()
        });
      }
      
      // Reset form before navigation
      setFormData(createInitialFormData());
      setUploadedFile(null);
      setSelectedTemplate('');
      setValidationErrors({});
      
      // Close modal and navigate to the new case
      onClose();
      setSelectedCaseId(newCase.id);
      setActiveView('caseDetailView');
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type.includes('text') || file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
      setUploadedFile(file);
    } else {
      alert('Please upload a PDF, DOC, DOCX, or text file.');
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    try {
      // Read file content
      const content = await readFileContent(uploadedFile);
      
      // Analyze with AI via API
      const analysis = await apiClient.post('/api/analyze-document', {
        document: content,
        documentName: uploadedFile.name,
      });

      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        caseName: analysis.caseName || prev.caseName,
        tags: [...new Set([...prev.tags, ...analysis.tags, ...analysis.legalSections])], // Combine and deduplicate tags
        details: {
          ...prev.details,
          petitionerName: analysis.petitionerName || prev.details.petitionerName,
          respondentName: analysis.respondentName || prev.details.respondentName,
          caseNumber: analysis.caseNumber || prev.details.caseNumber,
          courtName: analysis.courtName || prev.details.courtName,
          judgeName: analysis.judgeName || prev.details.judgeName,
          petitionerCounsel: analysis.petitionerCounsel || prev.details.petitionerCounsel,
          respondentCounsel: analysis.respondentCounsel || prev.details.respondentCounsel,
          caseType: analysis.caseType || prev.details.caseType,
          filingDate: analysis.filingDate || prev.details.filingDate,
          nextHearingDate: analysis.nextHearingDate || prev.details.nextHearingDate,
          summary: analysis.summary || prev.details.summary,
        }
      }));

    } catch (error) {
      console.error('Error analyzing document:', error);
      alert('Failed to analyze document. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file); // Simple text read, AI backend will handle parsing
    });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = caseTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        details: {
          ...prev.details,
          caseType: template.fields.caseType,
          courtName: template.fields.courtName,
        },
        tags: [...new Set([...prev.tags, ...template.fields.tags])]
      }));
    }
  };

  // Helper for updating nested details state
  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, [id]: value }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Case</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new case. You can either upload a document or enter the information manually.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
          {/* Template Selection Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Start Templates</h3>
              <p className="text-sm text-gray-500 mb-4">Choose a template to pre-fill common case details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {caseTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start with a Document</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a PDF, DOC, or text file to automatically extract case details.
              </p>
              
              {!uploadedFile ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">{uploadedFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAnalyzeDocument}
                    disabled={isAnalyzing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Document...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Extract Case Details
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="caseName">Case Name *</Label>
              <Input
                id="caseName"
                value={formData.caseName}
                onChange={(e) => setFormData(prev => ({ ...prev, caseName: e.target.value }))}
                placeholder="e.g., State vs. Vatsal Sharma"
                className={`mt-1 ${validationErrors.caseName ? 'border-red-500' : ''}`}
                required
              />
              {validationErrors.caseName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.caseName}</p>
              )}
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="petitionerName">Petitioner Name</Label>
                  <Input id="petitionerName" value={formData.details.petitionerName} onChange={handleDetailChange} placeholder="Enter petitioner name..." className="mt-1"/>
                </div>
                 <div>
                  <Label htmlFor="respondentName">Respondent Name</Label>
                  <Input id="respondentName" value={formData.details.respondentName} onChange={handleDetailChange} placeholder="Enter respondent name..." className="mt-1"/>
                </div>
                 <div>
                  <Label htmlFor="caseNumber">Case Number</Label>
                  <Input id="caseNumber" value={formData.details.caseNumber} onChange={handleDetailChange} placeholder="e.g., CRL.A. 123/2024" className="mt-1"/>
                </div>
                <div>
                  <Label htmlFor="courtName">Court Name</Label>
                  <Input id="courtName" value={formData.details.courtName} onChange={handleDetailChange} placeholder="e.g., Delhi High Court" className="mt-1"/>
                </div>
                <div>
                  <Label htmlFor="judgeName">Judge Name</Label>
                  <Input id="judgeName" value={formData.details.judgeName} onChange={handleDetailChange} placeholder="e.g., Hon'ble Justice R.K. Agrawal" className="mt-1"/>
                </div>
                 <div>
                  <Label htmlFor="caseType">Case Type</Label>
                  <Input id="caseType" value={formData.details.caseType} onChange={handleDetailChange} placeholder="e.g., Commercial Suit" className="mt-1"/>
                </div>
                 <div>
                  <Label htmlFor="petitionerCounsel">Petitioner Counsel</Label>
                  <Input id="petitionerCounsel" value={formData.details.petitionerCounsel} onChange={handleDetailChange} placeholder="Enter petitioner's counsel..." className="mt-1"/>
                </div>
                 <div>
                  <Label htmlFor="respondentCounsel">Respondent Counsel</Label>
                  <Input id="respondentCounsel" value={formData.details.respondentCounsel} onChange={handleDetailChange} placeholder="Enter respondent's counsel..." className="mt-1"/>
                </div>
                 <div>
                  <Label htmlFor="filingDate">Filing Date</Label>
                  <Input id="filingDate" type="date" value={formData.details.filingDate} onChange={handleDetailChange} className="mt-1"/>
                </div>
                <div>
                  <Label htmlFor="nextHearingDate">Next Hearing Date</Label>
                  <Input 
                    id="nextHearingDate" 
                    type="date" 
                    value={formData.details.nextHearingDate} 
                    onChange={handleDetailChange} 
                    className={`mt-1 ${validationErrors.nextHearingDate ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.nextHearingDate && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.nextHearingDate}</p>
                  )}
                </div>
            </div>

             <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                    id="summary"
                    value={formData.details.summary}
                    onChange={handleDetailChange}
                    placeholder="Enter case summary..."
                    className="mt-1"
                    rows={3}
                />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag and press Enter..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.caseName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Case'
              )}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}

