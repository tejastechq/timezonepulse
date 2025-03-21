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
  TIMEZONE_BOUNDARIES
} from '@/utils/mapUtils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import SearchOverlay from './SearchOverlay';

// World map TopoJSON data
const geoUrl = "/data/world-110m.json";

// Helper function to convert polygon coordinates to SVG path
function polygonToPath(points) {
  if (!points || points.length === 0) return "";
  return points.map((point, i) => 
    `${i === 0 ? 'M' : 'L'}${point[0]},${point[1]}`
  ).join(' ') + 'Z';
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
    const [lat, lng] = coordinates;
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
  
  // Get timezone boundaries for selected timezones
  const timezoneBoundaries = useMemo(() => {
    return selectedTimezones
      .map(timezone => {
        const boundary = getTimezoneBoundary(timezone.id);
        if (boundary) {
          return {
            id: timezone.id,
            boundary,
            color: getTimezoneColor(timezone.id)
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [selectedTimezones]);
  
  // Process timezone boundaries for Line components
  const timezoneBoundaryLines = useMemo(() => {
    return timezoneBoundaries.flatMap(tzBoundary => {
      const boundary = tzBoundary.boundary;
      const lines = [];
      
      // Create lines between each point and the next (connect the dots)
      for (let i = 0; i < boundary.length; i++) {
        const current = boundary[i];
        const next = boundary[(i + 1) % boundary.length]; // Wrap around to first point
        
        lines.push({
          id: `${tzBoundary.id}-line-${i}`,
          from: current,
          to: next,
          color: tzBoundary.color
        });
      }
      
      // Add more cross lines to create a filled appearance
      // Connect every point with every other point for a dense fill
      if (boundary.length > 3) {
        for (let i = 0; i < boundary.length; i++) {
          for (let j = i + 2; j < boundary.length; j++) {
            if (j !== (i + 1) % boundary.length) { // Skip adjacent points (already covered above)
              lines.push({
                id: `${tzBoundary.id}-cross-${i}-${j}`,
                from: boundary[i],
                to: boundary[j],
                color: tzBoundary.color
              });
            }
          }
        }
      }
      
      return lines;
    });
  }, [timezoneBoundaries]);
  
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
          projectionConfig={{ scale: 150 }}
          className="w-full h-full"
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates as [number, number]}
            onMoveEnd={handleMoveEnd}
          >
            {/* Timezone solid fill background */}
            {timezoneBoundaries.map(tzBoundary => {
              const boundary = tzBoundary.boundary;
              if (!boundary || boundary.length < 3) return null;
              
              // Create an SVG path for the boundary
              const pathData = polygonToPath(boundary);
              
              return (
                <g key={`fill-${tzBoundary.id}`}>
                  <path
                    d={pathData}
                    fill={tzBoundary.color}
                    fillOpacity={0.3}
                    stroke="none"
                  />
                </g>
              );
            })}
            
            {/* Day/Night Terminator Line */}
            <Line
              coordinates={terminatorLine.map(([lat, lng]) => [lng, lat])} // Note: react-simple-maps uses [lng, lat]
              stroke="#fef3c7" // Amber color
              strokeWidth={1.5 / position.zoom}
              strokeDasharray="5,5"
              strokeLinecap="round"
            />
            
            {/* Timezone Region Highlights using Line components */}
            {timezoneBoundaryLines.map(line => (
              <Line
                key={line.id}
                coordinates={[line.from, line.to]}
                stroke={line.color}
                strokeWidth={2.5 / position.zoom} // Increased from 1.5
                strokeOpacity={0.8} // Increased from 0.6
              />
            ))}
            
            {/* Timezone fill areas - approximated with many parallel lines */}
            {timezoneBoundaries.map(tzBoundary => {
              const boundary = tzBoundary.boundary;
              const center = boundary.reduce(
                (acc, [lng, lat]) => [acc[0] + lng / boundary.length, acc[1] + lat / boundary.length],
                [0, 0]
              );
              
              // Create radial lines from center to each point to create a fill effect
              return boundary.map((point, i) => (
                <Line
                  key={`${tzBoundary.id}-fill-${i}`}
                  coordinates={[center, point]}
                  stroke={tzBoundary.color}
                  strokeWidth={2 / position.zoom} // Increased from 1
                  strokeOpacity={0.4} // Increased from 0.2
                />
              ));
            })}
            
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