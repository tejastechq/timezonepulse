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
  const isNight = isNightTimeFn(time, timezoneId);
  const formatted = formatTimeFn(time, timezoneId);

  const cellClasses = clsx(
    'flex justify-between items-center px-4 py-2 border-b border-gray-700/50 cursor-pointer font-sans', // Added font-sans, increased padding
    'hover:bg-gray-700/60 transition-colors duration-150',
    // Use slightly lighter font weights for normal/current states
    isHighlight ? 'bg-blue-600 text-white font-medium' : 'text-gray-100 font-normal', // Highlighted is medium, default is normal
    isCurrent && !isHighlight ? 'bg-blue-900/50 border-l-2 border-blue-400' : '', // Removed font-medium here, rely on default
    isNight && !isHighlight && !isCurrent ? 'bg-gray-800/40' : '',
    !isNight && !isHighlight && !isCurrent ? 'bg-gray-800/20' : ''
  );

  return (
    <div
      style={style}
      role="option"
      aria-selected={isHighlight}
      onClick={() => onTimeSelectFn(time)}
      className={cellClasses}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTimeSelectFn(time); }}
    >
      {/* Apply consistent text size and color adjustments */}
      <span className={clsx('text-sm', isHighlight ? 'text-white' : isCurrent ? 'text-blue-300' : 'text-gray-100')}>
        {formatted}
      </span>
      <div className="flex items-center space-x-1.5"> {/* Slightly increased spacing */}
         {isNight && !isHighlight && <Moon className="h-3.5 w-3.5 text-indigo-300" />} {/* Slightly larger icons */}
         {!isNight && !isHighlight && <Sun className="h-3.5 w-3.5 text-amber-300" />} {/* Slightly larger icons */}
         {isCurrent && !isHighlight && <span className="text-xs font-medium text-blue-400">(Now)</span>} {/* Added font-medium to (Now) */}
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
    <div className="h-60 bg-gray-900/50 rounded border border-gray-700 overflow-hidden">
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            ref={listRef}
            height={height}
            width={width}
            itemCount={timeSlots.length}
            itemSize={40} // Slightly smaller item size for mobile
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
