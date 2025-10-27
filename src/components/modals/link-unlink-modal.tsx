"use client";

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LinkUnlinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (caseId: string | null) => void;
  currentLinkedCaseId: string | null;
  cases: any[];
  chatTitle: string;
}

export default function LinkUnlinkModal({
  isOpen,
  onClose,
  onConfirm,
  currentLinkedCaseId,
  cases,
  chatTitle
}: LinkUnlinkModalProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(currentLinkedCaseId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = cases.filter(case_ => 
    case_.caseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    onConfirm(selectedCaseId);
    onClose();
  };

  const handleDetach = () => {
    onConfirm(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentLinkedCaseId ? 'Unlink Chat' : 'Link Chat'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Icon name="x" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Chat: <span className="font-medium">{chatTitle}</span>
          </p>
          <p className="text-sm text-gray-600">
            {currentLinkedCaseId 
              ? 'This chat is currently linked to a case. You can unlink it or change the case.'
              : 'Select a case to link this chat to, or keep it as a general chat.'
            }
          </p>
        </div>

        {!currentLinkedCaseId && (
          <>
            <div className="mb-4">
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="mb-4 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                <div
                  onClick={() => setSelectedCaseId(null)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCaseId === null
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon name="message" className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">General Chat</p>
                    <p className="text-xs text-gray-500">Keep as general chat (not linked to any case)</p>
                  </div>
                </div>

                {filteredCases.map((case_) => (
                  <div
                    key={case_.id}
                    onClick={() => setSelectedCaseId(case_.id)}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCaseId === case_.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Icon name="folder" className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {case_.caseName || 'Untitled Case'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Link to this case
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          
          {currentLinkedCaseId && (
            <Button
              variant="outline"
              onClick={handleDetach}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Icon name="link" className="w-4 h-4 mr-2" />
              Unlink from Case
            </Button>
          )}
          
          <Button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={selectedCaseId === currentLinkedCaseId}
          >
            {currentLinkedCaseId ? 'Change Case' : 'Link to Case'}
          </Button>
        </div>
      </div>
    </div>
  );
}

