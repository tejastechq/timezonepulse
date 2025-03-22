'use client';

import React from 'react';
import { useView, ViewType } from '@/app/contexts/ViewContext';
import Link from 'next/link';
import { Settings } from 'lucide-react';

/**
 * ViewSwitcher component for switching between different views
 */
export default function ViewSwitcher() {
  const { currentView, setCurrentView } = useView();

  // Handle view change
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
        <button
          onClick={() => handleViewChange('list')}
          className={`px-4 py-2 rounded-md transition-colors ${
            currentView === 'list'
              ? 'bg-primary-700 text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-pressed={currentView === 'list'}
        >
          <span className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            List
          </span>
        </button>

        <button
          onClick={() => handleViewChange('clocks')}
          className={`px-4 py-2 rounded-md transition-colors ${
            currentView === 'clocks'
              ? 'bg-primary-700 text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-pressed={currentView === 'clocks'}
        >
          <span className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Clocks
          </span>
        </button>

        <button
          onClick={() => handleViewChange('digital')}
          className={`px-4 py-2 rounded-md transition-colors ${
            currentView === 'digital'
              ? 'bg-primary-700 text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-pressed={currentView === 'digital'}
        >
          <span className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                clipRule="evenodd"
              />
            </svg>
            Digital
          </span>
        </button>
      </div>
      
      {/* Settings button */}
      <Link 
        href="/settings" 
        className="p-2 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm transition-colors"
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={20} />
      </Link>
    </div>
  );
} 