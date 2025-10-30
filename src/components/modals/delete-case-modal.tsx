"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';

type LinkedChat = {
  id: string;
  title?: string;
  [key: string]: any;
};

interface DeleteCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteChats: boolean) => Promise<void>;
  caseId: string;
  caseName: string;
  linkedChats?: LinkedChat[]; // Pass chats from parent to avoid API call
}

export default function DeleteCaseModal({
  isOpen,
  onClose,
  onConfirm,
  caseId,
  caseName,
  linkedChats: propLinkedChats = []
}: DeleteCaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteChats, setDeleteChats] = useState(false);
  
  // Use chats passed from parent (already loaded), no need for API call
  const linkedChats = propLinkedChats || [];
  
  // Reset deleteChats choice when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDeleteChats(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(deleteChats);
      // Don't close immediately - let parent handle it after successful deletion
      // onClose will be called by parent after successful deletion
    } catch (error) {
      console.error('Error deleting case:', error);
      setLoading(false); // Re-enable button on error
      // Show error to user
      alert('Failed to delete case. Please try again.');
    }
    // Note: Don't set loading to false on success - modal will close
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-red-100">
            <Icon name="x" className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Delete Case</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete "<span className="font-semibold">{caseName}</span>"? This action cannot be undone.
        </p>

        {linkedChats.length > 0 ? (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <Icon name="info" className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  This case has {linkedChats.length} linked chat{linkedChats.length > 1 ? 's' : ''}:
                </p>
                <ul className="text-xs text-yellow-800 list-disc list-inside mb-3">
                  {linkedChats.slice(0, 3).map((chat) => (
                    <li key={chat.id}>{chat.title || 'Untitled Chat'}</li>
                  ))}
                  {linkedChats.length > 3 && (
                    <li>and {linkedChats.length - 3} more...</li>
                  )}
                </ul>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="chatAction"
                      value="delete"
                      checked={deleteChats}
                      onChange={() => setDeleteChats(true)}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-yellow-900">
                        Delete all linked chats
                      </span>
                      <p className="text-xs text-yellow-700">
                        This will permanently delete all {linkedChats.length} chat{linkedChats.length > 1 ? 's' : ''} linked to this case.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="chatAction"
                      value="unlink"
                      checked={!deleteChats}
                      onChange={() => setDeleteChats(false)}
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm font-medium text-yellow-900">
                        Unlink chats (keep chats)
                      </span>
                      <p className="text-xs text-yellow-700">
                        The chats will remain but will no longer be linked to any case.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Case'}
          </button>
        </div>
      </div>
    </div>
  );
}

