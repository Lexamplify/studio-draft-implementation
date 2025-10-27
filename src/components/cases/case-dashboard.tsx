"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { useAppContext } from '@/context/app-context';
import { apiClient } from '@/lib/api-client';

// Helper component for displaying detail items
function DetailItem({ 
  label, 
  value, 
  format = 'text',
  children 
}: { 
  label: string; 
  value?: string | number | null; 
  format?: 'text' | 'date';
  children?: React.ReactNode;
}) {
  let displayValue = value || 'Not specified';
  
  if (format === 'date' && value) {
    displayValue = new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="flex items-center">
        <p className="text-gray-900">{displayValue}</p>
        {children}
      </div>
    </div>
  );
}

// Case Details Form Component
function CaseDetailsForm({ 
  caseData, 
  onCancel,
  onSave 
}: { 
  caseData: any; 
  onCancel: () => void; 
  onSave: (data: any) => void 
}) {
  const [formData, setFormData] = useState(caseData || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const fields = [
    { key: 'caseNumber', label: 'Case Number', type: 'text' },
    { key: 'courtName', label: 'Court Name', type: 'text' },
    { key: 'judgeName', label: 'Judge Name', type: 'text' },
    { key: 'filingDate', label: 'Filing Date', type: 'date' },
    { key: 'caseType', label: 'Case Type', type: 'text' },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select', 
      options: ['Active', 'Closed', 'On Hold', 'Appeal'] 
    },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'text' },
    { key: 'nextHearingDate', label: 'Next Hearing', type: 'date' },
    { key: 'petitionerName', label: 'Petitioner', type: 'text' },
    { key: 'respondentName', label: 'Respondent', type: 'text' },
    { key: 'caseCategory', label: 'Case Category', type: 'text' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            {field.type === 'select' ? (
              <select
                name={field.key}
                value={formData[field.key] || ''}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.key}
                value={formData[field.key] || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

// Main Case Dashboard Component
interface CaseDashboardProps {
  caseData?: any;
}

// Mock data for demonstration
const mockCaseData = {
  caseNumber: 'CIV-2024-000123',
  courtName: 'Delhi High Court',
  judgeName: 'Hon. Justice Rajesh Kumar',
  filingDate: '2024-01-15',
  caseType: 'Contract Breach & Commercial Dispute',
  status: 'Active',
  jurisdiction: 'New Delhi',
  nextHearingDate: '2024-12-20',
  petitionerName: 'Sharma & Associates Pvt. Ltd.',
  respondentName: 'Global Tech Solutions Inc.',
  caseCategory: 'Commercial',
  clientName: 'Priya Sharma',
  clientContact: '+91 98765 43210 | priya@sharmaassociates.com',
  opposingCounselName: 'Adv. Vijay Menon',
  opposingCounselContact: '+91 98765 43211 | vijay@lawfirm.in',
  courtClerkName: 'Lakshmi Nair',
  courtClerkContact: '+91 98765 43212 | clerk.dhc@courts.gov.in',
  documentCount: 47,
  messageCount: 23
};

const mockUpcomingEvents = [
  {
    id: 'evt-1',
    title: 'Final Hearing - Contract Breach',
    date: '2024-12-20T10:00:00',
    time: '10:00 AM',
    description: 'Oral arguments and evidence presentation',
    type: 'Hearing'
  },
  {
    id: 'evt-2',
    title: 'Deadline - Submit Reply Affidavit',
    date: '2024-12-15T17:00:00',
    time: '5:00 PM',
    description: 'Submission of response to respondent counter-arguments',
    type: 'Deadline'
  },
  {
    id: 'evt-3',
    title: 'Client Meeting - Case Strategy',
    date: '2024-12-12T15:00:00',
    time: '3:00 PM',
    description: 'Discuss trial strategy and witness preparation',
    type: 'Meeting'
  }
];

function CaseDashboard({ caseData: propCaseData }: CaseDashboardProps) {
  const { selectedCaseId } = useAppContext();
  const [caseData, setCaseData] = useState<any>(propCaseData || mockCaseData);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>(mockUpcomingEvents);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('The case involves a contractual dispute between Sharma & Associates Pvt. Ltd. (Petitioner) and Global Tech Solutions Inc. (Respondent) before the Delhi High Court. The dispute centers on breach of contract allegations related to service delivery standards and payment obligations. Key legal issues include interpretation of contractual terms, assessment of damages, and determination of breach. The case is currently in its active phase with oral arguments scheduled for the final hearing on December 20, 2024. Recent developments include counter-arguments from the respondent challenging the petitioner\'s claims regarding service quality. Next steps involve submission of reply affidavit by December 15, 2024, to address the respondent\'s counter-allegations. The matter involves complex commercial law principles and requires careful analysis of the contractual obligations of both parties.');

  // Load case data and events
  useEffect(() => {
    // Use mock data for now - uncomment below to fetch real data
    /* const fetchData = async () => {
      if (selectedCaseId) {
        try {
          // Only fetch if we don't have case data yet
          if (!caseData) {
            setIsLoading(true);
            // Fetch case data
            const caseResponse = await apiClient.get(`/api/cases/${selectedCaseId}`);
            setCaseData(caseResponse.data || {});
            // Generate AI summary (mock for now)
            generateAiSummary(caseResponse.data);
          } else {
            // If we have case data, generate AI summary immediately
            generateAiSummary(caseData);
          }
          
          // Always fetch upcoming events (they might change)
          const eventsResponse = await apiClient.get(`/api/cases/${selectedCaseId}/events?upcoming=true`);
          setUpcomingEvents(eventsResponse.data || []);
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData(); */
  }, [selectedCaseId]);

  // Generate AI summary (enhanced implementation)
  const generateAiSummary = async (caseData: any) => {
    try {
      // Call AI service to generate comprehensive case summary
      const response = await apiClient.post('/api/llm', {
        prompt: `Generate a comprehensive case summary for the following case details: ${JSON.stringify(caseData)}. Include key facts, legal issues, current status, and next steps.`,
        context: 'case-summary'
      });
      
      if (response.summary) {
        setAiSummary(response.summary);
      } else {
        // Fallback to enhanced mock summary
        const summary = `This case involves ${caseData?.petitionerName || 'the petitioner'} versus ${caseData?.respondentName || 'the respondent'} in ${caseData?.courtName || 'the court'}. The case is currently ${caseData?.status || 'active'} and was filed on ${caseData?.filingDate || 'recently'}. Key legal issues include ${caseData?.caseType || 'general matters'} and the next hearing is scheduled for ${caseData?.nextHearingDate || 'TBD'}.`;
        setAiSummary(summary);
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      // Enhanced fallback summary
      const summary = `This case involves ${caseData?.petitionerName || 'the petitioner'} versus ${caseData?.respondentName || 'the respondent'} in ${caseData?.courtName || 'the court'}. The case is currently ${caseData?.status || 'active'} and was filed on ${caseData?.filingDate || 'recently'}. Key legal issues include ${caseData?.caseType || 'general matters'} and the next hearing is scheduled for ${caseData?.nextHearingDate || 'TBD'}.`;
      setAiSummary(summary);
    }
  };

  // Quick actions with enhanced functionality
  const quickActions = [
    { 
      id: 'add-event', 
      label: 'Add Event', 
      icon: 'calendarPlus', 
      description: 'Schedule hearings, deadlines, and meetings',
      onClick: () => {
        // Navigate to events tab
        const eventTabButton = document.querySelector('[data-tab="events"]') as HTMLButtonElement;
        if (eventTabButton) {
          eventTabButton.click();
        }
      } 
    },
    { 
      id: 'upload-doc', 
      label: 'Upload Doc', 
      icon: 'upload', 
      description: 'Add case documents and evidence',
      onClick: () => {
        // Navigate to documents tab
        const docsTabButton = document.querySelector('[data-tab="docs"]') as HTMLButtonElement;
        if (docsTabButton) {
          docsTabButton.click();
        }
      } 
    },
    { 
      id: 'create-draft', 
      label: 'Create Draft', 
      icon: 'fileEdit', 
      description: 'Start drafting legal documents',
      onClick: () => {
        // This would open the draft editor
        console.log('Create draft clicked');
      } 
    },
    { 
      id: 'start-chat', 
      label: 'Start Chat', 
      icon: 'messageCircle', 
      description: 'Discuss case with AI assistant',
      onClick: () => {
        // Navigate to chats tab
        const chatsTabButton = document.querySelector('[data-tab="chats"]') as HTMLButtonElement;
        if (chatsTabButton) {
          chatsTabButton.click();
        }
      } 
    },
  ];

  // Handle saving case details
  const handleSaveCaseDetails = async (updatedData: any) => {
    try {
      await apiClient.put(`/api/cases/${selectedCaseId}`, updatedData);
      setCaseData({ ...caseData, ...updatedData });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update case details:', error);
    }
  };

  if (isLoading && !caseData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
      {/* AI-Powered Case Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
              <Icon name="sparkles" className="w-5 h-5 text-blue-500 mr-2" />
              AI-Generated Case Summary
            </h2>
            <p className="text-gray-700">
              {aiSummary || 'AI summary will be generated based on case documents...'}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              📊 Generated from 47 documents • 🕐 Last updated 2 hours ago
            </p>
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            [+] Expand to read full AI summary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="calendar" className="w-5 h-5 text-blue-500 mr-2" />
              Upcoming Deadlines
            </h3>
          </div>
          <div className="p-5">
            {upcomingEvents.length > 0 ? (
              <ul className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <li key={event.id} className="border-l-2 border-blue-500 pl-4 py-1">
                    <p className="font-medium text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {event.time && ` • ${event.time}`}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <Icon name="calendarX" className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No upcoming deadlines</p>
              </div>
            )}
            <button 
              className="mt-4 w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={() => console.log('View all events')}
            >
              View All Events
            </button>
          </div>
        </div>

        {/* Key Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="users" className="w-5 h-5 text-blue-500 mr-2" />
              Key Contacts
            </h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</p>
                <p className="font-medium text-gray-800">{caseData?.clientName || 'Not specified'}</p>
                <p className="text-sm text-gray-600">{caseData?.clientContact || 'No contact info'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Opposing Counsel</p>
                <p className="font-medium text-gray-800">{caseData?.opposingCounselName || 'Not specified'}</p>
                <p className="text-sm text-gray-600">{caseData?.opposingCounselContact || 'No contact info'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Court Clerk</p>
                <p className="font-medium text-gray-800">{caseData?.courtClerkName || 'Not specified'}</p>
                <p className="text-sm text-gray-600">{caseData?.courtClerkContact || 'No contact info'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="zap" className="w-5 h-5 text-blue-500 mr-2" />
              Quick Actions
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center flex-1">
                    <div className="bg-blue-100 group-hover:bg-blue-200 p-2.5 rounded-lg mr-4 transition-colors">
                      <Icon name={action.icon} className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="font-semibold text-gray-800 block">{action.label}</span>
                      <span className="text-sm text-gray-500">{action.description}</span>
                    </div>
                  </div>
                  <Icon name="chevronRight" className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Case Analytics & Insights */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Icon name="barChart" className="w-5 h-5 text-blue-500 mr-2" />
            Case Analytics & Insights
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Document Count */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Documents</p>
                  <p className="text-2xl font-bold text-blue-800">{caseData?.documentCount || 0}</p>
                </div>
                <Icon name="folder" className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Chat Messages</p>
                  <p className="text-2xl font-bold text-green-800">{caseData?.messageCount || 0}</p>
                </div>
                <Icon name="messageCircle" className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {/* Events Scheduled */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Events</p>
                  <p className="text-2xl font-bold text-purple-800">{upcomingEvents.length}</p>
                </div>
                <Icon name="calendar" className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            {/* Days Active */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Days Active</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {caseData?.filingDate ? 
                      Math.floor((new Date().getTime() - new Date(caseData.filingDate).getTime()) / (1000 * 60 * 60 * 24)) 
                      : 0}
                  </p>
                </div>
                <Icon name="clock" className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Case Progress</span>
                <span className="text-sm text-gray-500">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Documentation Complete</span>
                <span className="text-sm text-gray-500">60%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Icon name="fileText" className="w-5 h-5 text-blue-500 mr-2" />
            Case Details
          </h3>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Icon name={isEditing ? 'x' : 'edit'} className="w-4 h-4 mr-1" />
            {isEditing ? 'Cancel' : 'Edit Details'}
          </button>
        </div>
        
        <div className="p-5">
          {isEditing ? (
            <CaseDetailsForm 
              caseData={caseData} 
              onCancel={() => setIsEditing(false)}
              onSave={handleSaveCaseDetails}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DetailItem label="Case Number" value={caseData?.caseNumber} />
              <DetailItem label="Court" value={caseData?.courtName} />
              <DetailItem label="Judge" value={caseData?.judgeName} />
              <DetailItem 
                label="Filing Date" 
                value={caseData?.filingDate} 
                format="date" 
              />
              <DetailItem label="Case Type" value={caseData?.caseType} />
              <DetailItem label="Status" value={caseData?.status}>
                {caseData?.status && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    caseData.status === 'Active' ? 'bg-green-100 text-green-800' :
                    caseData.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                    caseData.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {caseData.status}
                  </span>
                )}
              </DetailItem>
              <DetailItem label="Jurisdiction" value={caseData?.jurisdiction} />
              <DetailItem 
                label="Next Hearing" 
                value={caseData?.nextHearingDate} 
                format="date" 
              />
              <DetailItem label="Petitioner" value={caseData?.petitionerName} />
              <DetailItem label="Respondent" value={caseData?.respondentName} />
              <DetailItem label="Case Category" value={caseData?.caseCategory} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaseDashboard;
