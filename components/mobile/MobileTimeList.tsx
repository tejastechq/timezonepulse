'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { DateTime } from 'luxon';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import clsx from 'clsx';
import { Sun, Moon } from 'lucide-react';
import { isNightHours } from '@/lib/utils/dateTimeFormatter'; // Assuming this utility exists and works

interface MobileTimeListProps {
  timeSlots: Date[];
  timezoneId: string;
  localTime: Date | null;
  highlightedTime: Date | null;
  onTimeSelect: (time: Date) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
}

// Adapted TimeItem from ListView
const TimeItem = memo(function TimeItem({
  style,
  time,
  timezoneId,
  isCurrentTimeFn,
  isHighlightedFn,
  isNightTimeFn,
  formatTimeFn,
  onTimeSelectFn,
}: {
  style: React.CSSProperties;
  time: Date;
  timezoneId: string;
  isCurrentTimeFn: (time: Date) => boolean;
  isHighlightedFn: (time: Date) => boolean;
  isNightTimeFn: (time: Date, timezoneId: string) => boolean;
  formatTimeFn: (time: Date, timezoneId: string) => string;
  onTimeSelectFn: (time: Date) => void;
}) {
  const isHighlight = isHighlightedFn(time);
  const isCurrent = isCurrentTimeFn(time);
  const isNight = isNightTimeFn(time, timezoneId); // Keep for icon logic
  const formatted = formatTimeFn(time, timezoneId);
  
  // Determine daytime based on hour for background styling (e.g., 6 AM to 8 PM)
  const hour = DateTime.fromJSDate(time).setZone(timezoneId).hour;
  const isVisuallyDaytime = hour >= 6 && hour < 20; // 6:00 AM to 7:59 PM

  const cellClasses = clsx(
    'flex justify-between items-center px-4 py-2 border-b border-border/50 cursor-pointer font-sans', // Use border-border
    'transition-colors duration-200 ease-out',
    'hover:bg-accent', // Keep theme-aware hover
    // Restore specific colors for highlight and current time, keep text-foreground for default
    isHighlight ? 'bg-blue-500 dark:bg-blue-600 text-white font-medium' : 'text-foreground font-normal', // Desktop highlight colors
    isCurrent && !isHighlight ? 'bg-blue-900/50 border-l-2 border-blue-400' : '', // Keep current time style
    // Mimic current time highlight style: lighter tint bg + brighter border, using yellow
    isVisuallyDaytime && !isHighlight && !isCurrent ? 'bg-yellow-400/20 dark:bg-yellow-500/20 border-l-2 border-yellow-500 dark:border-yellow-600' : '', 
    !isVisuallyDaytime && !isHighlight && !isCurrent ? 'bg-muted/60' : '' // Night background (using muted)
  );

  return (
    <div
      style={style}
      role="option"
      aria-selected={isHighlight}
      onClick={(e) => {
        e.stopPropagation(); // Prevent click from bubbling to parent card
        onTimeSelectFn(time);
      }}
      className={cellClasses}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation(); // Prevent keydown from bubbling if necessary
          onTimeSelectFn(time);
        }
      }}
    >
      {/* Apply consistent text size and color adjustments */}
      {/* Restore specific colors for text based on state */}
      <span className={clsx('text-sm', isHighlight ? 'text-white' : isCurrent ? 'text-primary-700 dark:text-primary-300' : 'text-foreground')}>
        {formatted}
      </span>
      <div className="flex items-center space-x-1.5">
         {/* Restore specific icon colors */}
         {isNight && !isHighlight && <Moon className="h-3.5 w-3.5 text-indigo-400 dark:text-indigo-300" />}
         {!isNight && !isHighlight && <Sun className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />}
         {/* Restore specific color for (Now) */}
         {isCurrent && !isHighlight && <span className="text-xs font-medium text-blue-500">(Now)</span>}
      </div>
    </div>
  );
});

