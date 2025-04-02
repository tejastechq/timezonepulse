'use client';

import React, { useCallback, useMemo } from 'react';
import { DateTime } from 'luxon';
import { Timezone, useTimezoneStore } from '@/store/timezoneStore';
// Removed DragControls import
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { convertEarthToMarsTime, formatMarsTime, getMarsTimezoneOffset } from '@/lib/utils/mars-timezone';
// Removed GripVertical import
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import MobileTimeList from './MobileTimeList';

interface MobileTimezoneCardProps {
  timezone: Timezone;
  localTime: Date | null;
  highlightedTime: Date | null;
  timeSlots: Date[];
  handleTimeSelection: (time: Date) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
  isExpanded: boolean;
  onToggleExpand: (timezoneId: string) => void;
  // Removed dragControls prop
  isLocal: boolean; // Accept isLocal from parent
}

const MobileTimezoneCard: React.FC<MobileTimezoneCardProps> = ({
  timezone,
  localTime,
  highlightedTime,
  timeSlots,
  handleTimeSelection,
  roundToNearestIncrement,
  isExpanded,
  onToggleExpand,
  // Removed dragControls prop
  isLocal, // Receive isLocal
}) => {
  const { removeTimezone, localTimezone } = useTimezoneStore();

  const handleInternalTimeSelect = useCallback((time: Date) => {
    handleTimeSelection(time);
  }, [handleTimeSelection]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (timezone.id !== localTimezone) {
      const name = timezone.city || timezone.name.split('/').pop()?.replace('_', ' ') || timezone.id;
      if (window.confirm(`Are you sure you want to remove the timezone "${name}"?`)) {
        removeTimezone(timezone.id);
      }
    }
  }, [timezone, localTimezone, removeTimezone]);

  const isMarsTimezone = useMemo(() => timezone.id.startsWith('Mars/'), [timezone.id]);

  const formatTime = useCallback((date: Date | null, format: string = 'h:mm a'): string => {
    if (!date) return '--:--';
    const earthDateTime = DateTime.fromJSDate(date);
    if (isMarsTimezone) {
      const marsDateTime = convertEarthToMarsTime(earthDateTime, timezone.id);
      return formatMarsTime(marsDateTime).split(' ')[0];
    } else {
      return earthDateTime.setZone(timezone.id).toFormat(format);
    }
  }, [timezone.id, isMarsTimezone]);

  const currentTimeFormatted = useMemo(() => formatTime(localTime), [localTime, formatTime]);

  const selectedTimeFormatted = useMemo(() => {
    if (!highlightedTime) return '--:--';
    const highlightedDateTime = DateTime.fromJSDate(highlightedTime);
    if (isMarsTimezone) {
      const marsDateTime = convertEarthToMarsTime(highlightedDateTime, timezone.id);
      return formatMarsTime(marsDateTime).split(' ')[0];
    } else {
      return highlightedDateTime.setZone(timezone.id).toFormat('h:mm a');
    }
  }, [highlightedTime, timezone.id, isMarsTimezone]);

  const timezoneOffset = useMemo(() => {
    if (isMarsTimezone) {
      return getMarsTimezoneOffset(timezone.id);
    } else {
      return DateTime.now().setZone(timezone.id).toFormat('ZZZZ');
    }
  }, [timezone.id, isMarsTimezone]);

  const timezoneAbbreviation = useMemo(() => {
    if (isMarsTimezone) {
      return 'MTC';
    } else {
      return DateTime.now().setZone(timezone.id).toFormat('ZZ');
    }
  }, [timezone.id, isMarsTimezone]);

  const listContainerVariants: Variants = {
    open: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    closed: {
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      layout // Animate layout changes (like expansion)
      className="bg-card/90 dark:bg-card/70 p-5 rounded-lg border border-border/50 shadow-md overflow-hidden backdrop-blur-sm" // Removed relative positioning as handle is gone
      transition={{ duration: 0.3, ease: 'easeInOut' }} // Synchronized layout transition
    >
      {/* Removed Drag Handle */}

      {/* Main Content Area - Removed conditional padding */}
      <div>
        {/* Collapsed View */}
        <div
          className="flex flex-col font-sans cursor-pointer" // Keep cursor pointer for expand toggle
          onClick={() => onToggleExpand(timezone.id)} // Toggle expand on click
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-medium text-foreground">{timezone.city || timezone.name.split('/').pop()?.replace('_', ' ')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {timezoneAbbreviation} {timezoneOffset}
              </p>
            </div>
            {/* Action Buttons (Remove, Expand/Collapse) */}
            <div className="flex items-center space-x-2">
              {/* Remove Button */}
              {timezone.id !== localTimezone && !isLocal && (
                <motion.button
                  onClick={handleRemove} // Use existing remove handler
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-full text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive z-10" // Ensure button is clickable over handle area if overlapping
                  aria-label={`Remove timezone ${timezone.name}`}
                  title="Remove Timezone"
                >
                  <X size={22} />
                </motion.button>
              )}
              {/* Expand/Collapse Chevron */}
              <motion.div
                 onClick={(e) => {
                   e.stopPropagation(); // Prevent card's main onClick from firing
                   onToggleExpand(timezone.id);
                 }}
                 whileTap={{ scale: 0.9 }}
                 className="p-2 text-muted-foreground z-10" // Ensure button is clickable
              >
                {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </motion.div>
            </div>
          </div>

          <div className="flex justify-between items-baseline mt-4">
            <p className="text-3xl font-normal tabular-nums tracking-tight text-foreground">
              {currentTimeFormatted}
            </p>
            <p className="text-2xl font-normal text-primary tabular-nums tracking-tight">
              {selectedTimeFormatted}
            </p>
          </div>
        </div> {/* End Collapsed View Clickable Area */}

        {/* Expanded View - Time List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="time-list"
              variants={listContainerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="overflow-hidden mt-5" // Spacing for the list
              // Stop propagation on the list container itself to prevent clicks inside from toggling collapse
              onClick={(e) => e.stopPropagation()}
            >
              <MobileTimeList
                timeSlots={timeSlots}
                timezoneId={timezone.id}
                localTime={localTime}
                highlightedTime={highlightedTime}
                onTimeSelect={handleInternalTimeSelect}
                roundToNearestIncrement={roundToNearestIncrement}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div> {/* End Main Content Area */}
    </motion.div> // End Main Card motion.div
  );
};

export default MobileTimezoneCard; // Ensure default export is present
