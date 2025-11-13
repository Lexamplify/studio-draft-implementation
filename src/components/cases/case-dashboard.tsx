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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
  caseNumber: 'COM.A. 451/2024',
  courtName: 'Delhi High Court, Commercial Division',
  judgeName: 'Hon\'ble Justice Rajiv Mehra',
  filingDate: '2024-02-10',
  caseType: 'Commercial Suit',
  status: 'Active',
  jurisdiction: 'High Court',
  nextHearingDate: '2024-12-20',
  petitionerName: 'M/s. Apex Solutions Pvt. Ltd.',
  respondentName: 'M/s. Innovate Builders',
  caseCategory: 'Commercial Dispute - Software Development Contract',
  clientName: 'Sarvesh Kumar, CEO - Apex Solutions',
  clientContact: '+91 98765 43210 | sarvesh@apexsolutions.in',
  opposingCounselName: 'Adv. Deepak Gupta',
  opposingCounselContact: '+91 98765 43211 | deepak.gupta@lawfirm.in',
  courtClerkName: 'Rajesh Verma',
  courtClerkContact: '+91 98765 43212 | commercial.dhc@courts.gov.in',
  documentCount: 52,
  messageCount: 28,
  claimAmount: 'INR 2.5 Crores',
  caseDescription: 'Commercial suit for the recovery of INR 2.5 Crores for breach of contract related to ERP software development. Petitioner claims respondent withheld payment for the final phase. Respondent alleges critical bugs and failure to meet performance metrics, filing a counter-claim for damages.',
  lastModified: '2024-12-10'
};

const mockUpcomingEvents = [
  {
    id: 'evt-1',
    title: 'Final Arguments - Commercial Suit',
    date: '2024-12-20T10:30:00',
    time: '10:30 AM',
    description: 'Final hearing for arguments on breach of contract and recovery of INR 2.5 Crores',
    type: 'Hearing'
  },
  {
    id: 'evt-2',
    title: 'Deadline - Expert Witness Examination',
    date: '2024-12-18T17:00:00',
    time: '5:00 PM',
    description: 'Cross-examination of technical expert regarding software performance benchmarks',
    type: 'Deadline'
  },
  {
    id: 'evt-3',
    title: 'Client Meeting - Settlement Discussion',
    date: '2024-12-15T14:00:00',
    time: '2:00 PM',
    description: 'Discuss potential settlement options with Apex Solutions leadership',
    type: 'Meeting'
  },
  {
    id: 'evt-4',
    title: 'Deadline - Submit Technical Evidence',
    date: '2024-12-13T16:00:00',
    time: '4:00 PM',
    description: 'Submission of additional performance benchmark documentation',
    type: 'Deadline'
  }
];

function CaseDashboard({ caseData: propCaseData }: CaseDashboardProps) {
  const { selectedCaseId } = useAppContext();
  const [caseData, setCaseData] = useState<any>(propCaseData || mockCaseData);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>(mockUpcomingEvents);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('This commercial suit (COM.A. 451/2024) involves M/s. Apex Solutions Pvt. Ltd. as petitioner seeking recovery of INR 2.5 Crores from M/s. Innovate Builders for alleged breach of contract in ERP software development. The petitioner claims that Innovate Builders wrongfully withheld payment for the final phase of development. In response, Innovate Builders has filed a counter-claim alleging critical software bugs and failure to meet specified performance metrics. A technical expert\'s report has been submitted confirming the software is functional but fails certain performance benchmarks. The case centers on interpreting contractual terms regarding performance standards, assessing damages for breach, and determining the validity of counter-claims. Recent filings include expert technical analysis, performance benchmark test results, and updated claims documentation.');

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
      description: 'Schedule hearing on Dec 20, deadlines',
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
      description: 'Add technical evidence, expert reports',
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
      description: 'Reply affidavit for technical evidence',
      onClick: () => {
        // This would open the draft editor
        console.log('Create draft clicked');
      } 
    },
    { 
      id: 'start-chat', 
      label: 'Start Chat', 
      icon: 'messageCircle', 
      description: 'Analyze case strategy with AI',
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
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* AI-Powered Case Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 flex items-center">
              <Icon name="sparkles" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
              AI-Generated Case Summary
            </h2>
            <p className="text-sm sm:text-base text-gray-700">
              {aiSummary || 'AI summary will be generated based on case documents...'}
            </p>
            <p className="text-xs sm:text-sm text-blue-600 mt-2">
              📊 Generated from 52 documents • 🕐 Last updated 2 hours ago
            </p>
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex items-center whitespace-nowrap">
            [+] Expand to read full AI summary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="calendar" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
              Upcoming Deadlines
            </h3>
          </div>
          <div className="p-4 sm:p-5">
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
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="users" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
              Key Contacts
            </h3>
          </div>
          <div className="p-4 sm:p-5">
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
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <Icon name="zap" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
              Quick Actions
            </h3>
          </div>
          <div className="p-4 sm:p-5">
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
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
            <Icon name="barChart" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
            Case Analytics & Insights
          </h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
            <Icon name="fileText" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
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
        
        <div className="p-4 sm:p-5">
          {isEditing ? (
            <CaseDetailsForm 
              caseData={caseData} 
              onCancel={() => setIsEditing(false)}
              onSave={handleSaveCaseDetails}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <DetailItem label="Claim Amount" value={caseData?.claimAmount}>
                {caseData?.claimAmount && (
                  <span className="ml-2 px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {caseData.claimAmount}
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
              {caseData?.lastModified && (
                <DetailItem label="Last Modified" value={caseData.lastModified} format="date" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaseDashboard;
