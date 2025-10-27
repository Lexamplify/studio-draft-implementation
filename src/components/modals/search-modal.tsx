"use client";

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (type: 'chat' | 'case', id: string) => void;
  chats: any[];
  cases: any[];
}

export default function SearchModal({ isOpen, onClose, onSelectItem, chats, cases }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'chats' | 'cases'>('all');
  const [filteredResults, setFilteredResults] = useState<{
    chats: any[];
    cases: any[];
  }>({ chats: [], cases: [] });

  // Filter results based on search query and active tab
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    
    // If no search query, show all items
    if (query.length === 0) {
      setFilteredResults({ chats, cases });
      return;
    }
    
    const filteredChats = chats.filter(chat => 
      chat.title?.toLowerCase().includes(query) ||
      chat.description?.toLowerCase().includes(query) ||
      chat.lastMessage?.toLowerCase().includes(query)
    );
    
    const filteredCases = cases.filter(case_ => 
      case_.caseName?.toLowerCase().includes(query) ||
      case_.details?.summary?.toLowerCase().includes(query) ||
      case_.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );

    setFilteredResults({ chats: filteredChats, cases: filteredCases });
  }, [searchQuery, chats, cases]);

  const handleItemClick = (type: 'chat' | 'case', id: string) => {
    onSelectItem(type, id);
    onClose();
  };

  const getDisplayResults = () => {
    switch (activeTab) {
      case 'chats':
        return filteredResults.chats;
      case 'cases':
        return filteredResults.cases;
      default:
        return [...filteredResults.chats, ...filteredResults.cases];
    }
  };

  const getItemType = (item: any) => {
    if (item.caseName) return 'case';
    if (item.title) return 'chat';
    return 'unknown';
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Search</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <Icon name="x" className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats and cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({filteredResults.chats.length + filteredResults.cases.length})
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'chats'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Chats ({filteredResults.chats.length})
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'cases'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cases ({filteredResults.cases.length})
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchQuery.length > 0 && getDisplayResults().length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Icon name="search" className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getDisplayResults().map((item) => {
                const type = getItemType(item);
                const isChat = type === 'chat';
                const isCase = type === 'case';
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(type as 'chat' | 'case', item.id)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {isChat ? (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon name="messageCircle" className="w-4 h-4 text-blue-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Icon name="folder" className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {isChat ? item.title : item.caseName}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDate(item.createdAt || item.updatedAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {isChat 
                            ? (item.lastMessage || item.description || 'No messages yet')
                            : (item.details?.summary || 'No description available')
                          }
                        </p>
                        
                        {isCase && item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 3).map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{item.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
