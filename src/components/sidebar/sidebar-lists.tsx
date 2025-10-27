"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, FileText, FolderOpen } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useCases } from '@/context/cases-context';
import { useChats } from '@/context/chats-context';
import { useDrafts } from '@/hooks/use-drafts';
import NewCaseModal from '@/components/modals/new-case-modal';
import NewDraftModal from '@/components/modals/new-draft-modal';

interface SidebarListsProps {
  activeTab: 'cases' | 'drafts' | 'chats';
}

export default function SidebarLists({ activeTab }: SidebarListsProps) {
  const { setActiveView, setSelectedCaseId, setSelectedChatId, setSelectedDraftId } = useAppContext();
  const { cases, loading: casesLoading } = useCases();
  const { chats, loading: chatsLoading } = useChats();
  const { drafts, loading: draftsLoading } = useDrafts();
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showNewDraftModal, setShowNewDraftModal] = useState(false);

  const loading = casesLoading || chatsLoading || draftsLoading;

  const handleItemClick = (type: string, id: string) => {
    if (type === 'case') {
      setSelectedCaseId(id);
      setActiveView('caseDetail');
    } else if (type === 'chat') {
      setSelectedChatId(id);
      setActiveView('chat');
    } else if (type === 'draft') {
      setSelectedDraftId(id);
      setActiveView('draftEditor');
    }
  };

  const handleNewItem = () => {
    if (activeTab === 'cases') {
      setShowNewCaseModal(true);
    } else if (activeTab === 'drafts') {
      setShowNewDraftModal(true);
    } else if (activeTab === 'chats') {
      // New chat is handled in header
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 capitalize">
            {activeTab}
          </h3>
          <Button
            onClick={handleNewItem}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {activeTab === 'cases' && cases.map((case_) => (
            <div key={case_.id} className="space-y-1">
              <Button
                variant="ghost"
                onClick={() => handleItemClick('case', case_.id)}
                className="w-full justify-start h-8 px-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FolderOpen className="h-4 w-4 mr-2 text-gray-400" />
                {case_.caseName}
              </Button>
              {/* Nested chats for this case */}
              {case_.chats?.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  onClick={() => handleItemClick('chat', chat.id)}
                  className="w-full justify-start h-7 px-2 ml-4 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <MessageSquare className="h-3 w-3 mr-2 text-gray-400" />
                  {chat.title}
                </Button>
              ))}
            </div>
          ))}

          {activeTab === 'drafts' && drafts.map((draft) => (
            <Button
              key={draft.id}
              variant="ghost"
              onClick={() => handleItemClick('draft', draft.id)}
              className="w-full justify-start h-8 px-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2 text-gray-400" />
              {draft.draftTitle}
            </Button>
          ))}

          {activeTab === 'chats' && chats.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              onClick={() => handleItemClick('chat', chat.id)}
              className="w-full justify-start h-8 px-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
              {chat.title}
            </Button>
          ))}

          {((activeTab === 'cases' && cases.length === 0) ||
            (activeTab === 'drafts' && drafts.length === 0) ||
            (activeTab === 'chats' && chats.length === 0)) && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No {activeTab} found
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewCaseModal 
        isOpen={showNewCaseModal} 
        onClose={() => setShowNewCaseModal(false)} 
      />
      <NewDraftModal 
        isOpen={showNewDraftModal} 
        onClose={() => setShowNewDraftModal(false)} 
      />
    </div>
  );
}
