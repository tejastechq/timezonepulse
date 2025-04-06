'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTimezoneStore } from '@/store/timezoneStore';
import { DateTime } from 'luxon';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';
import dynamic from 'next/dynamic';

// Dynamically import MobileV2ListView
const MobileV2ListView = dynamic(() => import('@/components/views/MobileV2ListView'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

// Placeholder for loading state
const ViewPlaceholder = () => (
  <div className="w-full min-h-[300px] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center justify-center">
      <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      <div className="h-4 w-32 mt-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

const getInitialColumns = () => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width <= 540) return 1;
    if (width <= 912) return 2;
    if (width <= 1024) return 3;
    return 4;
  }
  return 4;
};

export default function GridTestPage() {
  const {
    timezones,
    addTimezone,
    removeTimezone,
    highlightedTime,
    setHighlightedTime,
    localTimezone,
    selectedDate,
    setSelectedDate,
    resetToToday,
    hydrate,
  } = useTimezoneStore();

  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [columns, setColumns] = useState(getInitialColumns);
  const [rows, setRows] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
    setIsMounted(true);
    setCurrentTime(new Date());
    setCurrentDate(new Date());

    // Remove all non-local timezones from the store on mount
    setTimeout(() => {
      const currentTzs = [...timezones];
      currentTzs.forEach((tz) => {
        if (tz.id !== localTimezone) {
          removeTimezone(tz.id);
        }
      });
    }, 0);
  }, [hydrate, timezones, localTimezone, removeTimezone]);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      const storedDate = currentDate ? new Date(currentDate) : null;
      if (storedDate && storedDate.getDate() !== now.getDate()) {
        setCurrentDate(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMounted, currentDate]);

  useEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;
      const viewportWidth = window.innerWidth;
      let maxColumns;
      if (viewportWidth <= 540) maxColumns = 1;
      else if (viewportWidth <= 912) maxColumns = 2;
      else if (viewportWidth <= 1024) maxColumns = 3;
      else maxColumns = 4;
      const rowsNeeded = Math.ceil(10 / maxColumns);
      setColumns(maxColumns);
      setRows(rowsNeeded);
    };
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, []);

  const gridItems = useMemo(() => Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    title: `Item ${index + 1}`,
    content: `This is a sample grid item with some content for demonstration purposes.`,
    color: index % 4 === 0 ? 'primary' :
           index % 4 === 1 ? 'blue' :
           index % 4 === 2 ? 'green' : 'amber'
  })), []);

  const handleItemClick = (id: number) => {
    setActiveItem(activeItem === id ? null : id);
  };

  const getProgressWidth = (id: number) => {
    const percentage = (id % 5 + 1) * 20;
    return `${percentage}%`;
  };

  const reorganizeItems = () => {
    const visibleItems = gridItems;
    const reorganized = [];
    for (let row = 0; row < Math.ceil(gridItems.length / columns); row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < visibleItems.length) {
          reorganized.push(visibleItems[index]);
        }
      }
    }
    return reorganized;
  };

  const displayItems = reorganizeItems();

  const timeSlots = useMemo(() => {
    if (!currentTime) return [];
    const slots = [];
    const dateToUse = selectedDate || currentTime;
    const date = DateTime.fromJSDate(dateToUse);
    const startOfDay = date.startOf('day');

    for (let i = 0; i < 48; i++) {
      slots.push(startOfDay.plus({ minutes: i * 30 }).toJSDate());
    }

    return slots;
  }, [currentTime, selectedDate]);

  const handleTimeSelection = useCallback(
    (time: Date | null) => {
      setHighlightedTime(time);
    },
    [setHighlightedTime]
  );

  const roundToNearestIncrement = useCallback((date: Date, increment: number) => {
    const dt = DateTime.fromJSDate(date);
    const minutes = dt.minute;
    const roundedMinutes = Math.floor(minutes / increment) * increment;
    return dt.set({ minute: roundedMinutes, second: 0, millisecond: 0 }).toJSDate();
  }, []);

  const ITEM_WIDTH = 285;
  const GAP_WIDTH = 24;

  return (
    <IntegrationsProvider>
      <div className="w-full min-h-screen flex flex-col items-center justify-start p-8 overflow-x-hidden" ref={containerRef}>
        <h1 className="text-2xl font-bold mb-6 text-center">Grid Test with Timezone System</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">
          A grid layout where the first item is replaced by the full timezone system.
        </p>
        <div className={`w-full flex justify-center ${columns === 1 ? 'overflow-x-auto pb-4' : ''}`}>
          {!isMounted ? (
            <div className="flex-grow flex items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div
              className="grid gap-6"
              style={{
                width: `${columns * ITEM_WIDTH + (columns - 1) * GAP_WIDTH}px`,
                gridTemplateColumns: `repeat(${columns}, ${ITEM_WIDTH}px)`,
                gridAutoRows: 'minmax(min-content, max-content)',
                maxWidth: columns === 1 ? 'none' : '100%',
              }}
            >
              {displayItems.map((item) => {
                if (item.id === 1) {
                  return (
                    <div key="timezone-system" className="col-span-1 row-span-1 relative">
                      <div className="single-timezone-wrapper">
<MobileV2ListView
  selectedTimezones={timezones.filter(tz => tz.id === localTimezone)}
  userLocalTimezone={localTimezone}
  timeSlots={timeSlots}
  localTime={currentTime}
  highlightedTime={highlightedTime}
  handleTimeSelection={handleTimeSelection}
  roundToNearestIncrement={roundToNearestIncrement}
  removeTimezone={removeTimezone}
  currentDate={currentDate}
  showBackground={false}
/>
                        <style jsx global>{`
                          .single-timezone-wrapper button[aria-label="Add Timezone"], 
                          .single-timezone-wrapper button:has(svg.lucide-plus),
                          .single-timezone-wrapper button:has(.lucide-plus),
                          .single-timezone-wrapper button:has(path[d*="M12 5v14m7-7H5"]) {
                            display: none !important;
                          }
                          .single-timezone-wrapper .glass-card {
                            display: none !important;
                          }
                          .single-timezone-wrapper .grid > div.border-l,
                          .single-timezone-wrapper .grid > div.border-t {
                            display: none !important;
                          }
                          .single-timezone-wrapper .grid.grid-cols-12.h-full {
                            display: none !important;
                          }
                          .single-timezone-wrapper .grid.grid-cols-12.h-full,
                          .single-timezone-wrapper .grid.grid-cols-12.h-full * {
                            display: none !important;
                            opacity: 0 !important;
                            pointer-events: none !important;
                          }
                          .single-timezone-wrapper .absolute.w-full.h-full.opacity-5 {
                            display: none !important;
                          }

                          /* Fix timezone card overflow in grid */
                          .single-timezone-wrapper > div {
                            max-width: 100% !important;
                            width: 100% !important;
                            margin: 0 auto !important;
                          }

                          /* Fix internal timezone card container widths */
                          .single-timezone-wrapper .w-full.max-w-screen-xl {
                            max-width: 100% !important;
                            width: 100% !important;
                            margin: 0 auto !important;
                          }

                          .single-timezone-wrapper .mb-4.w-full.sm\:w-80.ml-0.pt-3 {
                            max-width: 100% !important;
                            width: 100% !important;
                            display: none !important;
                          }

                          /* Hide 'Add Timezone or Region' button */
                          .single-timezone-wrapper button[aria-label*="Add Timezone or Region"] {
                            display: none !important;
                          }
                        `}</style>
                      </div>
                    </div>
                  );
                }

                const ringClass = activeItem === item.id ? `ring-2 ring-offset-2 ${item.color === 'primary' ? 'ring-primary-500' : item.color === 'blue' ? 'ring-blue-500' : item.color === 'green' ? 'ring-green-500' : 'ring-amber-500'}` : '';
                const bgColorClass = item.color === 'primary' ? 'bg-primary-500' : item.color === 'blue' ? 'bg-blue-500' : item.color === 'green' ? 'bg-green-500' : 'bg-amber-500';
                const hoverBgClass = item.color === 'primary' ? 'hover:bg-primary-600' : item.color === 'blue' ? 'hover:bg-blue-600' : item.color === 'green' ? 'hover:bg-green-600' : 'hover:bg-amber-600';

                return (
                  <div key={item.id} className="relative">
                    <div
                      onClick={() => handleItemClick(item.id)}
                      className={`w-[285px] h-[370px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col ${ringClass}`}
                    >
                      <div className={`h-2 w-full ${bgColorClass} rounded-t-lg -mt-4 -mx-4 mb-4`}></div>
                      <h2 className="text-lg font-semibold mb-2 truncate">{item.title}</h2>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">{item.content}</p>
                      <div className="flex-grow flex flex-col justify-center items-center my-4">
                        <div className={`w-16 h-16 ${bgColorClass} rounded-full flex items-center justify-center text-white text-xl font-bold mb-4`}>{item.id}</div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                          <div className={`h-full ${bgColorClass} rounded-full`} style={{ width: getProgressWidth(item.id) }}></div>
                        </div>
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Progress: {parseInt(getProgressWidth(item.id))}%</p>
                      </div>
                      <div className="mt-auto flex justify-between items-center">
                        <div className="h-3 rounded-full w-24 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div className={`h-full ${bgColorClass}`} style={{ width: getProgressWidth(item.id) }}></div>
                        </div>
                        <div className={`h-8 w-8 ${bgColorClass} rounded-full flex items-center justify-center text-white font-bold`}>{item.id}</div>
                      </div>
                    </div>
                    {activeItem === item.id && (
                      <div
                        className={`absolute top-[370px] left-0 w-[285px] bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-10 animate-fade-in`}
                        style={{ animation: 'fadeInUp 0.3s ease-out forwards' }}
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400">Additional information that appears when the item is selected.</p>
                        <button className={`mt-3 px-4 py-2 ${bgColorClass} ${hoverBgClass} text-white rounded-md text-sm`}>Action Button</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </IntegrationsProvider>
  );
}
