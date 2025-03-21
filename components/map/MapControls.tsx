import React, { memo, useCallback } from 'react';

// Import icons for the controls
// We'll use simple Unicode characters for now, but in a real implementation
// you would typically use an icon library like react-icons

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

/**
 * MapControls component providing zoom and reset controls for the interactive map
 */
const MapControls: React.FC<MapControlsProps> = ({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onReset 
}) => {
  // Memoized handlers to prevent unnecessary re-renders
  const handleZoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onZoomIn();
  }, [onZoomIn]);
  
  const handleZoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onZoomOut();
  }, [onZoomOut]);
  
  const handleReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onReset();
  }, [onReset]);
  
  // Format zoom level for display
  const zoomPercentage = Math.round(zoom * 100);
  
  return (
    <div 
      className="absolute top-4 right-4 z-10 flex flex-col bg-gray-900/80 rounded-md overflow-hidden"
      onClick={(e) => e.stopPropagation()} // Prevent map clicks when interacting with controls
      aria-label="Map controls"
    >
      <button
        onClick={handleZoomIn}
        className="p-2 text-white hover:bg-gray-700 transition-colors"
        aria-label="Zoom in"
        disabled={zoom >= 8}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>
      
      <div className="px-2 py-1 text-white text-xs text-center border-t border-b border-gray-700">
        {zoomPercentage}%
      </div>
      
      <button
        onClick={handleZoomOut}
        className="p-2 text-white hover:bg-gray-700 transition-colors"
        aria-label="Zoom out"
        disabled={zoom <= 0.5}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button
        onClick={handleReset}
        className="p-2 text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
        aria-label="Reset view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default memo(MapControls); 