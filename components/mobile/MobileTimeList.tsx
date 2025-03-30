'use client';

import React, { memo, useCallback, useEffect, useRef } from 'react';
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
    'flex justify-between items-center px-3 py-2 border-b border-gray-700/50 cursor-pointer',
    'hover:bg-gray-700/60 transition-colors duration-150',
    isHighlight ? 'bg-blue-600 text-white font-semibold' : 'text-gray-200',
    isCurrent && !isHighlight ? 'bg-blue-900/50 border-l-2 border-blue-400 font-medium' : '',
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
      <span className={clsx(isHighlight ? 'text-white' : isCurrent ? 'text-blue-300' : 'text-gray-100')}>
        {formatted}
      </span>
      <div className="flex items-center space-x-1">
         {isNight && !isHighlight && <Moon className="h-3 w-3 text-indigo-300" />}
         {!isNight && !isHighlight && <Sun className="h-3 w-3 text-amber-300" />}
         {isCurrent && !isHighlight && <span className="text-xs text-blue-400">(Now)</span>}
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

  // --- Scroll to Current/Selected Time ---
  useEffect(() => {
    if (!listRef.current || timeSlots.length === 0) return;

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
        listRef.current?.scrollToItem(targetIndex, 'center');
      });
    }
  }, [localTime, highlightedTime, timeSlots, roundToNearestIncrement]); // Run when these change

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
