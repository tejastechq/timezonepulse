'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
import { isInDST } from '@/lib/utils/timezone';
import TimezoneSelector from './TimezoneSelector';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Edit2, Plus, Settings, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import ClockCard from './ClockCard';
import useTimeUpdate from '@/lib/hooks/useTimeUpdate';

// Define props interface
interface BaseClockViewProps {
  selectedTimezones: Timezone[]; // Keep this to know which timezones to display
  userLocalTimezone: string;
  // Removed setSelectedTimezones prop
  renderClock: (time: Date, timezone: string, size?: number) => React.ReactNode;
  minHeight?: string;
}

function BaseClockView({
  selectedTimezones, // Keep this
  userLocalTimezone,
  // Removed setSelectedTimezones parameter
  renderClock,
  minHeight = '310px'
}: BaseClockViewProps) {
  // IMPORTANT: Keep hooks at the top of the component
  // Get theme from next-themes
  const { resolvedTheme } = useTheme();
  
  // Use optimized time update instead of setState + setInterval combo
  const currentTime = useTimeUpdate(1000);
  const [mounted, setMounted] = useState(false);
  
  // State for timezone selector
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editingTimezoneId, setEditingTimezoneId] = useState<string | null>(null);
  
  // Get timezone actions from store
  const { addTimezone, removeTimezone } = useTimezoneStore();

  // Set mounted state on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized callbacks to prevent unnecessary recreations
  const handleEditTimezone = useCallback((id: string) => {
    setEditingTimezoneId(id);
    setTimeout(() => setSelectorOpen(true), 100);
  }, []);
  
  const handleOpenSelector = useCallback(() => {
    setSelectorOpen(true);
  }, []);
  
  const handleCloseSelector = useCallback(() => {
    setSelectorOpen(false);
    setEditingTimezoneId(null);
  }, []);

  // Combined handler for TimezoneSelector selection (Add or Replace)
  const handleSelectTimezone = useCallback((newTimezone: Timezone) => {
    if (editingTimezoneId) {
      // Replace: Remove old, add new
      if (editingTimezoneId !== userLocalTimezone) { // Ensure we don't remove local
        removeTimezone(editingTimezoneId);
      }
      addTimezone(newTimezone);
      setEditingTimezoneId(null);
    } else {
      // Add: Just add the new one
      addTimezone(newTimezone);
    }
    setSelectorOpen(false);
  }, [editingTimezoneId, addTimezone, removeTimezone, userLocalTimezone]);

  // Memoize the unique timezones calculation (using the prop)
  const uniqueTimezones = useMemo(() => {
    const uniqueTimezoneIds = new Set<string>();
    const result: Timezone[] = [];
    
    // Add local timezone first if not already present
    if (!uniqueTimezoneIds.has(userLocalTimezone)) {
      uniqueTimezoneIds.add(userLocalTimezone);
      result.push({ id: userLocalTimezone, name: `Local (${userLocalTimezone})` });
    }
    
    // Add other timezones if not already in the set
    selectedTimezones.forEach(timezone => {
      if (!uniqueTimezoneIds.has(timezone.id)) {
        uniqueTimezoneIds.add(timezone.id);
        result.push(timezone);
      }
    });
    
    return result;
  }, [selectedTimezones, userLocalTimezone]);
  
  // Memoize the canAddMore value
  const canAddMore = useMemo(() => uniqueTimezones.length < 8, [uniqueTimezones]);

  // Exit early if not mounted to prevent hydration issues
  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
       className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8"
     >
       <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8 auto-rows-auto justify-items-center"
            style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 320px))',
              justifyContent: 'center'
            }}>
         <AnimatePresence>
           {uniqueTimezones.map((timezone) => (
            <ClockCard
              key={timezone.id}
              timezone={timezone}
              currentTime={currentTime}
              userLocalTimezone={userLocalTimezone}
              renderClock={renderClock}
              onEdit={handleEditTimezone}
              // Pass removeTimezone from store directly (will add confirmation in ClockCard)
              removeTimezone={removeTimezone} 
            />
          ))}
        </AnimatePresence>
        
        {/* Add Timezone Button */}
        {canAddMore && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            onClick={handleOpenSelector}
            className={`glass-card backdrop-blur-fix ${
              resolvedTheme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
            } rounded-lg border-2 border-dashed border-gray-300 
                      dark:border-gray-700 p-4 md:p-5 lg:p-6 h-full min-h-[${minHeight}] flex flex-col items-center justify-center
                      hover:border-primary-500 dark:hover:border-primary-500
                      transition-all duration-200 cursor-pointer
                      w-full max-w-[320px] min-w-[280px] mx-auto`}
            style={{
              isolation: 'isolate',
              backgroundColor: resolvedTheme === 'dark'
                ? 'rgba(15, 15, 25, 0.2)'
                : 'rgba(255, 255, 255, 0.15)'
            }}
            aria-label="Add Timezone or Region - Track time for another region"
          >
            <div className="rounded-full bg-primary-100/80 dark:bg-primary-900/30 backdrop-blur-sm p-3 mb-3 shadow-md relative z-[2]">
              <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium relative z-[2]">Add Timezone</p>
          </motion.button>
        )}
      </div>
      
      {/* Timezone Selection Modal */}
      <AnimatePresence>
        {selectorOpen && (
          <TimezoneSelector
            isOpen={selectorOpen}
            onClose={handleCloseSelector}
            onSelect={handleSelectTimezone} // Use the combined handler
            // Exclude currently displayed timezones (including local)
            excludeTimezones={uniqueTimezones.map(tz => tz.id)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Export a memoized version of the component
export default memo(BaseClockView);
