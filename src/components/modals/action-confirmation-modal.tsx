"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  actionType: 'createCase' | 'createDraft' | 'addEvent' | null;
  extractedMetadata: any;
  sourceChatId?: string;
}

export default function ActionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  extractedMetadata,
  sourceChatId
}: ActionConfirmationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseName: '',
    parties: '',
    court: '',
    legalSections: '',
    eventDate: '',
    eventTime: '',
    eventLocation: ''
  });

  if (!isOpen || !actionType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      ...formData,
      extractedMetadata,
      sourceChatId
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'createCase': return 'Create New Case';
      case 'createDraft': return 'Create New Draft';
      case 'addEvent': return 'Add New Event';
      default: return 'Confirm Action';
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case 'createCase': return 'folder';
      case 'createDraft': return 'file-text';
      case 'addEvent': return 'calendar';
      default: return 'check';
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case 'createCase': return 'bg-blue-100 text-blue-800';
      case 'createDraft': return 'bg-green-100 text-green-800';
      case 'addEvent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderFormFields = () => {
    switch (actionType) {
      case 'createCase':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="caseName">Case Name *</Label>
                <Input
                  id="caseName"
                  value={formData.caseName}
                  onChange={(e) => handleInputChange('caseName', e.target.value)}
                  placeholder="Enter case name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="parties">Parties Involved</Label>
                <Input
                  id="parties"
                  value={formData.parties}
                  onChange={(e) => handleInputChange('parties', e.target.value)}
                  placeholder="e.g., State vs. John Doe"
                />
              </div>
              <div>
                <Label htmlFor="court">Court</Label>
                <Input
                  id="court"
                  value={formData.court}
                  onChange={(e) => handleInputChange('court', e.target.value)}
                  placeholder="e.g., High Court of Delhi"
                />
              </div>
              <div>
                <Label htmlFor="legalSections">Legal Sections</Label>
                <Input
                  id="legalSections"
                  value={formData.legalSections}
                  onChange={(e) => handleInputChange('legalSections', e.target.value)}
                  placeholder="e.g., IPC 302, CrPC 197"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the case"
                  rows={3}
                />
              </div>
            </div>
          </>
        );

      case 'createDraft':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Draft Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter draft title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="caseName">Related Case</Label>
                <Input
                  id="caseName"
                  value={formData.caseName}
                  onChange={(e) => handleInputChange('caseName', e.target.value)}
                  placeholder="Case name (if applicable)"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the draft"
                  rows={3}
                />
              </div>
            </div>
          </>
        );

      case 'addEvent':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eventTime">Time</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => handleInputChange('eventTime', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="eventLocation">Location</Label>
                <Input
                  id="eventLocation"
                  value={formData.eventLocation}
                  onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                  placeholder="Event location"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Event description"
                  rows={3}
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getActionColor()}`}>
                <Icon name={getActionIcon()} className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {getActionTitle()}
                </h2>
                <p className="text-sm text-gray-600">
                  Review and confirm the details extracted from your documents
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="x" className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Extracted Information */}
          {extractedMetadata && Object.keys(extractedMetadata).length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Icon name="sparkles" className="w-4 h-4 text-blue-500" />
                  <span>AI Extracted Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(extractedMetadata).map(([key, value]) => (
                    <div key={key} className="flex items-start space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Badge>
                      <span className="text-sm text-gray-600 flex-1">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderFormFields()}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={`${
                  actionType === 'createCase' ? 'bg-blue-600 hover:bg-blue-700' :
                  actionType === 'createDraft' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'addEvent' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-gray-600 hover:bg-gray-700'
                } text-white`}
              >
                <Icon name={getActionIcon()} className="w-4 h-4 mr-2" />
                {actionType === 'createCase' ? 'Create Case' :
                 actionType === 'createDraft' ? 'Create Draft' :
                 actionType === 'addEvent' ? 'Add Event' :
                 'Confirm'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}