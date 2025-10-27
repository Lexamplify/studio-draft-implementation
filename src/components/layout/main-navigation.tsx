"use client";

import { Icon } from '@/components/ui/icon';
import { useAppContext } from '@/context/app-context';

interface MainNavigationProps {
  activeMode: 'cases' | 'drafts' | 'chat';
  onModeChange: (mode: 'cases' | 'drafts' | 'chat') => void;
}

export default function MainNavigation({ activeMode, onModeChange }: MainNavigationProps) {
  const { setActiveView } = useAppContext();

  const handleModeChange = (mode: 'cases' | 'drafts' | 'chat') => {
    onModeChange(mode);
    if (mode === 'chat') {
      setActiveView('chatView');
    } else if (mode === 'drafts') {
      setActiveView('draftListView');
    } else if (mode === 'cases') {
      setActiveView('caseDetailView');
    }
  };

  const navigationItems = [
    { id: 'chat' as const, icon: 'comments', label: 'Chat' },

    { id: 'cases' as const, icon: 'briefcase', label: 'Cases' },
    { id: 'drafts' as const, icon: 'fileLines', label: 'Drafts' },
  ];

  return (
    <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-6">
      {/* Logo */}
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">L</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col space-y-4">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleModeChange(item.id)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
              activeMode === item.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={item.label}
          >
            <Icon name={item.icon} className="w-6 h-6" />
          </button>
        ))}
      </nav>

      {/* Profile */}
      <div className="mt-auto">
        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
          <Icon name="user" className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
