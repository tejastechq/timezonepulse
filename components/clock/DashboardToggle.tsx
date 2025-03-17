'use client';

import React from 'react';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { useView } from '@/app/contexts/ViewContext';

/**
 * DashboardToggle component for toggling the dashboard visibility
 */
export default function DashboardToggle() {
  const { currentView } = useView();
  const { isDashboardVisible, toggleDashboard } = useDashboard();
  
  // Check if dashboard is visible for the current view
  const isVisible = isDashboardVisible(currentView);

  return (
    <div className="flex justify-center mb-6">
      <button
        onClick={() => toggleDashboard(currentView)}
        className={`
          flex items-center px-4 py-2 rounded-md transition-colors
          ${isVisible ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}
        `}
        aria-pressed={isVisible}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 mr-2 transition-transform ${isVisible ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        {isVisible ? 'Hide Dashboard' : 'Show Dashboard'}
      </button>
    </div>
  );
} 