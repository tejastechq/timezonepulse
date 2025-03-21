import { memo } from 'react';

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
 * MapControls Component
 * 
 * Provides controls for zooming and resetting the map view.
 * The controls are positioned in the top-right corner of the map.
 */
const MapControls = ({ zoom, onZoomIn, onZoomOut, onReset }: MapControlsProps) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
      <button 
        onClick={onZoomIn}
        className="bg-gray-800/70 hover:bg-gray-700/70 text-white p-2 rounded-full w-8 h-8 flex items-center justify-center"
        aria-label="Zoom in"
      >
        +
      </button>
      <button 
        onClick={onZoomOut}
        className="bg-gray-800/70 hover:bg-gray-700/70 text-white p-2 rounded-full w-8 h-8 flex items-center justify-center"
        aria-label="Zoom out"
      >
        -
      </button>
      <button 
        onClick={onReset}
        className="bg-gray-800/70 hover:bg-gray-700/70 text-white p-2 rounded-full w-8 h-8 flex items-center justify-center"
        aria-label="Reset view"
      >
        ↺
      </button>
    </div>
  );
};

export default memo(MapControls); 