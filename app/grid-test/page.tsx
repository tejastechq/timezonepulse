'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore';
import { ViewProvider } from '@/app/contexts/ViewContext';
import { IntegrationsProvider } from '@/app/contexts/IntegrationsContext';
import dynamic from 'next/dynamic'; // Keep dynamic for potential future use if needed
import { DateTime } from 'luxon'; // Keep DateTime if used elsewhere or by original grid items

// Import the wrapper component
import SingleTimezoneCardWrapper from './SingleTimezoneCardWrapper';

// Placeholder for loading state (can be defined here or imported)
const ViewPlaceholder = () => (
  <div className="w-full min-h-[300px] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center justify-center">
      <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      <div className="h-4 w-32 mt-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// Define getInitialColumns function *before* it's used in useState
const getInitialColumns = () => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width <= 540) return 1;
    if (width <= 912) return 2;
    if (width <= 1024) return 3;
    return 4;
  }
  return 4; // Default for server-side rendering
};

export default function GridTestPage() {
  // --- Hooks Section ---
  // Hooks needed for the grid page itself and potentially passing initial data
  const { timezones, hydrate } = useTimezoneStore();
  const [isMounted, setIsMounted] = useState(false);
  // Keep currentTime state here to pass as initial prop to wrapper
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Hooks for the grid layout
  const [activeItem, setActiveItem] = useState<number | null>(null); // Grid item selection state
  const [columns, setColumns] = useState(getInitialColumns);
  const [rows, setRows] = useState(3); // Default, will be recalculated
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  // Hydration and initial time setting
  useEffect(() => {
    hydrate();
    setIsMounted(true);
    setCurrentTime(new Date()); // Set initial time for the wrapper prop
  }, [hydrate]);

   // Update current time every second (needed to pass updated time to wrapper if desired, though wrapper also has its own timer)
   useEffect(() => {
    if (!isMounted) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isMounted]);


  // Grid layout effect
  useEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;
      const viewportWidth = window.innerWidth;
      let maxColumns;
      if (viewportWidth <= 540) maxColumns = 1;
      else if (viewportWidth <= 912) maxColumns = 2;
      else if (viewportWidth <= 1024) maxColumns = 3;
      else maxColumns = 4;
      // Calculate rows based on the *actual* gridItems length (defined below)
      const rowsNeeded = Math.ceil(10 / maxColumns); // Assuming 10 items total
      setColumns(maxColumns);
      setRows(rowsNeeded);
    };
    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => window.removeEventListener('resize', calculateLayout);
  }, []); // Removed columns dependency as it causes infinite loop with setColumns inside

  // --- Non-Hook Logic ---
  // Define gridItems *after* hooks
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
  // Get first timezone *after* hooks
  const firstTimezone = useMemo(() => timezones[0] || { id: 'America/New_York', name: 'New York', city: 'New York', offset: -5, country: 'US' }, [timezones]);

  const ITEM_WIDTH = 285;
  const GAP_WIDTH = 24;

  // --- Render Logic ---
  return (
    <ViewProvider>
      <IntegrationsProvider>
        <div className="w-full min-h-screen flex flex-col items-center justify-start p-8 overflow-x-hidden" ref={containerRef}>
          <h1 className="text-2xl font-bold mb-6 text-center">Grid Test with Timezone Card</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">
            A grid layout where the first item is replaced by a TimezoneCard component.
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
                  maxWidth: columns === 1 ? 'none' : '100%'
                }}
              >
                {displayItems.map((item) => {
                  if (item.id === 1) {
                    // Render the wrapper component for the first item
                    return (
                      <SingleTimezoneCardWrapper
                        key={firstTimezone.id}
                        timezone={firstTimezone}
                        currentTime={currentTime} // Updated prop name
                      />
                    );
                  }

                  // Render original grid items for others
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
          {isMounted && (
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-lg">
              <p className="text-sm">
                <strong>Current display:</strong> {columns} column{columns !== 1 ? 's' : ''} ({displayItems.length} items visible)
                {columns === 1 && <span className="ml-1 text-blue-600 dark:text-blue-400">(scroll horizontally to view)</span>}
              </p>
              <p className="text-sm mt-2">The layout dynamically adjusts column count. Item 1 is replaced by TimezoneCard.</p>
            </div>
          )}
          {/* Global styles needed for animations defined in the wrapper/column */}
          <style jsx global>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .highlight-item-optimized { animation: none !important; position: relative; transform: translateZ(0); opacity: 1 !important; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
            .dark .highlight-item-optimized { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); }
            .highlight-pulse-effect { position: relative; overflow: hidden; }
            .highlight-pulse-effect::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1)); z-index: 3; transform: translateX(-100%); animation: shimmerHighlight 2s infinite; }
            @keyframes shimmerHighlight { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            .highlight-item-optimized::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 2; pointer-events: none; border-radius: inherit; box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4); animation: optimizedHighlightPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes optimizedHighlightPulse { 0% { box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0.4); background-color: rgba(var(--primary-500-rgb), 0.05); } 50% { box-shadow: 0 0 0 8px rgba(var(--primary-500-rgb), 0.2); background-color: rgba(var(--primary-500-rgb), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--primary-500-rgb), 0); background-color: rgba(var(--primary-500-rgb), 0.05); } }
            :root { --primary-500-rgb: 99, 102, 241; }
            .dark { --primary-500-rgb: 129, 140, 248; }
          `}</style>
        </div>
      </IntegrationsProvider>
    </ViewProvider>
  );
}
