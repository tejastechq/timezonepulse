'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore'; // Import useTimezoneStore
import { motion, AnimatePresence, Variants } from 'framer-motion'; // Import Variants
import { ChevronDown, ChevronUp, X } from 'lucide-react'; // Icons for expand/collapse, Added X icon
import MobileTimeList from './MobileTimeList'; // Integrated

interface MobileTimezoneCardProps {
  timezone: Timezone;
  localTime: Date | null;
  highlightedTime: Date | null;
  timeSlots: Date[];
  handleTimeSelection: (time: Date) => void; // Reverted to match parent prop
  roundToNearestIncrement: (date: Date, increment: number) => Date;
  isExpanded: boolean; // Added prop from parent
  onToggleExpand: (timezoneId: string) => void; // Added prop from parent
  // Note: We don't need removeTimezone prop here, we'll get it from the store
}

const MobileTimezoneCard: React.FC<MobileTimezoneCardProps> = ({
  timezone,
  localTime,
  highlightedTime,
  timeSlots,
  handleTimeSelection, // Reverted to match parent prop
  roundToNearestIncrement,
  isExpanded, // Use prop from parent
  onToggleExpand, // Use prop from parent
}) => {
  // Removed internal state: const [isExpanded, setIsExpanded] = useState(false);
  // Removed internal handler: const toggleExpand = useCallback(...);

  // Get removeTimezone and localTimezone from the store
  const { removeTimezone, localTimezone } = useTimezoneStore();

  // Internal handler name, calls the 'handleTimeSelection' prop
  const handleInternalTimeSelect = useCallback((time: Date) => {
    handleTimeSelection(time); // Call the prop passed from parent
    // Collapse is now handled by parent via handleTimeSelection
  }, [handleTimeSelection]); // Dependency updated to the prop

  // Handler for removing the timezone
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click/toggle
    if (timezone.id !== localTimezone) {
      const name = timezone.city || timezone.name.split('/').pop()?.replace('_', ' ') || timezone.id;
      if (window.confirm(`Are you sure you want to remove the timezone "${name}"?`)) {
        removeTimezone(timezone.id);
      }
    }
  }, [timezone, localTimezone, removeTimezone]);

  // --- Time Formatting Logic (adapted from ListView/page) ---

  const formatTime = useCallback((date: Date | null, format: string = 'h:mm a'): string => {
    if (!date) return '--:--';
    return DateTime.fromJSDate(date).setZone(timezone.id).toFormat(format);
  }, [timezone.id]);

  const currentTimeFormatted = useMemo(() => formatTime(localTime), [localTime, formatTime]);

  const selectedTimeFormatted = useMemo(() => {
    if (!highlightedTime) return '--:--';
    // Calculate the equivalent selected time in this card's timezone
    const highlightedDateTime = DateTime.fromJSDate(highlightedTime); // Already in system time (effectively UTC internally for Luxon)
    return highlightedDateTime.setZone(timezone.id).toFormat('h:mm a');
  }, [highlightedTime, timezone.id]);


  const timezoneOffset = useMemo(() => {
    return DateTime.now().setZone(timezone.id).toFormat('ZZZZ'); // e.g., GMT+1
  }, [timezone.id]);

  const timezoneAbbreviation = useMemo(() => {
     return DateTime.now().setZone(timezone.id).toFormat('ZZ'); // e.g., CDT
  }, [timezone.id]);


  // --- Render Logic ---

// Animation variants for the card tap - Removed backgroundColor to rely on Tailwind classes
const cardTapVariants: Variants = {
  tap: { scale: 0.98, transition: { duration: 0.1 } },
  initial: { scale: 1 }
};

// Animation variants for the time list container (Opacity only)
const listContainerVariants: Variants = {
  open: {
    opacity: 1,
    // Removed height: 'auto' - let layout handle size
    // Removed marginTop: '16px' - handle spacing with padding or margins outside animation if needed, or adjust layout origin
    transition: { duration: 0.3, ease: "easeInOut" } // Keep synchronized duration/easing for opacity fade
  },
  closed: {
    opacity: 0,
    // Removed height: 0 - let layout handle size
    // Removed marginTop: 0
    transition: { duration: 0.3, ease: "easeInOut" } // Keep synchronized duration/easing for opacity fade
  }
};


  return (
    <motion.div
      layout // Animate layout changes (like expansion)
      // Use theme-aware classes: bg-card, border-border. Added opacity for slight transparency.
      className="bg-card/90 dark:bg-card/70 p-5 rounded-lg border border-border/50 shadow-md cursor-pointer overflow-hidden backdrop-blur-sm"
      onClick={() => onToggleExpand(timezone.id)} // Use parent handler
      whileTap={!isExpanded ? "tap" : ""} // Apply tap animation only when clicking to expand
      variants={cardTapVariants} // Background color removed from variants
      initial="initial"
      animate="initial" // Reset background on release (handled by initial state)
      transition={{ duration: 0.3, ease: 'easeInOut' }} // Synchronized layout transition
    >
      {/* Collapsed View */}
      <div className="flex flex-col font-sans"> {/* Apply font-sans to the container */}
        <div className="flex justify-between items-center">
          <div>
            {/* Use text-foreground for main heading */}
            <h2 className="text-xl font-medium text-foreground">{timezone.city || timezone.name.split('/').pop()?.replace('_', ' ')}</h2>
            {/* Use text-muted-foreground for secondary text */}
            <p className="text-sm text-muted-foreground mt-1">
              {timezoneAbbreviation} {timezoneOffset}
            </p>
          </div>
          {/* Action Buttons (Remove, Expand/Collapse) */}
          <div className="flex items-center space-x-2">
            {/* Remove Button - Increased padding for larger touch target */}
            {timezone.id !== localTimezone && (
              <motion.button
                onClick={handleRemove}
                whileTap={{ scale: 0.9 }}
                // Increased padding and size for better tap target
                className="p-2.5 rounded-full text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive"
                aria-label={`Remove timezone ${timezone.name}`}
                title="Remove Timezone"
              >
                <X size={22} />
              </motion.button>
            )}
            {/* Expand/Collapse Chevron - Use text-muted-foreground */}
            <motion.div
               onClick={(e) => {
                 e.stopPropagation(); // Prevent card's main onClick from firing
                 onToggleExpand(timezone.id); // Use parent handler
               }}
               whileTap={{ scale: 0.9 }}
               className="p-2 text-muted-foreground" // Increased padding
            >
              {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
            </motion.div>
          </div>
        </div>

        <div className="flex justify-between items-baseline mt-4"> {/* Increased spacing */}
          {/* Current Time - Made larger for hierarchy */}
          <p className="text-3xl font-normal tabular-nums tracking-tight text-foreground">
            {currentTimeFormatted}
          </p>
          {/* Selected Time - Kept at original size to differentiate hierarchy */}
          <p className="text-2xl font-normal text-primary tabular-nums tracking-tight">
            {selectedTimeFormatted}
          </p>
        </div>
      </div>

      {/* Expanded View - Time List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="time-list"
            variants={listContainerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden mt-5" // Increased margin for better spacing
          >
            {/* Integrated MobileTimeList */}
            <MobileTimeList
              timeSlots={timeSlots}
              timezoneId={timezone.id}
              localTime={localTime}
              highlightedTime={highlightedTime}
              onTimeSelect={handleInternalTimeSelect} // Pass the internal handler
              roundToNearestIncrement={roundToNearestIncrement}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileTimezoneCard; // Added the missing export statement
