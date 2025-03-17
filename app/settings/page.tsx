'use client';

import { useState, useEffect } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';

export default function Settings() {
  const { viewMode, setViewMode } = useTimezoneStore();
  const [mounted, setMounted] = useState(false);
  
  // Ensure we're running on the client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // If not mounted yet, show a loading state
  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p>Loading settings...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs.Root defaultValue="display" className="mb-8">
        <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <Tabs.Trigger 
            value="display" 
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
          >
            Display
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="preferences" 
            className="px-4 py-2 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-500"
          >
            Preferences
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="display" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Default View Mode</h2>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="viewMode" 
                  value="analog" 
                  checked={viewMode === 'analog'} 
                  onChange={() => setViewMode('analog')}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <span>Analog</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="viewMode" 
                  value="digital" 
                  checked={viewMode === 'digital'} 
                  onChange={() => setViewMode('digital')}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <span>Digital</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="viewMode" 
                  value="list" 
                  checked={viewMode === 'list'} 
                  onChange={() => setViewMode('list')}
                  className="text-primary-500 focus:ring-primary-500"
                />
                <span>List</span>
              </label>
            </div>
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="preferences" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Theme Preferences</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You can toggle between light and dark mode using the theme toggle button in the header.
            </p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Reset Settings</h2>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all settings? This will remove all your timezones and preferences.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              Reset All Settings
            </button>
          </div>
        </Tabs.Content>
      </Tabs.Root>
      
      <div className="mt-8">
        <Link 
          href="/" 
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 