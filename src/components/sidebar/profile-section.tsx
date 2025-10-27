"use client";

import { useFirebaseUser } from '@/hooks/use-firebase-user';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function ProfileSection() {
  const { user, loading } = useFirebaseUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      // Redirect to login page after logout
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSettings = () => {
    // TODO: Implement settings
    console.log('Settings clicked');
  };

  if (loading) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            onClick={handleSettings}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleLogout}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
