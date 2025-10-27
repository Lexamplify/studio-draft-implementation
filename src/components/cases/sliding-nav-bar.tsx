"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/icon';

interface SlidingNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'overview', title: 'Dashboard', icon: 'barChart' },
  { id: 'docs', title: 'Case Docs', icon: 'folderOpen' },
  { id: 'drafts', title: 'Drafts', icon: 'fileLines' },
  { id: 'chats', title: 'Chats', icon: 'comments' },
  { id: 'events', title: 'Events', icon: 'calendar' },
  { id: 'about', title: 'Edit Details', icon: 'edit' },
];

export default function SlidingNavBar({ activeTab, setActiveTab }: SlidingNavBarProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({});

  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.id === activeTab);
    const activeButton = buttonRefs.current[activeIndex];
    if (activeButton) {
      setSliderStyle({
        width: `${activeButton.offsetWidth}px`,
        transform: `translateX(${activeButton.offsetLeft}px)`
      });
    }
  }, [activeTab]);

  return (
    <div className="relative flex p-1 bg-gray-200/70 rounded-full w-full max-w-4xl mx-auto">
      {navItems.map((item, index) => (
        <button
          key={item.id}
          ref={el => { buttonRefs.current[index] = el; }}
          onClick={() => setActiveTab(item.id)}
          data-tab={item.id}
          className="relative z-10 flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Icon 
            name={item.icon} 
            className={`w-4 h-4 transition-colors ${
              activeTab === item.id ? 'text-white' : 'text-gray-500'
            }`} 
          />
          <span className={`transition-colors ${
            activeTab === item.id ? 'text-white' : 'text-gray-700'
          }`}>
            {item.title}
          </span>
        </button>
      ))}
      <span
        className="absolute top-1 bottom-1 left-0 bg-blue-600 shadow rounded-full transition-all duration-300 ease-in-out"
        style={sliderStyle}
      ></span>
    </div>
  );
}