'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function GridTestPage() {
  // Create an array of 10 UI element cards
  const gridItems = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    title: `Item ${index + 1}`,
    content: `This is a sample grid item with some content for demonstration purposes.`,
    color: index % 4 === 0 ? 'primary' : 
           index % 4 === 1 ? 'blue' : 
           index % 4 === 2 ? 'green' : 'amber'
  }));

  // Calculate initial columns based on window width if client-side
  const getInitialColumns = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 540) return 1;
      if (width <= 912) return 2; // Covers 820, 852, 912px
      if (width <= 1024) return 3;
      return 4;
    }
    return 4; // Default for server-side rendering
  };

  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [columns, setColumns] = useState(getInitialColumns);
  const [rows, setRows] = useState(3);
  const [columnsReducedForSpace, setColumnsReducedForSpace] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Constants for layout calculations
  const ITEM_WIDTH = 285; // Width of each grid item in pixels
  const ITEM_HEIGHT = 370; // Height of each grid item in pixels
  const GAP_WIDTH = 24; // Gap between columns (6 * 4px from tailwind gap-6)
  const POPUP_HEIGHT = 100; // Estimated height of popup when active

  useEffect(() => {
    // Function to calculate how many columns and rows can fit
    const calculateLayout = () => {
      if (!containerRef.current) return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Set columns based on screen width breakpoints
      let maxColumns;
      if (viewportWidth <= 540) {
        // Mobile/Small
        maxColumns = 1;
      } else if (viewportWidth > 540 && viewportWidth <= 912) {
        // Tablet (covers 820, 852, 912)
        maxColumns = 2;
      } else if (viewportWidth > 912 && viewportWidth <= 1024) {
        // Large tablet
        maxColumns = 3;
      } else {
        // Desktop (> 1024px)
        maxColumns = 4;
      }
      
      // Calculate rows needed to display all items
      const rowsNeeded = Math.ceil(gridItems.length / maxColumns);
      
      // Set the columns and rows
      setColumns(maxColumns);
      setRows(rowsNeeded);
      setColumnsReducedForSpace(false);
    };

    // Calculate on initial render
    calculateLayout();
    
    // Add event listener for window resize
    window.addEventListener('resize', calculateLayout);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener('resize', calculateLayout);
  }, [gridItems.length]);

  const handleItemClick = (id: number) => {
    setActiveItem(activeItem === id ? null : id);
  };

  // Calculate width for progress bar
  const getProgressWidth = (id: number) => {
    const percentage = (id % 5 + 1) * 20; // 20%, 40%, 60%, 80%, 100%
    return `${percentage}%`;
  };

  // Reorganize items based on current column count
  const reorganizeItems = () => {
    // Show all 10 items, regardless of calculated rows
    const visibleItems = gridItems;
    
    const reorganized = [];
    
    // Fill in the grid row by row
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
  const totalVisible = displayItems.length;
  const totalHidden = gridItems.length - totalVisible;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start p-8 overflow-x-hidden" ref={containerRef}>
      <h1 className="text-2xl font-bold mb-6 text-center">Fixed Grid Layout</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-2xl">
        A grid layout with fixed-size elements (285×370px). Layout adjusts to prevent UI elements from being cut off vertically.
      </p>
      
      {/* Grid container with horizontal scrolling for mobile */}
      <div className={`w-full flex justify-center ${columns === 1 ? 'overflow-x-auto pb-4' : ''}`}>
        <div 
          className="grid gap-6"
          style={{ 
            width: `${columns * ITEM_WIDTH + (columns - 1) * GAP_WIDTH}px`,
            gridTemplateColumns: `repeat(${columns}, ${ITEM_WIDTH}px)`,
            gridTemplateRows: `repeat(${rows}, ${ITEM_HEIGHT}px)`,
            maxWidth: columns === 1 ? 'none' : '100%'
          }}
        >
          {displayItems.map((item) => {
            // Determine dynamic classes based on color
            const ringClass = activeItem === item.id ? 
              `ring-2 ring-offset-2 ${item.color === 'primary' ? 'ring-primary-500' : 
               item.color === 'blue' ? 'ring-blue-500' : 
               item.color === 'green' ? 'ring-green-500' : 'ring-amber-500'}` : '';
               
            const bgColorClass = item.color === 'primary' ? 'bg-primary-500' : 
                                 item.color === 'blue' ? 'bg-blue-500' : 
                                 item.color === 'green' ? 'bg-green-500' : 'bg-amber-500';
                                 
            const bgLightColorClass = item.color === 'primary' ? 'bg-primary-200 dark:bg-primary-700' : 
                                     item.color === 'blue' ? 'bg-blue-200 dark:bg-blue-700' : 
                                     item.color === 'green' ? 'bg-green-200 dark:bg-green-700' : 'bg-amber-200 dark:bg-amber-700';
                                     
            const hoverBgClass = item.color === 'primary' ? 'hover:bg-primary-600' : 
                                 item.color === 'blue' ? 'hover:bg-blue-600' : 
                                 item.color === 'green' ? 'hover:bg-green-600' : 'hover:bg-amber-600';
                                
            return (
              <div 
                key={item.id}
                className="relative" // Container for positioning
              >
                <div 
                  onClick={() => handleItemClick(item.id)}
                  className={`w-[285px] h-[370px] bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 
                            dark:border-gray-700 transition-all duration-300 hover:shadow-lg cursor-pointer
                            flex flex-col ${ringClass}`}
                >
                  {/* Color indicator at the top */}
                  <div className={`h-2 w-full ${bgColorClass} rounded-t-lg -mt-4 -mx-4 mb-4`}></div>
                  
                  <h2 className="text-lg font-semibold mb-2 truncate">{item.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-2">{item.content}</p>
                  
                  {/* Additional content to fill the larger space */}
                  <div className="flex-grow flex flex-col justify-center items-center my-4">
                    <div className={`w-16 h-16 ${bgColorClass} rounded-full flex items-center justify-center text-white text-xl font-bold mb-4`}>
                      {item.id}
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
                      <div 
                        className={`h-full ${bgColorClass} rounded-full`} 
                        style={{ width: getProgressWidth(item.id) }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      Progress: {parseInt(getProgressWidth(item.id))}%
                    </p>
                  </div>
                  
                  {/* Progress bar and count indicator */}
                  <div className="mt-auto flex justify-between items-center">
                    <div className="h-3 rounded-full w-24 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div 
                        className={`h-full ${bgColorClass}`} 
                        style={{ width: getProgressWidth(item.id) }}
                      ></div>
                    </div>
                    <div className={`h-8 w-8 ${bgColorClass} rounded-full flex items-center justify-center text-white font-bold`}>
                      {item.id}
                    </div>
                  </div>
                </div>
                
                {/* Extra information popup - only show if there's room */}
                {activeItem === item.id && (
                  <div 
                    className={`absolute top-[370px] left-0 w-[285px] bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 
                              dark:border-gray-700 shadow-lg z-10 animate-fade-in`}
                    style={{ 
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    }}
                  >
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Additional information that appears when the item is selected.
                    </p>
                    <button className={`mt-3 px-4 py-2 ${bgColorClass} ${hoverBgClass} text-white rounded-md text-sm`}>
                      Action Button
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-lg">
        <p className="text-sm">
          <strong>Current display:</strong> {columns} column{columns !== 1 ? 's' : ''} × {rows} row{rows !== 1 ? 's' : ''} 
          (All {gridItems.length} items visible)
          {columns === 1 && <span className="ml-1 text-blue-600 dark:text-blue-400">(scroll horizontally to view)</span>}
        </p>
        <p className="text-sm mt-2">
          The layout dynamically adjusts column count while maintaining fixed element sizes (285×370px).
          Elements never stretch or change shape regardless of screen size.
        </p>
      </div>

      {/* Add custom animation keyframes using style tag */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
} 