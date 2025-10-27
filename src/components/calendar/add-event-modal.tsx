'use client';

import React, { useState } from 'react';
import type { CalendarEvent } from '@/types/backend';
import { useCasesContext } from '@/context/cases-context';
import { useCalendarEvents } from '@/hooks/use-calendar-events';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  initialDate?: Date;
  initialCaseId?: string;
}

export function AddEventModal({ open, onClose, initialDate, initialCaseId }: AddEventModalProps) {
  const { createEvent } = useCalendarEvents();
  const { cases } = useCasesContext();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : '',
    startTime: '',
    endTime: '',
    eventType: 'client_meeting' as CalendarEvent['eventType'],
    caseId: initialCaseId || '',
    location: '',
    attendees: '',
    isBillable: false,
    addReminderTask: false,
    syncedToGoogle: false,
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get Google Calendar tokens if syncing
      let tokens;
      if (formData.syncedToGoogle) {
        const storedTokens = localStorage.getItem('googleCalendarTokens');
        if (storedTokens) {
          tokens = JSON.parse(storedTokens);
        }
      }
      
      // Get case name if linked
      const selectedCase = cases.find(c => c.id === formData.caseId);
      const caseName = selectedCase?.caseName || undefined;
      
      await createEvent({
        ...formData,
        attendees: formData.attendees ? formData.attendees.split(',').map(e => e.trim()) : [],
        caseName,
        tokens: tokens ? JSON.stringify(tokens) : undefined,
      });
      
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: initialDate ? initialDate.toISOString().split('T')[0] : '',
        startTime: '',
        endTime: '',
        eventType: 'client_meeting',
        caseId: '',
        location: '',
        attendees: '',
        isBillable: false,
        addReminderTask: false,
        syncedToGoogle: false,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>
            Create a new event with case linking and custom event types
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Motion to Dismiss Hearing"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value as CalendarEvent['eventType'] })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filing_deadline">📅 Filing Deadline</SelectItem>
                  <SelectItem value="court_hearing">⚖️ Court Hearing</SelectItem>
                  <SelectItem value="discovery_deadline">📋 Discovery Deadline</SelectItem>
                  <SelectItem value="client_meeting">💼 Client Meeting</SelectItem>
                  <SelectItem value="internal_task">📌 Internal Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="caseId">Link to Case</Label>
            <Select
              value={formData.caseId}
              onValueChange={(value) => setFormData({ ...formData, caseId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a case (optional)" />
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
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about the event..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Court Room 3A"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees (comma-separated emails)</Label>
            <Input
              id="attendees"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              placeholder="email1@example.com, email2@example.com"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBillable"
                checked={formData.isBillable}
                onCheckedChange={(checked) => setFormData({ ...formData, isBillable: checked as boolean })}
              />
              <Label htmlFor="isBillable" className="cursor-pointer">
                Mark as Billable
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="addReminderTask"
                checked={formData.addReminderTask}
                onCheckedChange={(checked) => setFormData({ ...formData, addReminderTask: checked as boolean })}
              />
              <Label htmlFor="addReminderTask" className="cursor-pointer">
                Add Reminder Task (AI will create a to-do 3 days before)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="syncedToGoogle"
                checked={formData.syncedToGoogle}
                onCheckedChange={(checked) => setFormData({ ...formData, syncedToGoogle: checked as boolean })}
              />
              <Label htmlFor="syncedToGoogle" className="cursor-pointer">
                Sync to Google Calendar
              </Label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddEventModal;


