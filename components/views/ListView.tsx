'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import { motion } from 'framer-motion';
import { Timezone } from '@/store/timezoneStore';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ChevronUp, ChevronDown, Sun, Moon, Clock } from 'lucide-react';

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
    
    // Add other timezones if not already in the set
    selectedTimezones.forEach(timezone => {
      if (!uniqueTimezoneIds.has(timezone.id)) {
        uniqueTimezoneIds.add(timezone.id);
        uniqueTimezones.push(timezone);
      }
    });
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {uniqueTimezones.map((timezone) => (
          <div key={timezone.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-semibold">{timezone.name}</h3>
                <div className="text-xs text-gray-500">
                  {DateTime.now().setZone(timezone.id).toFormat('ZZZZ')} ({getTimezoneOffset(timezone.id)})
                </div>
                {/* Show current time in the timezone */}
                <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {localTime && DateTime.fromJSDate(localTime).setZone(timezone.id).toFormat('h:mm a')}
                </div>
              </div>
              
              {/* Quick navigation buttons */}
              <div className="flex space-x-1">
                <button 
                  onClick={() => jumpToTime('morning', timezone.id)} 
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Jump to morning (8 AM)"
                  aria-label="Jump to morning"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => jumpToTime('afternoon', timezone.id)} 
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Jump to afternoon (12 PM)"
                  aria-label="Jump to afternoon"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => jumpToTime('evening', timezone.id)} 
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Jump to evening (6 PM)"
                  aria-label="Jump to evening"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => jumpToTime('night', timezone.id)} 
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Jump to night (9 PM)"
                  aria-label="Jump to night"
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => jumpToTime('now', timezone.id)} 
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Jump to current time"
                  aria-label="Jump to current time"
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="h-64" role="listbox">
              <AutoSizer>
                {({ height, width }) => (
                  <FixedSizeList
                    height={height}
                    width={width}
                    itemCount={timeSlots.length}
                    itemSize={40}
                    overscanCount={10}
                    initialScrollOffset={getCurrentTimeIndex() * 40}
                    ref={(ref) => { listRefs.current[timezone.id] = ref; }}
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
                            py-2 px-3 rounded-md cursor-pointer transition-colors relative
                            ${isHighlight ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                            ${isLocal ? 'border-l-4 border-primary-500 pl-2' : ''}
                            ${isBusiness ? 'font-medium' : ''}
                            ${isNight ? 'text-gray-500 dark:text-gray-400' : ''}
                            ${isMidnight ? 'border-t-2 border-dashed border-gray-300 pt-3' : ''}
                            ${isDST ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                            ${isCurrent ? 'bg-primary-100 dark:bg-primary-900' : ''}
                            ${isWeekend ? 'text-gray-500 dark:text-gray-400' : ''}
                            ${isMeeting ? 'bg-red-50 dark:bg-red-900/20' : ''}
                          `}
                        >
                          {/* If it's midnight, show the date */}
                          {isMidnight && (
                            <div className="absolute top-0 left-0 w-full text-xs text-gray-500 pt-0.5 px-3">
                              {DateTime.fromJSDate(time).setZone(timezone.id).toFormat('EEE, MMM d')}
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <span>{formatTime(time, timezone.id)}</span>
                            <div className="flex space-x-1">
                              {isLocal && (
                                <span className="absolute left-0 top-0 h-full w-1 bg-red-500 rounded-l-md" />
                              )}
                              
                              {isBusiness && !isHighlight && (
                                <span className="text-xs text-green-500" title="Business hours">●</span>
                              )}
                              
                              {isNight && !isHighlight && (
                                <span className="text-xs text-gray-400" title="Night time">○</span>
                              )}
                              
                              {isDST && !isHighlight && (
                                <span className="text-xs text-yellow-500 ml-1" title="DST transition soon">⚠️</span>
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
                            <div className="mt-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 rounded p-1 text-yellow-700 dark:text-yellow-300">
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
          </div>
        ))}
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
    jumpToTime
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
    </motion.div>
  );
} 