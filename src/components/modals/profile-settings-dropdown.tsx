"use client";

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useFirebaseUser } from '@/hooks/use-firebase-user';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface ProfileSettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
}

export default function ProfileSettingsDropdown({ isOpen, onClose, triggerRef }: ProfileSettingsDropdownProps) {
  const { user } = useFirebaseUser();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      onClose();
      // Redirect to login page after logout
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfilePage = () => {
    // Navigate to profile page (placeholder for now)
    console.log('Navigate to profile page');
    onClose();
  };

  const handleSettings = () => {
    // Navigate to settings page (placeholder for now)
    console.log('Navigate to settings page');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute bottom-16 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="user" className="w-4 h-4 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || user?.email || 'User'}
            </div>
            <div className="text-xs text-gray-500">Free Plan</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={handleProfilePage}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Icon name="user" className="w-4 h-4 text-gray-500" />
          <span>Profile Page</span>
        </button>

        <button
          onClick={handleSettings}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Icon name="settings" className="w-4 h-4 text-gray-500" />
          <span>Settings</span>
        </button>

        <div className="border-t border-gray-100 my-1"></div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Icon name="logOut" className="w-4 h-4 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
