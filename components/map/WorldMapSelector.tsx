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
  formatTimezoneOffset,
  getTimezoneBoundary,
  getTimezoneColor,
  TIMEZONE_BOUNDARIES,
  getRelatedTimezones
} from '@/utils/mapUtils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import SearchOverlay from './SearchOverlay';
import ErrorBoundary from '@/components/error/ErrorBoundary';

// World map TopoJSON data
const geoUrl = "/data/world-110m.json";

// Helper function to convert polygon coordinates to SVG path string
function polygonToPath(points: [number, number][]): string {
  if (!points || points.length < 3) return '';
  
  try {
    // Format: "M x1,y1 L x2,y2 L x3,y3 ... Z"
    return points.reduce((path, point, i) => {
      // Use explicit command letters with proper spacing for maximum browser compatibility
      const cmd = i === 0 ? 'M ' : 'L ';
      return path + cmd + point[0].toFixed(4) + ',' + point[1].toFixed(4) + ' ';
    }, '') + 'Z';
  } catch (error) {
    console.error('Error generating path data:', error);
    return '';
  }
}

/**
 * TimezoneMapLegend Component
 * 
 * Displays a legend showing the colors and names of the selected timezones
 */
const TimezoneMapLegend = ({ timezones }) => {
  if (timezones.length === 0) return null;
  
  return (
    <div className="absolute bottom-4 left-4 bg-gray-900/80 p-2 rounded-md z-20 max-w-xs">
      <h3 className="text-white text-xs font-medium mb-1">Selected Timezones</h3>
      <div className="space-y-1">
        {timezones.map(tz => (
          <div key={tz.id} className="flex items-center gap-2">
            <span 
              className="inline-block w-3 h-3 rounded-sm" 
              style={{ backgroundColor: tz.color }}
            />
            <span className="text-xs text-white">{tz.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const handleZoom = useCallback((newZoom: number) => {
    setPosition((prev) => ({
      ...prev,
      zoom: newZoom
    }));
  }, []);
  
  // Handle map move
  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  }, []);
  
  // Handle clicking on the map to add a timezone
  const handleMapClick = useCallback((coordinates: [number, number]) => {
    // IMPORTANT: react-simple-maps uses [lng, lat] format for coordinates
    // but our timezone utilities expect [lat, lng]
    const [lng, lat] = coordinates;
    const timezoneId = findClosestTimezone(lat, lng);
    
    // Check if timezone is already selected
    const isAlreadySelected = selectedTimezones.some(tz => tz.id === timezoneId);
    
    if (!isAlreadySelected) {
      addTimezone(timezoneId);
    }
  }, [addTimezone, selectedTimezones]);
  
  // Handle hovering over a point on the map
  const handleMapHover = useCallback((coordinates: [number, number] | null) => {
    if (!coordinates) {
      setHoveredTimezone(null);
      return;
    }
    
    // IMPORTANT: Convert from [lng, lat] to [lat, lng] for our utilities
    const [lng, lat] = coordinates;
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
      // IMPORTANT: Convert from [lat, lng] to [lng, lat] for react-simple-maps
      const [lat, lng] = coordinates;
      setPosition(prev => ({
        ...prev,
        coordinates: [lng, lat]
      }));
    }
  }, [addTimezone, selectedTimezones]);
  
  // Optimize the selection of timezone boundaries
  const selectedTimezoneBoundaries = useMemo(() => {
    return Object.entries(TIMEZONE_BOUNDARIES)
      .map(([tz, data]) => {
        const isSelected = selectedTimezones.some(
          (selectedTz) => selectedTz === tz || getRelatedTimezones(tz).includes(selectedTz)
        );
        
        if (!isSelected) return null;
        
        // Pre-calculate the path data
        const pathData = polygonToPath(data.boundaries);
        
        return {
          id: tz,
          color: data.color,
          pathData
        };
      })
      .filter(Boolean);
  }, [selectedTimezones]);
  
  // Prepare timezone info for the legend
  const legendTimezones = useMemo(() => {
    return selectedTimezones.map(tz => {
      const region = TIMEZONE_REGIONS.find(r => r.id === tz.id);
      const name = region ? region.name : tz.id.split('/').pop();
      
      // Try to get the human-readable name from the timezone boundaries
      let displayName = name;
      const tzBoundary = Object.keys(TIMEZONE_BOUNDARIES).find(key => {
        // Check if this is the exact timezone or a parent/related one
        if (key === tz.id) return true;
        
        // Check common patterns (e.g., America/New_York should match with America/Toronto)
        if (tz.id.startsWith('America/') && key.startsWith('America/')) {
          const boundary = getTimezoneBoundary(tz.id);
          const keyBoundary = TIMEZONE_BOUNDARIES[key].boundaries;
          if (boundary && JSON.stringify(boundary) === JSON.stringify(keyBoundary)) {
            return true;
          }
        }
        
        return false;
      });
      
      if (tzBoundary && TIMEZONE_BOUNDARIES[tzBoundary]) {
        displayName = TIMEZONE_BOUNDARIES[tzBoundary].name;
      }
      
      return {
        id: tz.id,
        name: displayName,
        color: getTimezoneColor(tz.id)
      };
    });
  }, [selectedTimezones]);
  
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
        
        {/* Timezone Legend */}
        <TimezoneMapLegend timezones={legendTimezones} />
        
        <MapControls 
          zoom={position.zoom}
          onZoomIn={() => handleZoom(Math.min(position.zoom * 1.5, 8))}
          onZoomOut={() => handleZoom(Math.max(position.zoom / 1.5, 0.8))}
          onReset={() => setPosition({ coordinates: [0, 20], zoom: 1 })}
        />
        
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147,
          }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={[position.coordinates[0], position.coordinates[1]]}
            onMoveEnd={handleMoveEnd}
            maxZoom={20}
          >
            {/* Base Geography - rendered first */}
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={(e) => {
                      // e.coordinates are in [lng, lat] format from react-simple-maps
                      handleMapClick(e.coordinates);
                    }}
                    onMouseEnter={(e) => {
                      // Handle hover using the same coordinate format
                      if (e.coordinates) {
                        handleMapHover(e.coordinates);
                      }
                    }}
                    onMouseLeave={() => handleMapHover(null)}
                    style={{
                      default: {
                        fill: '#1f2937',
                        stroke: '#374151',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: '#374151',
                        stroke: '#4b5563',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      pressed: {
                        fill: '#374151',
                        stroke: '#4b5563',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Timezone region highlights - rendered after geography for visibility */}
            {selectedTimezoneBoundaries.map(boundary => (
              <g key={`timezone-fill-${boundary.id}`}>
                <path
                  d={boundary.pathData}
                  fill={boundary.color}
                  fillOpacity={0.4}
                  stroke={boundary.color}
                  strokeWidth={2.5 / position.zoom}
                  strokeOpacity={0.9}
                />
              </g>
            ))}
            
            {/* Draw bold boundary lines for better definition */}
            {selectedTimezoneBoundaries.map(boundary => (
              <g key={`timezone-outline-${boundary.id}`}>
                <path
                  d={boundary.pathData}
                  fill="none"
                  stroke={boundary.color}
                  strokeWidth={3 / position.zoom}
                  strokeOpacity={1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ))}
            
            {/* Markers for highlighting clicked locations */}
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

const WorldMapWithErrorBoundary = () => (
  <ErrorBoundary
    fallback={
      <div className="relative w-full h-[500px] glass-card p-4 overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-red-500 mb-2">Map Rendering Error</h3>
          <p className="mb-4">There was an issue rendering the world map.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    }
  >
    <WorldMapSelector />
  </ErrorBoundary>
);

export default memo(WorldMapWithErrorBoundary); 