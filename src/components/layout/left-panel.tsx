"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
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

interface LeftPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  loadingChatId?: string | null;
  setLoadingChatId?: (id: string | null) => void;
}

export default function LeftPanel({ isCollapsed, onToggleCollapse, loadingChatId: propLoadingChatId, setLoadingChatId: propSetLoadingChatId }: LeftPanelProps) {
  const { activeView, setActiveView, selectedChatId, setSelectedChatId, selectedCaseId, setSelectedCaseId, workspaceMode, setWorkspaceMode } = useAppContext();
  const { cases, updateCase, deleteCase, loading: casesLoading } = useCases();
  const { chats, updateChat, deleteChat, refetch: refetchChats, loading: chatsLoading } = useChats();
  const { user } = useFirebaseUser();
  const { toast } = useToast();
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [chatFilter, setChatFilter] = useState<'general' | 'linked'>('general');
  const [selectedItem, setSelectedItem] = useState<{id: string, name: string, type: 'case' | 'chat'} | null>(null);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(propLoadingChatId || null);
  const [isCaseCreationModalOpen, setIsCaseCreationModalOpen] = useState(false);
  const profileTriggerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const prevCollapsedRef = useRef(isCollapsed);

  // Detect mobile/tablet view (< 1024px covers mobile and iPad)
  useEffect(() => {
    const checkMobileOrTablet = () => {
      setIsMobileOrTablet(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    return () => window.removeEventListener('resize', checkMobileOrTablet);
  }, []);

  // Trigger animations when panel opens/closes
  useEffect(() => {
    if (isMobileOrTablet) {
      const wasCollapsed = prevCollapsedRef.current;
      const isNowCollapsed = isCollapsed;
      
      if (!wasCollapsed && isNowCollapsed) {
        // Panel is closing
        setIsClosing(true);
        const timer = setTimeout(() => {
          setIsClosing(false);
        }, 300);
        return () => clearTimeout(timer);
      } else if (wasCollapsed && !isNowCollapsed) {
        // Panel is opening
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 300);
        return () => clearTimeout(timer);
      }
      
      prevCollapsedRef.current = isCollapsed;
    }
  }, [isCollapsed, isMobileOrTablet]);

  // Handle backdrop click to close on mobile/tablet
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isMobileOrTablet && !isCollapsed && e.target === e.currentTarget) {
      onToggleCollapse();
    }
  };


  const handleNewChat = () => {
    // Clear selected chat to show fresh chat interface
    setSelectedChatId(null);
    setActiveView('chatView');
  };

  const handleNewCase = () => {
    setIsCaseCreationModalOpen(true);
  };

  const handleCreateCase = async (caseData: any) => {
    try {
      // Create the case in Firestore
      const newCase = {
        id: `case_${Date.now()}`,
        caseName: caseData.caseName,
        summary: caseData.summary,
        details: {
          petitionerName: caseData.petitionerName,
          respondentName: caseData.respondentName,
          courtName: caseData.courtName,
          caseNumber: caseData.caseNumber,
          legalSections: caseData.legalSections.split(',').map((s: string) => s.trim())
        },
        extractedMetadata: caseData.extractedMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a new chat linked to this case
      const newChat = {
        id: `chat_${Date.now()}`,
        title: `Chat for ${caseData.caseName}`,
        linkedCaseId: newCase.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Navigate to the new case
      setSelectedCaseId(newCase.id);
      setSelectedChatId(newChat.id);
      setActiveView('caseDetailView');
      
      console.log('Case created:', newCase);
      console.log('New chat created:', newChat);
      
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  const handleItemClick = (id: string, type: 'case' | 'chat') => {
    if (type === 'case') {
      setSelectedCaseId(id);
      setSelectedChatId(null); // Clear chat selection when viewing case
      setActiveView('caseDetailView');
      // Switch right panel to Case workspace when a case is selected
      setWorkspaceMode('case');
    } else {
      setSelectedChatId(id);
      // If this chat is linked to a case, reflect it in selectedCaseId for right-panel context button
      const linked = chats.find(c => c.id === id)?.linkedCaseId || null;
      setSelectedCaseId(linked ?? null);
      setActiveView('chatView');
      // Ensure right panel shows General workspace when a chat is selected
      setWorkspaceMode('general');
    }
    
    // Auto-collapse left panel on mobile/tablet after selection
    if (isMobileOrTablet && !isCollapsed) {
      onToggleCollapse();
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
    
    // This is the logic bug fix:
    if (type === 'chat') {
      setTimeout(() => setIsLinkModalOpen(true), 0);
    } else {
      // This is a 'case', DO NOT open the LinkUnlinkModal
      console.warn('"Move to organization" clicked for a case. This requires a different modal and handler.');
      alert('"Move to organization" is not yet implemented for cases.');
      setSelectedItem(null); // Clear selection since we're not opening a modal
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

  const [deleteChatsOption, setDeleteChatsOption] = useState(false);

  // Memoize linked chats calculation to prevent infinite re-renders
  const linkedChatsForCase = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'case' || !selectedItem.id) return [];
    return chats.filter(c => c.linkedCaseId === selectedItem.id);
  }, [chats, selectedItem?.id, selectedItem?.type]);

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    
    try {
      if (selectedItem.type === 'case') {
        // Case deletion disabled - just log for now
        console.log('Case delete button triggered:', {
          caseId: selectedItem.id,
          caseName: selectedItem.name,
          deleteChatsOption: deleteChatsOption
        });
        // Close modal after logging
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
        setDeleteChatsOption(false);
      } else if (selectedItem.type === 'chat') {
        await deleteChat(selectedItem.id);
        // If the deleted chat was selected, clear selection
        if (selectedChatId === selectedItem.id) {
          setSelectedChatId(null);
        }
        // Close modal and clear selection after successful deletion
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
    
    // Show loading toast
    const loadingToast = toast({
      title: "Linking chat...",
      description: `Linking "${chatName}" to ${caseName}`,
      duration: 0, // Don't auto-dismiss
    });
    
    try {
      await updateChat(selectedItem.id, { linkedCaseId: caseId });
      setIsLinkModalOpen(false);
      setSelectedItem(null);
      
      // Refresh chats to show updated data immediately
      await refetchChats();
      
      // Dismiss loading toast and show success
      loadingToast.dismiss();
      toast({
        title: "Successfully linked!",
        description: `"${chatName}" is now linked to ${caseName}`,
        duration: 3000,
      });
      
      // If we're switching from general to linked or vice versa, 
      // switch the filter to show the updated chat
      if (caseId && chatFilter === 'general') {
        setChatFilter('linked');
      } else if (!caseId && chatFilter === 'linked') {
        setChatFilter('general');
      }
    } catch (error) {
      console.error('Error linking chat to case:', error);
      
      // Dismiss loading toast and show error
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
    
    // Show loading toast
    const loadingToast = toast({
      title: "Unlinking chat...",
      description: `Removing "${chatName}" from ${caseName}`,
      duration: 0, // Don't auto-dismiss
    });
    
    try {
      await updateChat(chatId, { linkedCaseId: null });
      
      // Refresh chats to show updated data immediately
      await refetchChats();
      
      // Dismiss loading toast and show success
      loadingToast.dismiss();
      toast({
        title: "Successfully unlinked!",
        description: `"${chatName}" is now a general chat`,
        duration: 3000,
      });
      
      // If we're currently viewing linked chats and this was the last one, switch to general
      if (chatFilter === 'linked') {
        const remainingLinkedChats = chats.filter(chat => chat.id !== chatId && chat.linkedCaseId);
        if (remainingLinkedChats.length === 0) {
          setChatFilter('general');
        }
      }
    } catch (error) {
      console.error('Error unlinking chat from case:', error);
      
      // Dismiss loading toast and show error
      loadingToast.dismiss();
      toast({
        title: "Failed to unlink chat",
        description: "There was an error unlinking the chat. Please try again.",
        duration: 5000,
      });
    }
  };

  const refreshPanel = () => {
    // Force refresh of data
    window.location.reload();
  };

  const filteredCases = (cases || []).filter(case_ => {
    if (!searchQuery || searchQuery.trim() === '') {
      return true; // Show all cases when no search query
    }
    return case_.caseName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  const filteredChats = (chats || []).filter(chat => {
    const matchesSearch = !searchQuery || searchQuery.trim() === '' || 
      (chat.title || 'Untitled Chat').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (chatFilter === 'general') {
      // Show only general chats (not linked to any case)
      return matchesSearch && !chat.linkedCaseId;
    } else {
      // Show only case-linked chats
      return matchesSearch && chat.linkedCaseId;
    }
  });

  // Mobile/Tablet: overlay mode with backdrop
  if (isMobileOrTablet) {
    // Don't show collapsed icon bar on mobile - handled by top button in layout
    if (isCollapsed) {
      return null;
    }

    // Show overlay panel when not collapsed
    return (
      <>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleBackdropClick}
        />
        
        {/* Panel - slides in from left */}
        <div className={`fixed left-0 top-0 h-full w-[85vw] max-w-sm bg-white flex flex-col text-gray-900 border-r border-gray-200 transition-transform duration-300 ease-in-out z-50 shadow-xl overflow-hidden ${
          isClosing ? '-translate-x-full' : isAnimating ? 'animate-[slideInLeft_0.3s_ease-in-out]' : ''
        }`} style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Logo with hoverable chevron to collapse */}
                <div className="relative group w-8 h-8">
                  <img 
                    src="/LexLogo.jpg" 
                    alt="LexAmplify Logo" 
                    className="w-8 h-8 rounded-lg object-cover"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <span className="logo-fallback text-black font-semibold text-sm w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                    L
                  </span>
                  
                </div>
                <span className="font-medium text-lg text-gray-900 transition-opacity duration-300 ease-in-out">LexAmplify</span>
              </div>
              <button
                    onClick={onToggleCollapse}
                    className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center opacity-100 transition-opacity"
                    tabIndex={-1}
                    aria-label="Collapse sidebar"
                  >
                    <Icon name="x" className="w-4 h-4 text-black" />
                  </button>
            </div>
          </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Actions */}
        <div className="p-4 space-y-1">
          {/* New Chat */}
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out" onClick={handleNewChat}>
            <Icon name="plusCircle" className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-800 font-medium transition-opacity duration-300 ease-in-out">New chat</span>
          </div>

          {/* Search Chats */}
          <div 
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Icon name="search" className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-black font-medium transition-opacity duration-300 ease-in-out">Search chats</span>
          </div>

          {/* Library */}
          <div 
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
            onClick={() => setActiveView('libraryView')}
          >
            <Icon name="bookOpen" className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-black font-medium transition-opacity duration-300 ease-in-out">Library</span>
          </div>
        </div>

        {/* Cases Section */}
        <div className="px-4 py-3">
          <h3 className="text-sm font-medium text-gray-500 mb-2 px-2 transition-opacity duration-300 ease-in-out">Cases</h3>
          
          <div className="space-y-0">
            {/* New Case */}
            <div className="flex items-center space-x-3 p-1 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out" onClick={handleNewCase}>
              <Icon name="folderPlus" className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-black font-medium transition-opacity duration-300 ease-in-out">New case</span>
            </div>

            {/* Existing Cases */}
            {/* Existing Cases */}
                  {casesLoading ? (
       <CaseSkeletonList count={3} className="space-y-0.5" />
      ) : (
       filteredCases.map((case_) => (
        <div
         key={case_.id}
         className="group flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
         onClick={() => handleItemClick(case_.id, 'case')}
        >
         <div className="flex items-center space-x-3 flex-1 min-w-0">
          <span className="text-sm text-black truncate font-medium transition-opacity duration-300 ease-in-out">
           {case_.caseName}
          </span>
         </div>

         {/* Logic from first example applied here */}
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
              Rename           </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLink(case_.id, case_.caseName, 'case')}
              className="text-black hover:bg-gray-50"
             >
              Move to organization
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
       ))
      )}
          </div>
        </div>

        {/* Chats Section */}
        <div className="px-4 py-1">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-sm font-medium text-gray-500 transition-opacity duration-300 ease-in-out">Chats</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setChatFilter('general')}
                className={`text-xs px-2 py-1 rounded transition-all duration-200 ${
                  chatFilter === 'general'
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setChatFilter('linked')}
                className={`text-xs px-2 py-1 rounded transition-all duration-200 ${
                  chatFilter === 'linked'
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Case-Linked
              </button>
            </div>
          </div>
          
          <div className="space-y-0 max-h-96 overflow-y-auto">
            {chatsLoading ? (
              <ChatSkeletonList count={4} className="space-y-0.5" />
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const linkedCase = chat.linkedCaseId ? cases.find(c => c.id === chat.linkedCaseId) : null;
                return (
                  <div
                    key={chat.id}
                    className="group flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
                    onClick={() => handleItemClick(chat.id, 'chat')}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {loadingChatId === chat.id || chat.title === 'Loading...' ? (
                        <ChatTitleLoading className="w-full" />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-black truncate font-medium transition-opacity duration-300 ease-in-out block">
                            {chat.title || 'Untitled Chat'}
                          </span>
                          {linkedCase && (
                            <span className="text-xs text-blue-600 truncate block">
                              Linked to: {linkedCase.caseName}
                            </span>
                          )}
                        </div>
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
                            {chat.linkedCaseId ? 'Change case link' : 'Link to case'}
                          </DropdownMenuItem>
                          {chat.linkedCaseId && (
                            <DropdownMenuItem
                              onClick={() => handleUnlink(chat.id)}
                              className="text-orange-600 hover:bg-gray-50"
                            >
                              Unlink from case
                            </DropdownMenuItem>
                          )}
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
                <p className="text-sm text-gray-500">
                  {chatFilter === 'general' 
                    ? 'No general chats yet' 
                    : 'No case-linked chats yet'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {chatFilter === 'general' 
                    ? 'Create a new chat to get started' 
                    : 'Link a chat to a case to see it here'
                  }
                </p>
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

        {/* Profile Dropdown */}
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

      {/* Use ConfirmationModal for both cases and chats (same simple approach) */}
      {isDeleteModalOpen && selectedItem && (
        <ConfirmationModal
          key={selectedItem.id} // Key ensures clean remount
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
      </>
    );
  }

  // Desktop: normal side panel
  return (
    <div className="w-64 bg-white h-full flex flex-col text-gray-900 border-r border-gray-200 transition-all duration-500 ease-in-out overflow-hidden" style={{ fontFamily: 'ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo with hoverable chevron to collapse */}
            <div className="relative group w-8 h-8">
              <img 
                src="/LexLogo.jpg" 
                alt="LexAmplify Logo" 
                className="w-8 h-8 rounded-lg object-cover"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <span className="logo-fallback text-black font-semibold text-sm w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                L
              </span>
              
            </div>
            <span className="font-medium text-lg text-gray-900 transition-opacity duration-300 ease-in-out">LexAmplify</span>
          </div>
          <button
                onClick={onToggleCollapse}
                className=" w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center opacity-100 transition-opacity"
                tabIndex={-1}
                aria-label="Collapse sidebar"
              >
                <Icon name="chevronLeft" className="w-4 h-4 text-black" />
              </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Actions */}
        <div className="p-4 space-y-1">
          {/* New Chat */}
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out" onClick={handleNewChat}>
            <Icon name="plusCircle" className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-800 font-medium transition-opacity duration-300 ease-in-out">New chat</span>
          </div>

          {/* Search Chats */}
          <div 
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Icon name="search" className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-black font-medium transition-opacity duration-300 ease-in-out">Search chats</span>
          </div>

          {/* Library */}
          <div 
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
            onClick={() => setActiveView('libraryView')}
          >
            <Icon name="bookOpen" className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-black font-medium transition-opacity duration-300 ease-in-out">Library</span>
          </div>
        </div>

        {/* Cases Section */}
        <div className="px-4 py-3">
          <h3 className="text-sm font-medium text-gray-500 mb-2 px-2 transition-opacity duration-300 ease-in-out">Cases</h3>
          
          <div className="space-y-0">
            {/* New Case */}
            <div className="flex items-center space-x-3 p-1 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out" onClick={handleNewCase}>
              <Icon name="folderPlus" className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-black font-medium transition-opacity duration-300 ease-in-out">New case</span>
            </div>

            {/* Existing Cases */}
            {casesLoading ? (
              <CaseSkeletonList count={3} className="space-y-0.5" />
            ) : (
              filteredCases.map((case_) => (
                <div
                  key={case_.id}
                  className="group flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
                  onClick={() => handleItemClick(case_.id, 'case')}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-sm text-black truncate font-medium transition-opacity duration-300 ease-in-out">
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
                          onClick={() => handleLink(case_.id, case_.caseName, 'case')}
                          className="text-black hover:bg-gray-50"
                        >
                          Move to organization
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
              ))
            )}
          </div>
        </div>

        {/* Chats Section */}
        <div className="px-4 py-1">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-sm font-medium text-gray-500 transition-opacity duration-300 ease-in-out">Chats</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setChatFilter('general')}
                className={`text-xs px-2 py-1 rounded transition-all duration-200 ${
                  chatFilter === 'general'
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setChatFilter('linked')}
                className={`text-xs px-2 py-1 rounded transition-all duration-200 ${
                  chatFilter === 'linked'
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Case-Linked
              </button>
            </div>
          </div>
          
          <div className="space-y-0 max-h-96 overflow-y-auto">
            {chatsLoading ? (
              <ChatSkeletonList count={4} className="space-y-0.5" />
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const linkedCase = chat.linkedCaseId ? cases.find(c => c.id === chat.linkedCaseId) : null;
                return (
                  <div
                    key={chat.id}
                    className="group flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer transition-all duration-200 ease-in-out"
                    onClick={() => handleItemClick(chat.id, 'chat')}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {loadingChatId === chat.id || chat.title === 'Loading...' ? (
                        <ChatTitleLoading className="w-full" />
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-black truncate font-medium transition-opacity duration-300 ease-in-out block">
                            {chat.title || 'Untitled Chat'}
                          </span>
                          {linkedCase && (
                            <span className="text-xs text-blue-600 truncate block">
                              Linked to: {linkedCase.caseName}
                            </span>
                          )}
                        </div>
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
                            {chat.linkedCaseId ? 'Change case link' : 'Link to case'}
                          </DropdownMenuItem>
                          {chat.linkedCaseId && (
                            <DropdownMenuItem
                              onClick={() => handleUnlink(chat.id)}
                              className="text-orange-600 hover:bg-gray-50"
                            >
                              Unlink from case
                            </DropdownMenuItem>
                          )}
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
                <p className="text-sm text-gray-500">
                  {chatFilter === 'general' 
                    ? 'No general chats yet' 
                    : 'No case-linked chats yet'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {chatFilter === 'general' 
                    ? 'Create a new chat to get started' 
                    : 'Link a chat to a case to see it here'
                  }
                </p>
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

        {/* Profile Dropdown */}
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