const MobileTimeList: React.FC<MobileTimeListProps> = ({
  timeSlots,
  timezoneId,
  localTime,
  highlightedTime,
  onTimeSelect,
  roundToNearestIncrement,
}) => {
  const listRef = useRef<FixedSizeList | null>(null);
  const [hasScrolledInitially, setHasScrolledInitially] = useState(false);

  // --- Callbacks for TimeItem ---
  const isCurrentTime = useCallback((time: Date): boolean => {
    if (!localTime) return false;
    const roundedLocal = roundToNearestIncrement(localTime, 30);
    const timeInZone = DateTime.fromJSDate(time).setZone(timezoneId);
    const localInZone = DateTime.fromJSDate(roundedLocal).setZone(timezoneId);
    return timeInZone.hasSame(localInZone, 'minute');
  }, [localTime, roundToNearestIncrement, timezoneId]);

  const isHighlighted = useCallback((time: Date): boolean => {
    return highlightedTime ? time.getTime() === highlightedTime.getTime() : false;
  }, [highlightedTime]);

  const checkNightHours = useCallback((time: Date, tzId: string): boolean => {
    // Reuse existing utility if available and compatible
    try {
        return isNightHours(time, tzId);
    } catch (e) {
        // Fallback basic night check if utility fails or not present
        const hour = DateTime.fromJSDate(time).setZone(tzId).hour;
        return hour < 6 || hour >= 22; // Example: 10 PM to 6 AM
    }
  }, []);

  const formatTime = useCallback((time: Date, tzId: string): string => {
    return DateTime.fromJSDate(time).setZone(tzId).toFormat('h:mm a');
  }, []);

  // --- Scroll to Current/Selected Time (Only Once on Mount/Relevant Prop Change) ---
  useEffect(() => {
    // Only scroll if we haven't done the initial scroll for this mount
    // and the list ref and time slots are ready.
    if (hasScrolledInitially || !listRef.current || timeSlots.length === 0) {
      return;
    }

    let targetIndex = -1;

    // Prioritize scrolling to highlighted (selected) time
    if (highlightedTime) {
      targetIndex = timeSlots.findIndex(t => t.getTime() === highlightedTime.getTime());
    }
    // If no highlighted time, scroll to current time
    else if (localTime) {
      const roundedLocal = roundToNearestIncrement(localTime, 30);
      targetIndex = timeSlots.findIndex(t => t.getTime() === roundedLocal.getTime());
    }

    if (targetIndex !== -1) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        // Check ref again inside animation frame
        if (listRef.current) {
          listRef.current.scrollToItem(targetIndex, 'center');
          // Mark that the initial scroll has been performed for this mount
          setHasScrolledInitially(true);
        }
      });
    } else {
      // If no specific time is found to scroll to initially,
      // still mark as scrolled to prevent future attempts for this mount.
      setHasScrolledInitially(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots, highlightedTime, localTime, roundToNearestIncrement]);
  // Dependencies include the factors determining the *initial* scroll target
  // and the data needed for it. The hasScrolledInitially flag prevents
  // re-scrolling if localTime or highlightedTime change later.

  return (
    <div
      // Use bg-muted and border-border
      className="h-60 bg-muted/50 rounded border border-border overflow-hidden"
      role="listbox"
      aria-label={`Time slots for ${timezoneId}`}
    >
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            ref={listRef}
            height={height}
            width={width}
            itemCount={timeSlots.length}
            itemSize={44} // Increased item size for better touch target
            overscanCount={5}
            itemKey={(index) => `${timezoneId}-${timeSlots[index].getTime()}`}
            className="focus:outline-none"
            // No onScroll handler needed anymore
          >
            {({ index, style }) => (
              <TimeItem
                style={style}
                time={timeSlots[index]}
                timezoneId={timezoneId}
                isCurrentTimeFn={isCurrentTime}
                isHighlightedFn={isHighlighted}
                isNightTimeFn={checkNightHours}
                formatTimeFn={formatTime}
                onTimeSelectFn={onTimeSelect}
              />
            )}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
};

export default MobileTimeList;
