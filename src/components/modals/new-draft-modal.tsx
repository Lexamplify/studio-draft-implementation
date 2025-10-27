"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Plus } from 'lucide-react';
import { useDrafts } from '@/hooks/use-drafts';
import { useCases } from '@/context/cases-context';
import { useAppContext } from '@/context/app-context';

interface NewDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  id: string;
  templateName: string;
  templateContent: string;
  category: string;
}

export default function NewDraftModal({ isOpen, onClose }: NewDraftModalProps) {
  const { createDraft } = useDrafts();
  const { cases } = useCases();
  const { setActiveView, setSelectedDraftId } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockTemplates: Template[] = [
        { id: '1', templateName: 'Contract Agreement', templateContent: 'Contract template...', category: 'Contracts' },
        { id: '2', templateName: 'Legal Notice', templateContent: 'Legal notice template...', category: 'Notices' },
        { id: '3', templateName: 'Court Petition', templateContent: 'Court petition template...', category: 'Court Documents' },
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateDraft = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      const newDraft = await createDraft({
        draftTitle: selectedTemplate.templateName,
        content: selectedTemplate.templateContent,
        linkedCaseId: selectedCaseId || undefined,
      });
      
      setSelectedDraftId(newDraft.id);
      setActiveView('draftEditor');
      onClose();
      
      // Reset form
      setSelectedTemplate(null);
      setSelectedCaseId('');
    } catch (error) {
      console.error('Error creating draft:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Draft</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search */}
          <div>
            <Label>Search Templates</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Link to Case */}
          <div>
            <Label>Link to Case (Optional)</Label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a case to link this draft to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No case linked</SelectItem>
                {cases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    {case_.caseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div>
            <Label>Select Template</Label>
            <div className="mt-2 max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'ring-2 ring-blue-600 bg-blue-50'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <CardTitle className="text-sm font-medium line-clamp-1">
                            {template.templateName}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-gray-500">
                          {template.category}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Template Preview */}
          {selectedTemplate && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Selected Template</h4>
              <p className="text-sm text-gray-600">{selectedTemplate.templateName}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedTemplate.category}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateDraft}
            disabled={!selectedTemplate || isCreating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? 'Creating...' : 'Create Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
