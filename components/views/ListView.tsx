'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ChevronUp, ChevronDown, Sun, Moon, Clock, Plus, X, Edit2, Settings } from 'lucide-react';
import { getAllTimezones, isInDST } from '@/lib/utils/timezone';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import TimezoneSelector from '../clock/TimezoneSelector'; // Import the shared TimezoneSelector

interface ListViewProps {
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  timeSlots: Date[];
  localTime: Date | null;
  highlightedTime: Date | null;
  handleTimeSelection: (time: Date) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
}

/**
 * ListView component for displaying timezones in a list format
 * Optimized with virtualization for better performance with large datasets
 */
export default function ListView({
  selectedTimezones,
  userLocalTimezone,
  timeSlots,
  localTime,
  highlightedTime,
  handleTimeSelection,
  roundToNearestIncrement
}: ListViewProps) {
  const timeColumnsContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const listRefs = useRef<Record<string, FixedSizeList | null>>({});
  
  // State for timezone selector
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
  
  // Get timezone actions from store
  const { addTimezone, removeTimezone } = useTimezoneStore();

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format time for display
  const formatTime = useCallback((date: Date, timezone: string) => {
    return DateTime.fromJSDate(date).setZone(timezone).toFormat('h:mm a');
  }, []);

  // Check if a time is the current local time
  const isLocalTime = useCallback((time: Date, timezone: string) => {
    if (!localTime) return false;
    
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const localTimeInTimezone = DateTime.fromJSDate(roundedLocalTime).setZone(timezone);
    
    return timeInTimezone.hasSame(localTimeInTimezone, 'minute');
  }, [localTime, roundToNearestIncrement]);

  // Check if a time is highlighted
  const isHighlighted = useCallback((time: Date) => {
    if (!highlightedTime) return false;
    
    return time.getTime() === highlightedTime.getTime();
  }, [highlightedTime]);

  // Check if a time is within business hours (9 AM to 5 PM)
  const isBusinessHours = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const hour = timeInTimezone.hour;
    // Also check if it's a weekday (1-5, Monday to Friday)
    const isWeekday = timeInTimezone.weekday >= 1 && timeInTimezone.weekday <= 5;
    return isWeekday && hour >= 9 && hour < 17;
  }, []);

  // Check if a time is during night time (8 PM to 6 AM)
  const isNightTime = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const hour = timeInTimezone.hour;
    return hour >= 20 || hour < 6;
  }, []);

  // Check if a time slot is at midnight (0:00)
  const isDateBoundary = useCallback((time: Date, timezone: string) => {
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    return timeInTimezone.hour === 0 && timeInTimezone.minute === 0;
  }, []);

  // Check if a time slot is near a DST transition
  const isDSTTransition = useCallback((time: Date, timezone: string) => {
    // Check if this time slot is within 24 hours of a DST transition
    const timeInTimezone = DateTime.fromJSDate(time).setZone(timezone);
    const oneDayLater = timeInTimezone.plus({ days: 1 });
    return timeInTimezone.offset !== oneDayLater.offset;
  }, []);
  
  // Check if this is the current time (to the minute)
  const isCurrentTime = useCallback((time: Date, timezone: string) => {
    if (!localTime) return false;
    
    const now = DateTime.fromJSDate(localTime);
    const timeToCheck = DateTime.fromJSDate(time).setZone(timezone);
    
    return now.hasSame(timeToCheck, 'minute');
  }, [localTime]);
  
  // Get weekday name for a time
  const getWeekdayName = useCallback((time: Date, timezone: string) => {
    return DateTime.fromJSDate(time).setZone(timezone).toFormat('cccc');
  }, []);
  
  // Check if a day is a weekend
  const isWeekend = useCallback((time: Date, timezone: string) => {
    const weekday = DateTime.fromJSDate(time).setZone(timezone).weekday;
    return weekday === 6 || weekday === 7; // Saturday or Sunday
  }, []);

  // Get time zone offset for display
  const getTimezoneOffset = useCallback((timezone: string) => {
    return DateTime.now().setZone(timezone).toFormat('ZZ');
  }, []);

  // Mock function to check if there's a meeting at a specific time
  // In a real application, this would connect to a meeting/event API
  const hasMeetingAt = useCallback((time: Date, timezone: string): boolean => {
    // This is just a placeholder that returns true for a demo time slot
    const timeToCheck = DateTime.fromJSDate(time).setZone(timezone);
    return timeToCheck.hour === 14 && timeToCheck.minute === 0;
  }, []);

  // Mock function to get meeting title
  const getMeetingTitle = useCallback((time: Date, timezone: string): string => {
    return "Team Standup";
  }, []);

  // Find index of current time in timeslots array
  const getCurrentTimeIndex = useCallback(() => {
    if (!localTime || !timeSlots.length) return 0;
    
    const roundedLocalTime = roundToNearestIncrement(localTime, 30);
    const index = timeSlots.findIndex(t => 
      DateTime.fromJSDate(t).hasSame(DateTime.fromJSDate(roundedLocalTime), 'minute')
    );
    
    return index > -1 ? index : 0;
  }, [localTime, timeSlots, roundToNearestIncrement]);

  // Jump to a specific time period
  const jumpToTime = useCallback((timePeriod: 'morning' | 'afternoon' | 'evening' | 'night' | 'now', timezone: string) => {
    if (!listRefs.current[timezone]) return;
    
    let targetIndex = 0;
    
    switch (timePeriod) {
      case 'morning':
        // Jump to 8am
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 8 && dt.minute === 0;
        });
        break;
      case 'afternoon':
        // Jump to 12pm
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 12 && dt.minute === 0;
        });
        break;
      case 'evening':
        // Jump to 6pm
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 18 && dt.minute === 0;
        });
        break;
      case 'night':
        // Jump to 9pm
        targetIndex = timeSlots.findIndex(t => {
          const dt = DateTime.fromJSDate(t).setZone(timezone);
          return dt.hour === 21 && dt.minute === 0;
        });
        break;
      case 'now':
        // Jump to current time
        targetIndex = getCurrentTimeIndex();
        break;
    }
    
    // Default to 0 if not found
    if (targetIndex === -1) targetIndex = 0;
    
    // Scroll to the target index
    listRefs.current[timezone]?.scrollToItem(targetIndex, 'center');
  }, [timeSlots, getCurrentTimeIndex]);
  
  // Handle adding a new timezone
  const handleAddTimezone = useCallback((timezone: Timezone) => {
    addTimezone(timezone);
    setSelectorOpen(false);
  }, [addTimezone]);
  
  // Handle replacing a timezone
  const handleReplaceTimezone = useCallback((timezone: Timezone) => {
    if (editingTimezoneId) {
      removeTimezone(editingTimezoneId);
      addTimezone(timezone);
      setEditingTimezoneId(null);
      setSelectorOpen(false);
    }
  }, [addTimezone, removeTimezone, editingTimezoneId]);
  
  // Handle removing a timezone
  const handleRemoveTimezone = useCallback((id: string) => {
    // Don't allow removing the local timezone
    if (id !== userLocalTimezone) {
      removeTimezone(id);
    }
  }, [removeTimezone, userLocalTimezone]);

  // Render time columns with virtualization
  const renderTimeColumns = useCallback(() => {
    if (!mounted) return null;
    
    // Create a Set to track unique timezone IDs
    const uniqueTimezoneIds = new Set();
    const uniqueTimezones = [];
    
    // Add local timezone first if not already present
    if (!uniqueTimezoneIds.has(userLocalTimezone)) {
      uniqueTimezoneIds.add(userLocalTimezone);
      uniqueTimezones.push({ id: userLocalTimezone, name: `Local (${userLocalTimezone})` });
    }
    
    // Add up to 7 other timezones (not counting local timezone)
    // This allows for a total of 8 timezones including the local one
    let nonLocalCount = 0;
    for (const timezone of selectedTimezones) {
      if (!uniqueTimezoneIds.has(timezone.id) && nonLocalCount < 7) {
        uniqueTimezoneIds.add(timezone.id);
        uniqueTimezones.push(timezone);
        nonLocalCount++;
      }
    }
    
    // Determine if we can add more timezones (max is 8 total)
    const canAddMore = uniqueTimezones.length < 8;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {uniqueTimezones.map((timezone) => {
          // Check if the timezone is in DST
          const isDST = isInDST(timezone.id);
          
          return (
            <motion.div 
              key={timezone.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700
                        transition-shadow duration-200 hover:shadow-lg"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                    <span>{DateTime.now().setZone(timezone.id).toFormat('ZZZZ')}</span>
                    <span>({getTimezoneOffset(timezone.id)})</span>
                    {isDST && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                        DST
                      </span>
                    )}
                  </div>
                  {/* Show current time in the timezone */}
                  <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
                    {localTime && DateTime.fromJSDate(localTime).setZone(timezone.id).toFormat('h:mm a')}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
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
                  
                  {/* Quick navigation buttons */}
                  <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                    <button 
                      onClick={() => jumpToTime('morning', timezone.id)} 
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Jump to morning (8 AM)"
                      aria-label="Jump to morning"
                    >
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                    </button>
                    <button 
                      onClick={() => jumpToTime('afternoon', timezone.id)} 
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Jump to afternoon (12 PM)"
                      aria-label="Jump to afternoon"
                    >
                      <ChevronUp className="h-3.5 w-3.5 text-blue-500" />
                    </button>
                    <button 
                      onClick={() => jumpToTime('evening', timezone.id)} 
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Jump to evening (6 PM)"
                      aria-label="Jump to evening"
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-orange-500" />
                    </button>
                    <button 
                      onClick={() => jumpToTime('night', timezone.id)} 
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Jump to night (9 PM)"
                      aria-label="Jump to night"
                    >
                      <Moon className="h-3.5 w-3.5 text-indigo-500" />
                    </button>
                    <button 
                      onClick={() => jumpToTime('now', timezone.id)} 
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      title="Jump to current time"
                      aria-label="Jump to current time"
                    >
                      <Clock className="h-3.5 w-3.5 text-green-500" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="h-64 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50" role="listbox">
                <AutoSizer>
                  {({ height, width }) => (
                    <FixedSizeList
                      height={height}
                      width={width}
                      itemCount={timeSlots.length}
                      itemSize={48}
                      overscanCount={10}
                      initialScrollOffset={getCurrentTimeIndex() * 48}
                      ref={(ref) => { listRefs.current[timezone.id] = ref; }}
                      className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
                    >
                      {({ index, style }) => {
                        const time = timeSlots[index];
                        const isLocal = isLocalTime(time, timezone.id);
                        const isHighlight = isHighlighted(time);
                        const isBusiness = isBusinessHours(time, timezone.id);
                        const isNight = isNightTime(time, timezone.id);
                        const isMidnight = isDateBoundary(time, timezone.id);
                        const isDST = isDSTTransition(time, timezone.id);
                        const isCurrent = isCurrentTime(time, timezone.id);
                        const isWeekday = isBusiness || isCurrent;
                        const isWeekend = !isWeekday;
                        const isMeeting = hasMeetingAt(time, timezone.id);
                        const meetingTitle = getMeetingTitle(time, timezone.id);
                        
                        return (
                          <div
                            style={style}
                            role="option"
                            aria-selected={isHighlight}
                            data-key={time.getTime()}
                            data-local-time={isLocal ? 'true' : 'false'}
                            onClick={() => handleTimeSelection(time)}
                            className={`
                              py-2 px-3 cursor-pointer transition-colors relative
                              ${isHighlight ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                              ${isLocal ? 'border-l-4 border-primary-500 pl-2' : ''}
                              ${isBusiness ? 'font-medium' : ''}
                              ${isNight ? 'text-gray-500 dark:text-gray-400' : ''}
                              ${isMidnight ? 'border-t border-dashed border-gray-300 dark:border-gray-600 pt-3' : ''}
                              ${isDST ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                              ${isCurrent ? 'bg-primary-100 dark:bg-primary-900/30' : ''}
                              ${isWeekend ? 'text-gray-500 dark:text-gray-400' : ''}
                              ${isMeeting ? 'bg-red-50 dark:bg-red-900/20' : ''}
                              focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 rounded-sm
                            `}
                            tabIndex={0}
                          >
                            {/* If it's midnight, show the date */}
                            {isMidnight && (
                              <div className="absolute top-0 left-0 w-full text-xs text-gray-500 dark:text-gray-400 pt-0.5 px-3 font-medium">
                                {DateTime.fromJSDate(time).setZone(timezone.id).toFormat('EEE, MMM d')}
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <span className={`${isHighlight ? 'text-white' : ''} ${isCurrent ? 'text-primary-700 dark:text-primary-300 font-medium' : ''}`}>
                                {formatTime(time, timezone.id)}
                              </span>
                              <div className="flex space-x-1">
                                {isLocal && !isHighlight && (
                                  <span className="absolute left-0 top-0 h-full w-1 bg-primary-500 rounded-l-md" />
                                )}
                                
                                {isBusiness && !isHighlight && (
                                  <span className="text-xs text-green-500" title="Business hours">●</span>
                                )}
                                
                                {isNight && !isHighlight && (
                                  <span className="text-xs text-gray-400" title="Night time">○</span>
                                )}
                                
                                {isDST && !isHighlight && (
                                  <span className="text-xs text-amber-500 ml-1" title="DST transition soon">⚠️</span>
                                )}

                                {isCurrent && !isHighlight && (
                                  <span className="text-xs text-blue-500 ml-1" title="Current time">⏰</span>
                                )}

                                {isWeekend && !isHighlight && (
                                  <span className="text-xs text-purple-500 ml-1" title="Weekend">🏖️</span>
                                )}
                              </div>
                            </div>

                            {/* Show meeting indicator for meetings */}
                            {isMeeting && !isHighlight && (
                              <div className="mt-1 text-xs bg-red-100 dark:bg-red-900/30 rounded p-1 text-red-700 dark:text-red-300">
                                🗓️ {meetingTitle}
                              </div>
                            )}

                            {/* Show DST information with more details */}
                            {isDST && !isHighlight && (
                              <div className="mt-1 text-xs bg-amber-100 dark:bg-amber-900/30 rounded p-1 text-amber-700 dark:text-amber-300">
                                DST change soon: {getTimezoneOffset(timezone.id)}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    </FixedSizeList>
                  )}
                </AutoSizer>
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
            className="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 
                      dark:border-gray-700 p-4 h-full min-h-[264px] flex flex-col items-center justify-center
                      hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 
                      dark:hover:bg-gray-800/80 transition-colors duration-200 cursor-pointer"
            aria-label="Add timezone"
          >
            <div className="rounded-full bg-primary-100 dark:bg-primary-900/30 p-3 mb-3">
              <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Add Timezone</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
              Track time for another region
            </p>
          </motion.button>
        )}
      </div>
    );
  }, [
    mounted,
    userLocalTimezone,
    selectedTimezones,
    timeSlots,
    isLocalTime,
    isHighlighted,
    isBusinessHours,
    isNightTime,
    isDateBoundary,
    isDSTTransition,
    isCurrentTime,
    isWeekend,
    hasMeetingAt,
    getMeetingTitle,
    getTimezoneOffset,
    formatTime,
    handleTimeSelection,
    getCurrentTimeIndex,
    jumpToTime,
    handleRemoveTimezone
  ]);

  return (
    <motion.div
      ref={timeColumnsContainerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {renderTimeColumns()}
      
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