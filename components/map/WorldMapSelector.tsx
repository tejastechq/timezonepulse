import { useState, useCallback, memo, useEffect } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup,
  Marker
} from 'react-simple-maps';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore';
import { motion } from 'framer-motion';
import MapControls from './MapControls';
import { getTimezoneFromMapCoordinates, getTimeBasedColor } from '@/utils/mapUtils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// World map TopoJSON data
const geoUrl = "/data/world-110m.json";

/**
 * WorldMapSelector Component
 * 
 * An interactive world map that allows users to visually select timezones.
 * Features include:
 * - Zoomable and pannable map interface
 * - Timezone region highlighting
 * - Visual indication of selected timezones
 * - Integration with the timezone store
 */
const WorldMapSelector = () => {
  const { addTimezone, timezones: selectedTimezones } = useTimezoneStore();
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedMarkers, setSelectedMarkers] = useState<{[key: string]: [number, number]}>({});
  const [hoveredTimezone, setHoveredTimezone] = useState<Timezone | null>(null);
  
  // Check if on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Initialize with appropriate zoom level for device
  useEffect(() => {
    setPosition({ 
      coordinates: [0, 20], 
      zoom: isMobile ? 0.8 : 1 
    });
  }, [isMobile]);
  
  // Populate selected markers from existing timezones
  useEffect(() => {
    // This is a placeholder. In a real implementation, we would store
    // the coordinates for each timezone and display them on the map.
    // Currently, we don't have that data in our model, so this is just a demo.
    const markers: {[key: string]: [number, number]} = {};
    
    // For demo purposes, assign arbitrary coordinates to existing timezones
    selectedTimezones.forEach((tz, index) => {
      // This is just for visualization - in a real app, you'd store actual coordinates
      const lng = (index * 30 - 60) % 180;
      const lat = (index * 10 - 20) % 80;
      markers[tz.id] = [lng, lat];
    });
    
    setSelectedMarkers(markers);
  }, [selectedTimezones]);
  
  // Handle map zoom
  const handleZoom = useCallback((zoom: number) => {
    setPosition(prev => ({ ...prev, zoom }));
  }, []);
  
  // Handle map movement
  const handleMoveEnd = useCallback((position: any) => {
    setPosition(position);
  }, []);
  
  // Handle timezone selection from map
  const handleMapClick = useCallback((coordinates: [number, number]) => {
    const timezone = getTimezoneFromMapCoordinates(coordinates);
    
    if (timezone) {
      console.log(`Selected timezone: ${timezone.name} (${timezone.id})`);
      
      // Check if timezone is already selected
      const isAlreadySelected = selectedTimezones.some(tz => tz.id === timezone.id);
      
      if (!isAlreadySelected) {
        // Add the timezone
        addTimezone(timezone.id);
        
        // Update marker
        setSelectedMarkers(prev => ({
          ...prev,
          [timezone.id]: coordinates
        }));
      }
    }
  }, [addTimezone, selectedTimezones]);
  
  // Handle hovering over a point on the map
  const handleMapHover = useCallback((coordinates: [number, number] | null) => {
    if (coordinates) {
      const timezone = getTimezoneFromMapCoordinates(coordinates);
      setHoveredTimezone(timezone);
    } else {
      setHoveredTimezone(null);
    }
  }, []);
  
  return (
    <div className="relative w-full h-[500px] glass-card p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full"
      >
        {/* Timezone hover information */}
        {hoveredTimezone && (
          <div className="absolute top-4 left-4 bg-gray-900/80 text-white p-2 rounded-md z-20 max-w-xs">
            <div className="font-medium">{hoveredTimezone.name}</div>
            <div className="text-sm">{hoveredTimezone.formatted}</div>
            <div className="text-xs text-gray-300">{hoveredTimezone.id}</div>
          </div>
        )}
        
        <MapControls 
          zoom={position.zoom}
          onZoomIn={() => handleZoom(Math.min(position.zoom * 1.5, 8))}
          onZoomOut={() => handleZoom(Math.max(position.zoom / 1.5, 1))}
          onReset={() => setPosition({ coordinates: [0, 20], zoom: 1 })}
        />
        
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 150 }}
          className="w-full h-full"
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates as [number, number]}
            onMoveEnd={handleMoveEnd}
          >
            {/* Base Geography */}
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1f2937" // Dark background for countries
                    stroke="#374151" // Slightly lighter borders
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#374151", outline: "none" },
                      pressed: { fill: "#4b5563", outline: "none" },
                    }}
                    onMouseEnter={() => {
                      const centroid = geo.properties?.centroid || [0, 0];
                      if (centroid) {
                        handleMapHover(centroid as [number, number]);
                      }
                    }}
                    onMouseLeave={() => handleMapHover(null)}
                    onClick={() => {
                      const centroid = geo.properties?.centroid || [0, 0];
                      if (centroid) {
                        handleMapClick(centroid as [number, number]);
                      }
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Selected timezone markers */}
            {Object.entries(selectedMarkers).map(([id, coordinates]) => {
              // Find the corresponding timezone
              const timezone = selectedTimezones.find(tz => tz.id === id);
              
              // Use the utility to get a color based on the time of day in this timezone
              const markerColor = timezone ? getTimeBasedColor(timezone) : "#3b82f6";
              
              return (
                <Marker 
                  key={id} 
                  coordinates={coordinates}
                >
                  <circle 
                    r={5 / position.zoom} 
                    fill={markerColor}
                    stroke="#fff"
                    strokeWidth={1 / position.zoom}
                    className="cursor-pointer"
                    onClick={() => console.log(`Clicked on ${id}`)}
                  />
                  
                  {/* Only show labels at higher zoom levels */}
                  {position.zoom > 2 && timezone && (
                    <text
                      textAnchor="middle"
                      y={-8 / position.zoom}
                      style={{
                        fontFamily: "system-ui",
                        fontSize: 10 / position.zoom,
                        fill: "#fff",
                        pointerEvents: "none",
                        textShadow: "0px 0px 3px rgba(0,0,0,0.7)"
                      }}
                    >
                      {timezone.name}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </motion.div>
    </div>
  );
};

export default memo(WorldMapSelector); 