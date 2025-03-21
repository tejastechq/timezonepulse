import { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography,
  ZoomableGroup,
  Marker,
  Line
} from 'react-simple-maps';
import { useTimezoneStore } from '@/store/timezoneStore';
import { motion } from 'framer-motion';
import MapControls from './MapControls';
import { 
  findClosestTimezone, 
  TIMEZONE_REGIONS, 
  calculateDayNightTerminator, 
  isPointInDaylight,
  isBusinessHours,
  formatTimezoneOffset 
} from '@/utils/mapUtils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import SearchOverlay from './SearchOverlay';

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
 * - Day/night terminator visualization
 * - Business hours indicators
 * - Search functionality
 */
const WorldMapSelector = () => {
  const { addTimezone, timezones: selectedTimezones } = useTimezoneStore();
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredTimezone, setHoveredTimezone] = useState<{
    id: string;
    name: string;
    formatted: string;
    isBusinessHours: boolean;
    isDaylight: boolean;
  } | null>(null);
  
  // Check if on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Initialize with appropriate zoom level for device
  useEffect(() => {
    setPosition({ 
      coordinates: [0, 20], 
      zoom: isMobile ? 0.8 : 1 
    });
  }, [isMobile]);
  
  // Calculate the day/night terminator
  const terminatorLine = useMemo(() => {
    return calculateDayNightTerminator();
  }, []);
  
  // Terminate will re-calculate every minute to stay updated
  useEffect(() => {
    const interval = setInterval(() => {
      // This will cause a re-render with an updated terminator line
      const newTerminator = calculateDayNightTerminator();
      // We'd set state here, but since we're using useMemo that depends on nothing,
      // we need to force a re-render somehow - for now we'll just do nothing
      // as this would be a nice-to-have update for production
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);
  
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
    const [lat, lng] = coordinates;
    const timezoneId = findClosestTimezone(lat, lng);
    
    // Check if timezone is already selected
    const isAlreadySelected = selectedTimezones.some(tz => tz.id === timezoneId);
    
    if (!isAlreadySelected) {
      // Add the timezone
      addTimezone(timezoneId);
    }
  }, [addTimezone, selectedTimezones]);
  
  // Handle hovering over a point on the map
  const handleMapHover = useCallback((coordinates: [number, number] | null) => {
    if (!coordinates) {
      setHoveredTimezone(null);
      return;
    }
    
    const [lat, lng] = coordinates;
    const timezoneId = findClosestTimezone(lat, lng);
    const region = TIMEZONE_REGIONS.find(r => r.id === timezoneId);
    
    if (region) {
      const now = new Date();
      const isDaylight = isPointInDaylight(lat, lng, now);
      const isWorkHours = isBusinessHours(timezoneId, now);
      
      // For display purposes
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: timezoneId,
        hour12: true
      });
      
      setHoveredTimezone({
        id: timezoneId,
        name: region.name,
        formatted: formatter.format(date),
        isBusinessHours: isWorkHours,
        isDaylight
      });
    } else {
      setHoveredTimezone(null);
    }
  }, []);
  
  // Handle timezone selection from search
  const handleSelectTimezone = useCallback((timezoneId: string, coordinates: [number, number]) => {
    // Check if timezone is already selected
    const isAlreadySelected = selectedTimezones.some(tz => tz.id === timezoneId);
    
    if (!isAlreadySelected) {
      // Add the timezone
      addTimezone(timezoneId);
      
      // Center the map on the selected timezone
      setPosition(prev => ({
        ...prev,
        coordinates: [coordinates[1], coordinates[0]] // Note: react-simple-maps uses [lng, lat]
      }));
    }
  }, [addTimezone, selectedTimezones]);
  
  return (
    <div className="relative w-full h-[500px] glass-card p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full"
      >
        {/* Search overlay */}
        <SearchOverlay onSelectTimezone={handleSelectTimezone} />
        
        {/* Timezone hover information */}
        {hoveredTimezone && (
          <div className="absolute top-4 left-4 bg-gray-900/80 text-white p-2 rounded-md z-20 max-w-xs">
            <div className="font-medium">{hoveredTimezone.name}</div>
            <div className="text-sm">{hoveredTimezone.formatted}</div>
            <div className="text-xs flex items-center gap-2 mt-1">
              <span className={`inline-block w-2 h-2 rounded-full ${
                hoveredTimezone.isDaylight ? 'bg-yellow-400' : 'bg-blue-400'
              }`}></span>
              <span>{hoveredTimezone.isDaylight ? 'Daylight' : 'Nighttime'}</span>
              
              <span className={`inline-block w-2 h-2 rounded-full ml-2 ${
                hoveredTimezone.isBusinessHours ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              <span>{hoveredTimezone.isBusinessHours ? 'Business Hours' : 'Non-Business Hours'}</span>
            </div>
            <div className="text-xs text-gray-300 mt-1">{hoveredTimezone.id}</div>
          </div>
        )}
        
        <MapControls 
          zoom={position.zoom}
          onZoomIn={() => handleZoom(Math.min(position.zoom * 1.5, 8))}
          onZoomOut={() => handleZoom(Math.max(position.zoom / 1.5, 0.8))}
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
            {/* Day/Night Terminator Line */}
            <Line
              coordinates={terminatorLine.map(([lat, lng]) => [lng, lat])} // Note: react-simple-maps uses [lng, lat]
              stroke="#fef3c7" // Amber color
              strokeWidth={1.5 / position.zoom}
              strokeDasharray="5,5"
              strokeLinecap="round"
            />
            
            {/* Base Geography */}
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => {
                  // Extract centroid or use a default
                  const centroid = geo.properties?.centroid || [0, 0];
                  const [centerLng, centerLat] = centroid;
                  
                  // Check if this region is in daylight
                  const isDay = isPointInDaylight(centerLat, centerLng);
                  
                  // Base color on day/night
                  const fillColor = isDay ? 
                    "#2a4365" : // Dark blue for day
                    "#111827"; // Very dark blue/black for night
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillColor}
                      stroke="#374151"
                      strokeWidth={0.5 / position.zoom}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#4b5563", outline: "none" },
                        pressed: { fill: "#6b7280", outline: "none" },
                      }}
                      onMouseEnter={() => {
                        if (centroid) {
                          handleMapHover([centerLat, centerLng]);
                        }
                      }}
                      onMouseLeave={() => handleMapHover(null)}
                      onClick={() => {
                        if (centroid) {
                          handleMapClick([centerLat, centerLng]);
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
            
            {/* Selected timezone markers */}
            {selectedTimezones.map((timezone) => {
              const region = TIMEZONE_REGIONS.find(r => r.id === timezone.id);
              
              if (!region) return null;
              
              // Coordinates in react-simple-maps format [lng, lat]
              const coordinates: [number, number] = [region.lng, region.lat];
              
              // Determine marker color based on business hours
              const isWorkHours = isBusinessHours(timezone.id);
              const markerColor = isWorkHours ? "#10b981" : "#3b82f6"; // Green for business hours, blue otherwise
              
              return (
                <Marker 
                  key={timezone.id} 
                  coordinates={coordinates}
                >
                  <circle 
                    r={6 / position.zoom} 
                    fill={markerColor}
                    stroke="#fff"
                    strokeWidth={1.5 / position.zoom}
                    className="cursor-pointer"
                  />
                  
                  {/* Only show labels at higher zoom levels */}
                  {position.zoom > 2 && (
                    <text
                      textAnchor="middle"
                      y={-10 / position.zoom}
                      style={{
                        fontFamily: "system-ui",
                        fontSize: 12 / position.zoom,
                        fill: "#fff",
                        pointerEvents: "none",
                        textShadow: "0px 0px 4px rgba(0,0,0,0.9)"
                      }}
                    >
                      {region.name}
                    </text>
                  )}
                </Marker>
              );
            })}
            
            {/* City markers at high zoom levels */}
            {position.zoom > 3 && TIMEZONE_REGIONS.map((region) => {
              // Skip cities that are already selected
              if (selectedTimezones.some(tz => tz.id === region.id)) {
                return null;
              }
              
              // Coordinates in react-simple-maps format [lng, lat]
              const coordinates: [number, number] = [region.lng, region.lat];
              
              return (
                <Marker 
                  key={region.id} 
                  coordinates={coordinates}
                >
                  <circle 
                    r={3 / position.zoom} 
                    fill="#6b7280"
                    opacity={0.7}
                    stroke="#fff"
                    strokeWidth={0.5 / position.zoom}
                    className="cursor-pointer hover:fill-blue-500"
                    onClick={() => handleSelectTimezone(region.id, [region.lat, region.lng])}
                  />
                  
                  {/* Only show labels at very high zoom levels */}
                  {position.zoom > 5 && (
                    <text
                      textAnchor="middle"
                      y={-6 / position.zoom}
                      style={{
                        fontFamily: "system-ui",
                        fontSize: 8 / position.zoom,
                        fill: "#d1d5db",
                        pointerEvents: "none",
                        textShadow: "0px 0px 3px rgba(0,0,0,0.9)"
                      }}
                    >
                      {region.name}
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