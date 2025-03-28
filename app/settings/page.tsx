'use client';

import React, { useState, useEffect } from 'react';
import { useSettingsStore, getWeekendHighlightClass } from '@/store/settingsStore';
import { ArrowLeft, Calendar, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { DateTime } from 'luxon';
import SettingsVerifier from '@/components/dev/SettingsVerifier';

/**
 * Settings Page
 * 
 * Allows users to customize application preferences
 */
export default function SettingsPage() {
  // Get settings from store
  const settings = useSettingsStore();
  
  // State for component mounting (to handle hydration)
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  
  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Available color options
  const colorOptions = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'purple', label: 'Purple' },
    { value: 'amber', label: 'Amber' },
    { value: 'pink', label: 'Pink' },
    { value: 'indigo', label: 'Indigo' }
  ];
  
  // Time format options
  const timeFormatOptions = [
    { value: '12h', label: '12-hour (1:30 PM)' },
    { value: '24h', label: '24-hour (13:30)' }
  ];
  
  // View mode options
  const viewModeOptions = [
    { value: 'analog', label: 'Analog' },
    { value: 'digital', label: 'Digital' },
    { value: 'list', label: 'List' }
  ];
  
  // Generate mock time slots for the demo
  const generateDemoTimeSlots = () => {
    const now = DateTime.now();
    const saturday = now.set({ weekday: 6 }).startOf('day').plus({ hours: 10 });
    const sunday = now.set({ weekday: 7 }).startOf('day').plus({ hours: 14 });
    
    return [
      { time: saturday.toFormat(settings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm'), day: 'Saturday', isWeekend: true },
      { time: saturday.plus({ minutes: 30 }).toFormat(settings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm'), day: 'Saturday', isWeekend: true },
      { time: sunday.toFormat(settings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm'), day: 'Sunday', isWeekend: true },
      { 
        time: now.set({ weekday: 1 }).startOf('day').plus({ hours: 9 })
          .toFormat(settings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm'), 
        day: 'Monday', 
        isWeekend: false,
        isBusinessHours: true
      }
    ];
  };
  
  const demoTimeSlots = generateDemoTimeSlots();
  
  // Handlers for settings changes
  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    settings.setWeekendHighlightColor(e.target.value);
    showFeedback('Weekend highlight color updated');
  };
  
  const handleTimeFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    settings.setTimeFormat(e.target.value as '12h' | '24h');
    showFeedback('Time format updated');
  };
  
  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    settings.setDefaultView(e.target.value as 'analog' | 'digital' | 'list');
    showFeedback('Default view updated');
  };
  
  const handleShowSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    settings.setShowSeconds(e.target.checked);
    showFeedback('Show seconds preference updated');
  };
  
  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      settings.resetSettings();
      showFeedback('Settings reset to defaults');
    }
  };
  
  // Show feedback message and auto-clear after delay
  const showFeedback = (message: string) => {
    setFeedbackMsg(message);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };
  
  // Check if in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  // Only render content after hydration to avoid mismatches
  if (!mounted) {
    return <div className="min-h-screen p-8">Loading settings...</div>;
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          
          <button
            onClick={handleResetSettings}
            className="flex items-center px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Reset all settings to defaults"
          >
            <RefreshCw size={14} className="mr-1.5" />
            Reset
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400">
          Customize your World Clock experience with these settings.
        </p>
        
        {feedbackMsg && (
          <div className="mt-4 p-3 rounded-md bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
            {feedbackMsg}
          </div>
        )}
      </header>
      
      {/* Settings Tab Navigation */}
      <div className="mb-8">
        <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
          {['Appearance', 'Time Settings', 'Notifications', 'About'].map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`w-full rounded-lg py-2.5 text-sm font-medium
                ${activeTab === index
                  ? 'bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 shadow'
                  : 'text-gray-700 dark:text-gray-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Appearance Tab */}
      {activeTab === 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Appearance Settings</h2>
          
          <div className="space-y-8">
            {/* Weekend Highlight Color */}
            <div>
              <label htmlFor="weekendHighlightColor" className="block text-sm font-medium mb-2">
                Weekend Highlight Color
              </label>
              <div className="flex items-center space-x-4">
                <select
                  id="weekendHighlightColor"
                  value={settings.weekendHighlightColor}
                  onChange={handleColorChange}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <div className={`w-8 h-8 rounded ${getWeekendHighlightClass(settings.weekendHighlightColor)}`}></div>
              </div>
              
              {/* Demo section showing how the highlight appears in the list view */}
              <div className="mt-4 border rounded-md overflow-hidden">
                <div className="flex items-center p-2 border-b bg-gray-100 dark:bg-gray-700">
                  <Calendar size={16} className="mr-2" />
                  <span className="text-sm font-medium">Weekend Highlight Preview</span>
                </div>
                
                <div className="bg-white dark:bg-gray-800">
                  {demoTimeSlots.map((slot, index) => (
                    <div 
                      key={index}
                      className={`p-3 border-b ${slot.isWeekend ? getWeekendHighlightClass(settings.weekendHighlightColor) : ''} flex justify-between`}
                    >
                      <span className="text-sm">{slot.time}</span>
                      <span className="text-xs text-gray-500">{slot.day}</span>
                      {slot.isWeekend && <span className="text-xs text-purple-500">🏖️</span>}
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Choose the highlight color for weekends in the list view.
              </p>
            </div>
            
            {/* Default View Mode */}
            <div>
              <label htmlFor="defaultView" className="block text-sm font-medium mb-2">
                Default View Mode
              </label>
              <select
                id="defaultView"
                value={settings.defaultView}
                onChange={handleViewChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {viewModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Choose which view mode to show by default when opening the application.
              </p>
            </div>
          </div>
        </section>
      )}
      
      {/* Time Settings Tab */}
      {activeTab === 1 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Time Display Settings</h2>
          
          <div className="space-y-8">
            {/* Time Format */}
            <div>
              <label htmlFor="timeFormat" className="block text-sm font-medium mb-2">
                Time Format
              </label>
              <select
                id="timeFormat"
                value={settings.timeFormat}
                onChange={handleTimeFormatChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {timeFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Choose how times are displayed throughout the application.
              </p>
            </div>
            
            {/* Date Format */}
            <div>
              <label htmlFor="dateFormat" className="block text-sm font-medium mb-2">
                Date Format
              </label>
              <select
                id="dateFormat"
                value={settings.dateFormat}
                onChange={(e) => {
                  settings.setDateFormat(e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD');
                  showFeedback('Date format updated');
                }}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (03/22/2025)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (22/03/2025)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2025-03-22)</option>
              </select>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Choose how dates are displayed throughout the application.
              </p>
              
              <div className="mt-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500">Preview: {
                  (() => {
                    const now = new Date();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const year = now.getFullYear();
                    
                    switch(settings.dateFormat) {
                      case 'MM/DD/YYYY':
                        return `${month}/${day}/${year}`;
                      case 'DD/MM/YYYY':
                        return `${day}/${month}/${year}`;
                      case 'YYYY-MM-DD':
                        return `${year}-${month}-${day}`;
                      default:
                        return `${month}/${day}/${year}`;
                    }
                  })()
                }</p>
              </div>
            </div>
            
            {/* Show Seconds */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="showSeconds" className="text-sm font-medium">
                  Show Seconds
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Display seconds in digital clocks and time displays.
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  id="showSeconds"
                  type="checkbox"
                  checked={settings.showSeconds}
                  onChange={handleShowSecondsChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* Night Hours */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">
                  Night Hours
                </label>
                <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                  {settings.nightHoursStart}:00 - {settings.nightHoursEnd}:00
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nightHoursStart" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Start Time
                  </label>
                  <select
                    id="nightHoursStart"
                    value={settings.nightHoursStart}
                    onChange={(e) => {
                      const startHour = parseInt(e.target.value, 10);
                      settings.setNightHours(startHour, settings.nightHoursEnd);
                      showFeedback('Night hours updated');
                    }}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {settings.timeFormat === '12h' 
                          ? `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i >= 12 ? ' PM' : ' AM'}`
                          : `${i.toString().padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="nightHoursEnd" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    End Time
                  </label>
                  <select
                    id="nightHoursEnd"
                    value={settings.nightHoursEnd}
                    onChange={(e) => {
                      const endHour = parseInt(e.target.value, 10);
                      settings.setNightHours(settings.nightHoursStart, endHour);
                      showFeedback('Night hours updated');
                    }}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {settings.timeFormat === '12h' 
                          ? `${i === 0 ? 12 : i > 12 ? i - 12 : i}${i >= 12 ? ' PM' : ' AM'}`
                          : `${i.toString().padStart(2, '0')}:00`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Define night hours when you're typically not active.
              </p>
              
              <div className="mt-3 p-3 border border-indigo-200 dark:border-indigo-900/30 rounded-md bg-indigo-50 dark:bg-indigo-900/10">
                <div className="flex items-center text-xs text-indigo-800 dark:text-indigo-300">
                  <span className="w-3 h-3 bg-indigo-400 dark:bg-indigo-700 rounded-full mr-2"></span>
                  Night hours will be dimmed in clock and list views
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Notifications Tab */}
      {activeTab === 2 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
          
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="enableNotifications" className="text-sm font-medium">
                  Enable Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enable system notifications for meeting reminders and timezone changes.
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  id="enableNotifications"
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => {
                    settings.setEnableNotifications(e.target.checked);
                    showFeedback('Notification settings updated');
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="meetingReminders" className="text-sm font-medium">
                  Meeting Reminders
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Send notifications for upcoming meetings and events.
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  id="meetingReminders"
                  type="checkbox"
                  checked={settings.meetingReminders}
                  onChange={(e) => {
                    settings.setMeetingReminders(e.target.checked);
                    showFeedback('Meeting reminder settings updated');
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* About Tab */}
      {activeTab === 3 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            World Clock - A global time management application
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Version 1.0.0
          </p>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-2">Time Settings</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Night Hours: {settings.nightHoursStart}:00 - {settings.nightHoursEnd}:00</li>
              <li>Weekend highlight: {settings.weekendHighlightColor}</li>
              <li>Time format: {settings.timeFormat}</li>
              <li>Date format: {settings.dateFormat}</li>
            </ul>
          </div>
        </section>
      )}
      
      {isDev && (
        <div className="mt-8">
          <SettingsVerifier />
        </div>
      )}
    </div>
  );
}
