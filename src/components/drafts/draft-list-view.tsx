"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Plus,
  Calendar,
  Link as LinkIcon,
  MoreVertical
} from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useDrafts } from '@/hooks/use-drafts';

export default function DraftListView() {
  const { setActiveView, setSelectedDraftId } = useAppContext();
  const { drafts, loading } = useDrafts();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDrafts = drafts.filter(draft =>
    draft.draftTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDraftClick = (draftId: string) => {
    setSelectedDraftId(draftId);
    setActiveView('draftEditor');
  };

  const handleNewDraft = () => {
    // TODO: Open new draft modal
    console.log('New draft clicked');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Drafts</h1>
          <p className="text-gray-500">Manage your legal document drafts</p>
        </div>
        <Button
          onClick={handleNewDraft}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Draft
        </Button>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search drafts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Drafts Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No drafts found' : 'No drafts yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first legal document draft'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={handleNewDraft}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Draft
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrafts.map((draft) => (
              <Card
                key={draft.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleDraftClick(draft.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg line-clamp-2">
                        {draft.draftTitle}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Open draft menu
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(draft.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {draft.linkedCaseId && (
                      <div className="flex items-center text-sm text-blue-600">
                        <LinkIcon className="h-4 w-4 mr-1" />
                        <span>Linked to case</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {draft.content?.length || 0} characters
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Draft
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
