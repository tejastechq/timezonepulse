'use client';

import { ViewMode } from '@/store/timezoneStore';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { motion } from 'framer-motion';

interface ViewModeSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

/**
 * Component for selecting the view mode (analog, digital, or list)
 */
export default function ViewModeSelector({ currentView, onViewChange }: ViewModeSelectorProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={currentView}
      onValueChange={(value) => {
        if (value) onViewChange(value as ViewMode);
      }}
      className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden"
      aria-label="View mode"
    >
      <ViewModeButton value="analog" currentView={currentView}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="10" y1="10" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="ml-1">Analog</span>
      </ViewModeButton>
      
      <ViewModeButton value="digital" currentView={currentView}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <rect x="3" y="6" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <text x="5.5" y="12" fontSize="6" fontFamily="monospace" fill="currentColor">12:34</text>
        </svg>
        <span className="ml-1">Digital</span>
      </ViewModeButton>
      
      <ViewModeButton value="list" currentView={currentView}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <span className="ml-1">List</span>
      </ViewModeButton>
    </ToggleGroup.Root>
  );
}

/**
 * Individual button in the view mode selector
 */
function ViewModeButton({ 
  value, 
  currentView, 
  children 
}: { 
  value: string; 
  currentView: string; 
  children: React.ReactNode 
}) {
  const isActive = value === currentView;
  
  return (
    <ToggleGroup.Item
      value={value}
      className={`
        relative px-3 py-2 flex items-center text-sm font-medium
        ${isActive 
          ? 'text-white' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
        transition-colors
      `}
      aria-label={`${value} view`}
    >
      {isActive && (
        <motion.div
          layoutId="viewModeBackground"
          className="absolute inset-0 bg-primary-500"
          initial={false}
          transition={{ type: 'spring', duration: 0.3 }}
        />
      )}
      <span className="relative z-10 flex items-center">
        {children}
      </span>
    </ToggleGroup.Item>
  );
} 