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
  selectedTimezones: Timezone[];
  userLocalTimezone: string;
  setSelectedTimezones: (timezones: Timezone[]) => void;
  renderClock: (time: Date, timezone: string, size?: number) => React.ReactNode;
  minHeight?: string;
}

function BaseClockView({
  selectedTimezones,
  userLocalTimezone,
  setSelectedTimezones,
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

  // Memoize the unique timezones calculation
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
      className="w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 auto-rows-auto">
        <AnimatePresence>
          {uniqueTimezones.map((timezone) => (
            <ClockCard
              key={timezone.id}
              timezone={timezone}
              currentTime={currentTime}
              userLocalTimezone={userLocalTimezone}
              renderClock={renderClock}
              onEdit={handleEditTimezone}
              onRemove={handleRemoveTimezone}
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
                      dark:border-gray-700 p-4 h-full min-h-[${minHeight}] flex flex-col items-center justify-center
                      hover:border-primary-500 dark:hover:border-primary-500
                      transition-all duration-200 cursor-pointer`}
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
            <p className="text-gray-600 dark:text-gray-300 font-medium relative z-[2]">Add Timezone or Region</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 relative z-[2]">
              Track time for another region
            </p>
          </motion.button>
        )}
      </div>
      
      {/* Timezone Selection Modal */}
      <AnimatePresence>
        {selectorOpen && (
          <TimezoneSelector
            isOpen={selectorOpen}
            onClose={handleCloseSelector}
            onSelect={editingTimezoneId ? handleReplaceTimezone : handleAddTimezone}
            excludeTimezones={[userLocalTimezone, ...selectedTimezones.map(tz => tz.id)]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Export a memoized version of the component
export default memo(BaseClockView); 