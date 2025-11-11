"use client";

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { useAppContext } from '@/context/app-context';
import { useCases } from '@/context/cases-context';
import { useChats } from '@/context/chats-context';
import { useFirebaseUser } from '@/hooks/use-firebase-user';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import RenameModal from '@/components/modals/rename-modal';
import ConfirmationModal from '@/components/modals/confirmation-modal';
import LinkUnlinkModal from '@/components/modals/link-unlink-modal';
import SearchModal from '@/components/modals/search-modal';
import ProfileSettingsDropdown from '@/components/modals/profile-settings-dropdown';
import ChatTitleLoading from '@/components/ui/chat-title-loading';
import { ChatSkeletonList } from '@/components/ui/chat-skeleton';
import { CaseSkeletonList } from '@/components/ui/case-skeleton';
import CaseCreationModal from '@/components/modals/case-creation-modal';
import { listDocuments, Document } from '@/lib/firebase-document-service';
import { apiClient } from '@/lib/api-client';

interface EditorRightPanelV2Props {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  loadingChatId?: string | null;
  setLoadingChatId?: (id: string | null) => void;
}

export default function EditorRightPanelV2({ 
  isCollapsed = false, 
  onToggleCollapse, 
  loadingChatId: propLoadingChatId, 
  setLoadingChatId: propSetLoadingChatId 
}: EditorRightPanelV2Props) {
  const { activeView, setActiveView, selectedChatId, setSelectedChatId, selectedCaseId, setSelectedCaseId, workspaceMode, setWorkspaceMode } = useAppContext();
  const { cases, updateCase, deleteCase, loading: casesLoading } = useCases();
  const { chats, updateChat, deleteChat, refetch: refetchChats, loading: chatsLoading } = useChats();
  const { user } = useFirebaseUser();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{id: string, name: string, type: 'case' | 'chat' | 'document' | 'file'} | null>(null);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(propLoadingChatId || null);
  const [isCaseCreationModalOpen, setIsCaseCreationModalOpen] = useState(false);
  const profileTriggerRef = useRef<HTMLDivElement>(null);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [caseDocuments, setCaseDocuments] = useState<Record<string, Document[]>>({});
  const [caseFiles, setCaseFiles] = useState<Record<string, any[]>>({});
  const [loadingDocuments, setLoadingDocuments] = useState<Record<string, boolean>>({});
  const [deleteChatsOption, setDeleteChatsOption] = useState(false);

  const handleNewChat = () => {
    setSelectedChatId(null);
    setActiveView('chatView');
  };

  const handleNewCase = () => {
    setIsCaseCreationModalOpen(true);
  };

  const toggleCaseExpansion = (caseId: string) => {
    setExpandedCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
        if (!caseDocuments[caseId] && !loadingDocuments[caseId] && user?.uid) {
          fetchCaseData(caseId);
        }
      }
      return newSet;
    });
  };

  const fetchCaseData = async (caseId: string) => {
    if (!user?.uid) return;
    
    setLoadingDocuments(prev => ({ ...prev, [caseId]: true }));
    
    try {
      const documents = await listDocuments(caseId, user.uid);
      setCaseDocuments(prev => ({ ...prev, [caseId]: documents }));
      
      try {
        const filesResponse = await apiClient.get(`/api/cases/${caseId}/documents`);
        if (filesResponse?.files) {
          setCaseFiles(prev => ({ ...prev, [caseId]: filesResponse.files }));
        }
      } catch (error) {
        console.log('Files API not available');
      }
    } catch (error) {
      console.error('Error fetching case data:', error);
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [caseId]: false }));
    }
  };

  const handleItemClick = (id: string, type: 'case' | 'chat' | 'document' | 'file') => {
    if (type === 'case') {
      setSelectedCaseId(id);
      setSelectedChatId(null);
      setActiveView('caseDetailView');
      setWorkspaceMode('case');
    } else if (type === 'chat') {
      setSelectedChatId(id);
      const linked = chats.find(c => c.id === id)?.linkedCaseId || null;
      setSelectedCaseId(linked ?? null);
      setActiveView('chatView');
      setWorkspaceMode('general');
    } else if (type === 'document') {
      const doc = Object.values(caseDocuments).flat().find(d => d.id === id);
      if (doc?.caseId) {
        window.location.href = `/editor/${id}`;
      }
    } else if (type === 'file') {
      const file = Object.values(caseFiles).flat().find(f => f.id === id);
      if (file?.url) {
        window.open(file.url, '_blank');
      }
    }
  };

  const handleSearchItemSelect = (type: 'chat' | 'case', id: string) => {
    handleItemClick(id, type);
  };

  const handleRename = (id: string, name: string, type: 'case' | 'chat') => {
    setSelectedItem({ id, name, type });
    setTimeout(() => setIsRenameModalOpen(true), 0);
  };

  const handleDelete = (id: string, name: string, type: 'case' | 'chat') => {
    setSelectedItem({ id, name, type });
    setTimeout(() => setIsDeleteModalOpen(true), 0);
  };

  const handleLink = (id: string, name: string, type: 'case' | 'chat') => {
    setSelectedItem({ id, name, type });
    if (type === 'chat') {
      setTimeout(() => setIsLinkModalOpen(true), 0);
    } else {
      console.warn('"Move to organization" clicked for a case. This requires a different modal and handler.');
      alert('"Move to organization" is not yet implemented for cases.');
      setSelectedItem(null);
    }
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!selectedItem) return;
    
    try {
      if (selectedItem.type === 'case') {
        await updateCase(selectedItem.id, { caseName: newName });
      } else if (selectedItem.type === 'chat') {
        await updateChat(selectedItem.id, { title: newName });
      }
      setIsRenameModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error renaming:', error);
    }
  };

  const linkedChatsForCase = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'case' || !selectedItem.id) return [];
    return chats.filter(c => c.linkedCaseId === selectedItem.id);
  }, [chats, selectedItem?.id, selectedItem?.type]);

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    
    try {
      if (selectedItem.type === 'case') {
        console.log('Case delete button triggered:', {
          caseId: selectedItem.id,
          caseName: selectedItem.name,
          deleteChatsOption: deleteChatsOption
        });
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
        setDeleteChatsOption(false);
      } else if (selectedItem.type === 'chat') {
        await deleteChat(selectedItem.id);
        if (selectedChatId === selectedItem.id) {
          setSelectedChatId(null);
        }
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleLinkConfirm = async (caseId: string | null) => {
    if (!selectedItem || selectedItem.type !== 'chat') return;
    
    const chatName = selectedItem.name;
    const caseName = caseId ? cases.find(c => c.id === caseId)?.caseName : 'General';
    
    const loadingToast = toast({
      title: "Linking chat...",
      description: `Linking "${chatName}" to ${caseName}`,
      duration: 0,
    });
    
    try {
      await updateChat(selectedItem.id, { linkedCaseId: caseId });
      setIsLinkModalOpen(false);
      setSelectedItem(null);
      await refetchChats();
      loadingToast.dismiss();
      toast({
        title: "Successfully linked!",
        description: `"${chatName}" is now linked to ${caseName}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error linking chat to case:', error);
      loadingToast.dismiss();
      toast({
        title: "Failed to link chat",
        description: "There was an error linking the chat. Please try again.",
        duration: 5000,
      });
    }
  };

  const handleUnlink = async (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    const chatName = chat?.title || 'Untitled Chat';
    const linkedCase = chat?.linkedCaseId ? cases.find(c => c.id === chat.linkedCaseId) : null;
    const caseName = linkedCase?.caseName || 'case';
    
    const loadingToast = toast({
      title: "Unlinking chat...",
      description: `Removing "${chatName}" from ${caseName}`,
      duration: 0,
    });
    
    try {
      await updateChat(chatId, { linkedCaseId: null });
      await refetchChats();
      loadingToast.dismiss();
      toast({
        title: "Successfully unlinked!",
        description: `"${chatName}" is now a general chat`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error unlinking chat from case:', error);
      loadingToast.dismiss();
      toast({
        title: "Failed to unlink chat",
        description: "There was an error unlinking the chat. Please try again.",
        duration: 5000,
      });
    }
  };

  const filteredCases = (cases || []).filter(case_ => {
    if (!searchQuery || searchQuery.trim() === '') {
      return true;
    }
    return case_.caseName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  const caseLinkedChats = useMemo(() => {
    const linked: Record<string, typeof chats> = {};
    chats.forEach(chat => {
      if (chat.linkedCaseId) {
        if (!linked[chat.linkedCaseId]) {
          linked[chat.linkedCaseId] = [];
        }
        linked[chat.linkedCaseId].push(chat);
      }
    });
    return linked;
  }, [chats]);

  const generalChats = useMemo(() => {
    return (chats || []).filter(chat => {
      const matchesSearch = !searchQuery || searchQuery.trim() === '' || 
        (chat.title || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && !chat.linkedCaseId;
    });
  }, [chats, searchQuery]);

  return (
    <div className="w-64 bg-white h-full flex flex-col text-gray-900 border-l border-gray-200 transition-all duration-500 ease-in-out overflow-hidden" style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
      {/* Section 1: Quick Actions (Non-scrollable header) */}
      <div className="p-4 border-b border-gray-200 space-y-2 flex-shrink-0">
        <Button 
          onClick={handleNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          <Icon name="plus" className="w-4 h-4 mr-2" />
          + New Chat
        </Button>
        <Button 
          onClick={handleNewCase}
          variant="outline"
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 font-medium"
        >
          <Icon name="plus" className="w-4 h-4 mr-2" />
          + New Case
        </Button>
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search chats, cases, docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
            onClick={() => setIsSearchModalOpen(true)}
          />
        </div>
      </div>

      {/* Main Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto">
        {/* Section 2: Cases/Project Tree */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">CASES</h3>
          
          <div className="space-y-0">
            {casesLoading ? (
              <CaseSkeletonList count={3} className="space-y-0.5" />
            ) : (
              filteredCases.map((case_) => {
                const isExpanded = expandedCases.has(case_.id);
                const isSelected = selectedCaseId === case_.id;
                const linkedChats = caseLinkedChats[case_.id] || [];
                const documents = caseDocuments[case_.id] || [];
                const files = caseFiles[case_.id] || [];
                const hasChildren = linkedChats.length > 0 || documents.length > 0 || files.length > 0;

                return (
                  <div key={case_.id} className="space-y-0">
                    {/* Case Item */}
                    <div
                      className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 ease-in-out ${
                        isSelected 
                          ? 'bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) {
                          toggleCaseExpansion(case_.id);
                        }
                        handleItemClick(case_.id, 'case');
                      }}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {hasChildren && (
                          <Icon 
                            name={isExpanded ? "chevronDown" : "chevronRight"} 
                            className="w-3 h-3 text-gray-400 flex-shrink-0" 
                          />
                        )}
                        {!hasChildren && <div className="w-3" />}
                        <Icon name="briefcase" className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className={`text-sm truncate transition-opacity duration-300 ease-in-out ${
                          isSelected ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                        }`}>
                          {case_.caseName}
                        </span>
                      </div>

                      {!(loadingChatId === case_.id || case_.caseName === 'Loading...') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                            >
                              <Icon name="moreHorizontal" className="w-4 h-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-gray-200">
                            <DropdownMenuItem
                              onClick={() => handleRename(case_.id, case_.caseName, 'case')}
                              className="text-black hover:bg-gray-50"
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(case_.id, case_.caseName, 'case')}
                              className="text-red-600 hover:bg-gray-50"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Children (Chats, Documents, Files) */}
                    {isExpanded && hasChildren && (
                      <div className="ml-6 space-y-0 border-l border-gray-200 pl-2">
                        {/* Case-Linked Chats */}
                        {linkedChats.map((chat) => {
                          const isChatSelected = selectedChatId === chat.id;
                          return (
                            <div
                              key={chat.id}
                              className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 ease-in-out ${
                                isChatSelected 
                                  ? 'bg-blue-50' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(chat.id, 'chat');
                              }}
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <Icon name="messageCircle" className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm truncate block ${
                                    isChatSelected ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                                  }`}>
                                    {chat.title || 'Case-Linked Chat'}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate block">
                                    The primary chat thread for this case.
                                  </span>
                                </div>
                              </div>
                              {!(loadingChatId === chat.id || chat.title === 'Loading...') && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                                    >
                                      <Icon name="moreHorizontal" className="w-4 h-4 text-gray-500" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white border-gray-200">
                                    <DropdownMenuItem
                                      onClick={() => handleRename(chat.id, chat.title || 'Untitled Chat', 'chat')}
                                      className="text-black hover:bg-gray-50"
                                    >
                                      Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(chat.id, chat.title || 'Untitled Chat', 'chat')}
                                      className="text-red-600 hover:bg-gray-50"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          );
                        })}

                        {/* Documents */}
                        {loadingDocuments[case_.id] ? (
                          <div className="px-2 py-1.5 text-xs text-gray-400">Loading documents...</div>
                        ) : (
                          documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(doc.id, 'document');
                              }}
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <Icon name="fileLines" className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm truncate block font-medium text-gray-900">
                                    {doc.title || 'Untitled Document'}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate block">
                                    A draft document.
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}

                        {/* Files */}
                        {files.map((file: any) => (
                          <div
                            key={file.id}
                            className="group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(file.id, 'file');
                            }}
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Icon name="file" className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm truncate block font-medium text-gray-900">
                                  {file.name || file.filename || 'Untitled File'}
                                </span>
                                <span className="text-xs text-gray-500 truncate block">
                                  An uploaded case file.
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 3: General Chats */}
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">GENERAL CHATS</h3>
          
          <div className="space-y-0">
            {chatsLoading ? (
              <ChatSkeletonList count={4} className="space-y-0.5" />
            ) : generalChats.length > 0 ? (
              generalChats.map((chat) => {
                const isSelected = selectedChatId === chat.id;
                return (
                  <div
                    key={chat.id}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200 ease-in-out ${
                      isSelected 
                        ? 'bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleItemClick(chat.id, 'chat')}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {loadingChatId === chat.id || chat.title === 'Loading...' ? (
                        <ChatTitleLoading className="w-full" />
                      ) : (
                        <>
                          <Icon name="messageCircle" className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className={`text-sm truncate transition-opacity duration-300 ease-in-out ${
                            isSelected ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                          }`}>
                            {chat.title || 'New Chat'}
                          </span>
                        </>
                      )}
                    </div>
                    {!(loadingChatId === chat.id || chat.title === 'Loading...') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                          >
                            <Icon name="moreHorizontal" className="w-4 h-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-gray-200">
                          <DropdownMenuItem
                            onClick={() => handleRename(chat.id, chat.title || 'Untitled Chat', 'chat')}
                            className="text-black hover:bg-gray-50"
                          >
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleLink(chat.id, chat.title || 'Untitled Chat', 'chat')}
                            className="text-black hover:bg-gray-50"
                          >
                            Link to case
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(chat.id, chat.title || 'Untitled Chat', 'chat')}
                            className="text-red-600 hover:bg-gray-50"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 px-2">
                <Icon name="message" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No general chats yet</p>
                <p className="text-xs text-gray-400 mt-1">Create a new chat to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200 relative">
        <div 
          ref={profileTriggerRef}
          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        >
          <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="user" className="w-4 h-4 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 transition-opacity duration-300 ease-in-out break-words leading-tight">
              {user?.displayName || user?.email || 'User'}
            </div>
            <div className="text-xs text-gray-500 transition-opacity duration-300 ease-in-out">Free</div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-2 py-1 rounded transition-colors">
              Upgrade
            </button>
            <Icon name="chevronDown" className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        <ProfileSettingsDropdown
          isOpen={isProfileDropdownOpen}
          onClose={() => setIsProfileDropdownOpen(false)}
          triggerRef={profileTriggerRef}
        />
      </div>

      {/* Modals */}
      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleRenameConfirm}
        currentName={selectedItem?.name || ''}
        title={`Rename ${selectedItem?.type === 'case' ? 'Case' : 'Chat'}`}
        placeholder="Enter new name"
      />

      {isDeleteModalOpen && selectedItem && (
        <ConfirmationModal
          key={selectedItem.id}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
            setDeleteChatsOption(false);
          }}
          onConfirm={handleDeleteConfirm}
          title={selectedItem.type === 'case' ? 'Delete Case' : 'Delete Chat'}
          message={`Are you sure you want to delete "${selectedItem.name}"? This action cannot be undone.`}
          type="danger"
          linkedChats={selectedItem.type === 'case' && linkedChatsForCase.length > 0 ? linkedChatsForCase : undefined}
          onDeleteChatsOption={selectedItem.type === 'case' && linkedChatsForCase.length > 0 ? setDeleteChatsOption : undefined}
          selectedDeleteOption={selectedItem.type === 'case' && linkedChatsForCase.length > 0 ? deleteChatsOption : undefined}
        />
      )}

      <LinkUnlinkModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleLinkConfirm}
        currentLinkedCaseId={selectedItem?.type === 'chat' ? chats.find(c => c.id === selectedItem.id)?.linkedCaseId || null : null}
        cases={cases || []}
        chatTitle={selectedItem?.name || ''}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectItem={handleSearchItemSelect}
        chats={chats || []}
        cases={cases || []}
      />

      <CaseCreationModal
        isOpen={isCaseCreationModalOpen}
        onClose={() => setIsCaseCreationModalOpen(false)}
      />
    </div>
  );
}

