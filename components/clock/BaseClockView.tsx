'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
import { isInDST } from '@/lib/utils/timezone';
import TimezoneSelector from './TimezoneSelector';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Edit2, Plus, Settings, X } from 'lucide-react';

interface BaseClockViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  setSelectedTimezones: (timezones: Timezone[]) => void;
  renderClock: (time: Date, timezone: string, size?: number) => React.ReactNode;
  minHeight?: string;
}

/**
 * BaseClockView component that handles shared functionality between clock views
 * This component extracts common logic from ClocksView and DigitalView
 */
export default function BaseClockView({
  selectedTimezones,
  userLocalTimezone,
  setSelectedTimezones,
  renderClock,
  minHeight = '310px'
}: BaseClockViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  
  // State for timezone selector
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
  
  // Get timezone actions from store
  const { addTimezone, removeTimezone } = useTimezoneStore();

  // Set mounted state and start timer on client
  useEffect(() => {
    setMounted(true);
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle adding a new timezone
  const handleAddTimezone = useCallback((timezone: Timezone) => {
    if (!selectedTimezones.some(tz => tz.id === timezone.id)) {
      setSelectedTimezones([...selectedTimezones, timezone]);
    }
    setSelectorOpen(false);
  }, [selectedTimezones, setSelectedTimezones]);

  // Handle replacing a timezone
  const handleReplaceTimezone = useCallback((timezone: Timezone) => {
    if (editingTimezoneId) {
      setSelectedTimezones(selectedTimezones.map(tz => 
        tz.id === editingTimezoneId ? timezone : tz
      ));
      setEditingTimezoneId(null);
      setSelectorOpen(false);
    }
  }, [editingTimezoneId, selectedTimezones, setSelectedTimezones]);

  // Handle removing a timezone
  const handleRemoveTimezone = useCallback((id: string) => {
    // Don't allow removing the local timezone
    if (id !== userLocalTimezone) {
      setSelectedTimezones(selectedTimezones.filter(tz => tz.id !== id));
    }
  }, [selectedTimezones, setSelectedTimezones, userLocalTimezone]);

  // Render the clocks grid
  const renderClocks = () => {
    if (!mounted) return null;
    
    // Create a Set to track unique timezone IDs
    const uniqueTimezoneIds = new Set();
    const uniqueTimezones = [];
    
    // Add local timezone first if not already present
    if (!uniqueTimezoneIds.has(userLocalTimezone)) {
      uniqueTimezoneIds.add(userLocalTimezone);
      uniqueTimezones.push({ id: userLocalTimezone, name: `Local (${userLocalTimezone})` });
    }
    
    // Add other timezones if not already in the set
    selectedTimezones.forEach(timezone => {
      if (!uniqueTimezoneIds.has(timezone.id)) {
        uniqueTimezoneIds.add(timezone.id);
        uniqueTimezones.push(timezone);
      }
    });
    
    // Determine if we can add more timezones (let's limit to 8 for performance)
    const canAddMore = uniqueTimezones.length < 8;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {uniqueTimezones.map((timezone) => {
          // Convert current time to the timezone
          const zonedTime = DateTime.fromJSDate(currentTime).setZone(timezone.id);
          
          // Check if the timezone is in DST
          const isDST = isInDST(timezone.id);
          
          // Format the date for display
          const dateDisplay = zonedTime.toFormat('EEE, MMM d');
          
          // Determine if it's business hours (9 AM to 5 PM)
          const hour = zonedTime.hour;
          const isBusinessHours = hour >= 9 && hour < 17;
          
          // Determine if it's night time (8 PM to 6 AM)
          const isNightTime = hour >= 20 || hour < 6;
          
          return (
            <motion.div
              key={timezone.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`
                relative p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700
                ${isNightTime ? 'bg-gray-900 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}
                ${isBusinessHours ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'}
                transition-shadow duration-200 hover:shadow-lg
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{timezone.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {isDST && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                      DST
                    </span>
                  )}
                  
                  {/* Timezone options dropdown */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700
                                  focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Timezone options"
                      >
                        <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </DropdownMenu.Trigger>
                    
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1.5 border border-gray-200 dark:border-gray-700"
                        sideOffset={5}
                        align="end"
                      >
                        {timezone.id !== userLocalTimezone && (
                          <DropdownMenu.Item 
                            onSelect={() => {
                              setEditingTimezoneId(timezone.id);
                              setTimeout(() => setSelectorOpen(true), 100);
                            }}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Change Timezone
                          </DropdownMenu.Item>
                        )}
                        
                        {timezone.id !== userLocalTimezone && (
                          <DropdownMenu.Item 
                            onSelect={() => handleRemoveTimezone(timezone.id)}
                            className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenu.Item>
                        )}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>
              
              <p className="text-sm mb-4">{dateDisplay}</p>
              
              <div className="flex justify-center mb-4">
                {renderClock(zonedTime.toJSDate(), timezone.id, 180)}
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {isBusinessHours ? 'Business Hours' : isNightTime ? 'Night Time' : 'Off Hours'}
                </span>
                <span>
                  {zonedTime.toFormat('ZZZZ')}
                </span>
              </div>
            </motion.div>
          );
        })}
        
        {/* Add Timezone Button */}
        {canAddMore && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectorOpen(true)}
            className={`bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 
                      dark:border-gray-700 p-4 h-full min-h-[${minHeight}] flex flex-col items-center justify-center
                      hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 
                      dark:hover:bg-gray-800/80 transition-colors duration-200 cursor-pointer`}
            aria-label="Add Timezone or Region - Track time for another region"
          >
            <div className="rounded-full bg-primary-100 dark:bg-primary-900/30 p-3 mb-3">
              <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Add Timezone or Region</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
              Track time for another region
            </p>
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {renderClocks()}
      
      {/* Timezone Selection Modal */}
      <AnimatePresence>
        {selectorOpen && (
          <TimezoneSelector
            isOpen={selectorOpen}
            onClose={() => {
              setSelectorOpen(false);
              setEditingTimezoneId(null);
            }}
            onSelect={editingTimezoneId ? handleReplaceTimezone : handleAddTimezone}
            excludeTimezones={[userLocalTimezone, ...selectedTimezones.map(tz => tz.id)]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
} 