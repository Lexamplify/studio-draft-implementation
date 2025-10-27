"use client";

import React, { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { useAppContext } from '@/context/app-context';
import { useCases } from '@/context/cases-context';
import { useChats } from '@/context/chats-context';
import { useDrafts } from '@/hooks/use-drafts';
import NewCaseModal from '@/components/modals/new-case-modal';
import NewDraftModal from '@/components/modals/new-draft-modal';
import ConfirmationModal from '@/components/modals/confirmation-modal';
import RenameModal from '@/components/modals/rename-modal';
import ProfileSection from '@/components/sidebar/profile-section';

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function CollapsibleSidebar({ isCollapsed, onToggle }: CollapsibleSidebarProps) {
  const {
    activeView,
    setActiveView,
    selectedCaseId,
    setSelectedCaseId,
    selectedChatId,
    setSelectedChatId,
    selectedDraftId,
    setSelectedDraftId
  } = useAppContext();
  const { cases, loading: casesLoading } = useCases();
  const { chats, loading: chatsLoading } = useChats();
  const { drafts, loading: draftsLoading } = useDrafts();
  const [isNewCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [isNewDraftModalOpen, setNewDraftModalOpen] = useState(false);
  const [isRenameModalOpen, setRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{type: 'case' | 'chat', id: string, name: string} | null>(null);
  const [deleteItem, setDeleteItem] = useState<{type: 'case' | 'chat', id: string, name: string} | null>(null);

  const handleSidebarClick = (view: string, sidebarId: string) => {
    setActiveView(view as any);
  };

  const handleCaseClick = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveView('caseDetailView');
  };

  const handleChatClick = (chatId: string) => {
    setSelectedChatId(chatId);
    setActiveView('chatView');
  };

  const handleDraftClick = (draftId: string) => {
    setSelectedDraftId(draftId);
    setActiveView('draftEditorView');
  };

  const handleNewChat = () => {
    setSelectedChatId(null);
    setActiveView('chatView');
  };

  const handleRename = (type: 'case' | 'chat', id: string, name: string) => {
    setRenameItem({ type, id, name });
    setRenameModalOpen(true);
  };

  const handleDelete = (type: 'case' | 'chat', id: string, name: string) => {
    setDeleteItem({ type, id, name });
    setDeleteModalOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (renameItem) {
      if (renameItem.type === 'case') {
        // Update case name
        console.log('Renaming case:', renameItem.id, 'to:', newName);
      } else {
        // Update chat title
        console.log('Renaming chat:', renameItem.id, 'to:', newName);
      }
    }
    setRenameModalOpen(false);
    setRenameItem(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      if (deleteItem.type === 'case') {
        // Delete case
        console.log('Deleting case:', deleteItem.id);
      } else {
        // Delete chat
        console.log('Deleting chat:', deleteItem.id);
      }
    }
    setDeleteModalOpen(false);
    setDeleteItem(null);
  };

  const getActiveItem = () => {
    if (activeView === 'caseDetailView') return 'cases';
    if (activeView === 'draftEditorView') return 'drafts';
    if (activeView === 'chatView') return 'chat';
    return 'cases';
  };

  return (
    <>
      <aside className={`bg-white flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-80'
      } h-full border-l border-gray-200 shadow-sm`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3 p-3">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-blue-600">Lexamplify</h1>
          )}
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <>
                <button
                  onClick={() => setNewCaseModalOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="New Case"
                >
                  <Icon name="briefcase" className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setNewDraftModalOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="New Draft"
                >
                  <Icon name="fileLines" className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="New Chat"
                >
                  <Icon name="plus" className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Icon name={isCollapsed ? "menu" : "x"} className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 px-3">
          <SidebarItem
            icon="briefcase"
            label="Cases"
            isActive={getActiveItem() === 'cases'}
            onClick={() => handleSidebarClick('caseDetailView', 'cases')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon="fileLines"
            label="Drafts"
            isActive={getActiveItem() === 'drafts'}
            onClick={() => handleSidebarClick('draftEditorView', 'drafts')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon="comments"
            label="Chat"
            isActive={getActiveItem() === 'chat'}
            onClick={() => handleSidebarClick('chatView', 'chat')}
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* Content Lists */}
        <div className="flex-grow overflow-y-auto mt-4 pr-1 px-3">
          {getActiveItem() === 'cases' && (
            <CasesList
              onItemClick={handleSidebarClick}
              onCaseClick={handleCaseClick}
              onRename={handleRename}
              onDelete={handleDelete}
              isCollapsed={isCollapsed}
              cases={cases}
              loading={casesLoading}
              selectedCaseId={selectedCaseId}
              chats={chats}
              selectedChatId={selectedChatId}
              onChatClick={handleChatClick}
            />
          )}
          {getActiveItem() === 'drafts' && (
            <DraftsList
              onItemClick={handleSidebarClick}
              onDraftClick={handleDraftClick}
              isCollapsed={isCollapsed}
              drafts={drafts}
              loading={draftsLoading}
              selectedDraftId={selectedDraftId}
            />
          )}
          {getActiveItem() === 'chat' && (
            <ChatsList
              onItemClick={handleSidebarClick}
              onChatClick={handleChatClick}
              isCollapsed={isCollapsed}
              chats={chats}
              loading={chatsLoading}
              selectedChatId={selectedChatId}
            />
          )}
        </div>

        {/* Profile Section */}
        <ProfileSection />
      </aside>

      {/* Modals */}
      <NewCaseModal 
        isOpen={isNewCaseModalOpen} 
        onClose={() => setNewCaseModalOpen(false)} 
      />
      <NewDraftModal 
        isOpen={isNewDraftModalOpen} 
        onClose={() => setNewDraftModalOpen(false)} 
      />
      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onConfirm={handleRenameConfirm}
        currentName={renameItem?.name || ''}
        title={`Rename ${renameItem?.type === 'case' ? 'Case' : 'Chat'}`}
        placeholder={`Enter new ${renameItem?.type === 'case' ? 'case' : 'chat'} name`}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteItem?.type === 'case' ? 'Case' : 'Chat'}`}
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}

interface SidebarItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed: boolean;
}

function SidebarItem({ icon, label, isActive, onClick, isCollapsed }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
      } ${isCollapsed ? 'justify-center' : ''}`}
    >
      <Icon name={icon} className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
      {!isCollapsed && <span className="ml-3 font-medium text-sm">{label}</span>}
    </div>
  );
}

interface CasesListProps {
  onItemClick: (view: string, sidebarId: string) => void;
  onCaseClick: (caseId: string) => void;
  onRename: (type: 'case' | 'chat', id: string, name: string) => void;
  onDelete: (type: 'case' | 'chat', id: string, name: string) => void;
  isCollapsed: boolean;
  cases: any[];
  loading: boolean;
  selectedCaseId: string | null;
  chats: any[];
  selectedChatId: string | null;
  onChatClick: (chatId: string) => void;
}

function CasesList({ onItemClick, onCaseClick, onRename, onDelete, isCollapsed, cases, loading, selectedCaseId, chats, selectedChatId, onChatClick }: CasesListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="space-y-2">
        {cases.slice(0, 3).map((case_, index) => (
          <div key={case_.id} className="flex justify-center">
            <SidebarItem
              icon="folder"
              label={case_.caseName || `Case ${index + 1}`}
              onClick={() => onCaseClick(case_.id)}
              isCollapsed={true}
              isActive={selectedCaseId === case_.id}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-3 mt-4 mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">My Cases</h3>
        <button
          onClick={() => onItemClick('caseDetailView', 'cases')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          title="Create New Case"
        >
          + New
        </button>
      </div>
      <div className="space-y-1">
        {cases.map((case_, index) => (
          <div key={case_.id}>
            <div className="pl-2 group">
              <div
                className="flex items-center justify-between"
                onClick={() => onCaseClick(case_.id)}
              >
                <SidebarItem
                  icon="folder"
                  label={case_.caseName || `Case ${index + 1}`}
                  isCollapsed={false}
                  isActive={selectedCaseId === case_.id}
                />
                {!isCollapsed && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename('case', case_.id, case_.caseName || `Case ${index + 1}`);
                      }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Rename case"
                    >
                      <Icon name="wrench" className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete('case', case_.id, case_.caseName || `Case ${index + 1}`);
                      }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Delete case"
                    >
                      <Icon name="x" className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
              {/* Show linked chats for this case */}
              {chats.filter(chat => chat.linkedCaseId === case_.id).length > 0 && (
                <div className="ml-8 border-l border-gray-200 pl-2">
                  {chats
                    .filter(chat => chat.linkedCaseId === case_.id)
                    .slice(0, 2) // Show max 2 chats
                    .map((chat) => (
                      <div 
                        key={chat.id}
                        className="text-sm group/chat"
                      >
                        <div
                          className="flex items-center justify-between"
                          onClick={() => onChatClick(chat.id)}
                        >
                          <SidebarItem 
                            icon="message" 
                            label={chat.title || 'Untitled Chat'}
                            isCollapsed={false}
                            isActive={selectedChatId === chat.id}
                          />
                          <div className="flex items-center gap-1 opacity-0 group-hover/chat:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRename('chat', chat.id, chat.title || 'Untitled Chat');
                              }}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                              title="Rename chat"
                            >
                              <Icon name="wrench" className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete('chat', chat.id, chat.title || 'Untitled Chat');
                              }}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                              title="Delete chat"
                            >
                              <Icon name="x" className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DraftsListProps {
  onItemClick: (view: string, sidebarId: string) => void;
  onDraftClick: (draftId: string) => void;
  isCollapsed: boolean;
  drafts: any[];
  loading: boolean;
  selectedDraftId: string | null;
}

function DraftsList({ onItemClick, onDraftClick, isCollapsed, drafts, loading, selectedDraftId }: DraftsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="space-y-2">
        {drafts.slice(0, 3).map((draft, index) => (
          <div key={draft.id} className="flex justify-center">
            <SidebarItem
              icon="fileLines"
              label={draft.title || `Draft ${index + 1}`}
              onClick={() => onDraftClick(draft.id)}
              isCollapsed={true}
              isActive={selectedDraftId === draft.id}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-3 mt-4 mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Recent Drafts</h3>
        <button
          onClick={() => onItemClick('draftEditorView', 'drafts')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          title="Create New Draft"
        >
          + New
        </button>
      </div>
      <div className="space-y-1">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className="pl-2"
            onClick={() => onDraftClick(draft.id)}
          >
            <SidebarItem
              icon="fileLines"
              label={draft.title || `Draft ${index + 1}`}
              isCollapsed={false}
              isActive={selectedDraftId === draft.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChatsListProps {
  onItemClick: (view: string, sidebarId: string) => void;
  onChatClick: (chatId: string) => void;
  isCollapsed: boolean;
  chats: any[];
  loading: boolean;
  selectedChatId: string | null;
}

function ChatsList({ onItemClick, onChatClick, isCollapsed, chats, loading, selectedChatId }: ChatsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="space-y-2">
        {chats.slice(0, 3).map((chat, index) => (
          <div key={chat.id} className="flex justify-center">
            <SidebarItem
              icon="message"
              label={chat.title || `Chat ${index + 1}`}
              onClick={() => onChatClick(chat.id)}
              isCollapsed={true}
              isActive={selectedChatId === chat.id}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-3 mt-4 mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">General Chats</h3>
        <button
          onClick={() => onItemClick('chatView', 'chat')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          title="Create New Chat"
        >
          + New
        </button>
      </div>
      <div className="space-y-1">
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            className="pl-2"
            onClick={() => onChatClick(chat.id)}
          >
            <SidebarItem
              icon="message"
              label={chat.title || `Chat ${index + 1}`}
              isCollapsed={false}
              isActive={selectedChatId === chat.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}