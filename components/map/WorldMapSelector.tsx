import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
  Line
} from 'react-simple-maps';
import { Feature } from 'geojson';
import { useTimezoneStore, Timezone } from '@/store/timezoneStore';
import {
  TIMEZONE_BOUNDARIES,
  getRelatedTimezones,
  findClosestTimezone,
  getTimezoneColor,
  isPointInDaylight,
  isBusinessHours,
  getTimezoneBoundary,
  TIMEZONE_REGIONS,
  TimezoneData,
  getTimezoneFromMapCoordinates,
  getTimeBasedColor,
  getTimezoneData,
  polygonToPath as mapPolygonToPath,
  getTimezoneFromId,
  isWithinHours,
  isWorkHours,
  isNightTime,
  isDaylightSavingTime
} from '@/lib/utils/mapUtils';
import { useMediaQuery } from '@/lib/hooks';
import SearchOverlay from './SearchOverlay';
import MapControls from './MapControls';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { format } from 'date-fns';
import * as d3 from 'd3';

// Use a simple GeoJSON for the world map instead of relying on an external file
const FALLBACK_GEOJSON = {
  type: "FeatureCollection",
  features: [
    // Simplified world outline - just a rectangle for fallback
    {
      type: "Feature",
      properties: { name: "World" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90]
          ]
        ]
      }
    }
  ]
};

// Define interface for the ZoomableGroup props
interface ZoomableGroupProps {
  center?: [number, number];
  zoom?: number;
  onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
  minZoom?: number;
  maxZoom?: number;
  children?: React.ReactNode;
  [key: string]: any;
}

// Define interface for the SafeZoomableGroup props
interface SafeZoomableGroupProps {
  center?: [number, number];
  zoom?: number;
  onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
  minZoom?: number;
  maxZoom?: number;
  children?: React.ReactNode;
  [key: string]: any;
}

// Create a safe zoom wrapper to prevent the interrupt error
const SafeZoomableGroup = React.forwardRef<any, SafeZoomableGroupProps>((props, ref) => {
  const [hasError, setHasError] = useState(false);

  // Apply default props if none are provided
  const safeProps = {
    ...props,
    zoom: props.zoom || 1,
    center: props.center || [0, 0]
  };

  // If we've already encountered an error, use the simplified version
  if (hasError) {
    return (
      <g transform={`translate(400, 300) scale(${safeProps.zoom || 1})`}>
        {props.children}
      </g>
    );
  }

  try {
    // Create a component without ref to avoid the TypeScript error
    const ZoomableGroupWithoutRef = (props: ZoomableGroupProps) => <ZoomableGroup {...props} />;
    return <ZoomableGroupWithoutRef {...safeProps} />;
  } catch (error) {
    console.error("ZoomableGroup error:", error);
    setHasError(true);
    // Fallback to a simplified version with minimal props
    return (
      <g transform="translate(400, 300) scale(1)">
        {props.children}
      </g>
    );
  }
});

SafeZoomableGroup.displayName = 'SafeZoomableGroup';

// Add proper TypeScript typing to the WorldMap component 
interface WorldMapProps {
  children: React.ReactNode;
  [key: string]: any;
}

function WorldMap({ children, ...props }: WorldMapProps) {
  const [geoData, setGeoData] = useState<any>(FALLBACK_GEOJSON);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Try to fetch the world map data
    fetch("/data/world-110m.json")
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load map data: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setGeoData(data);
        setError(false);
      })
      .catch(err => {
        console.error("Error loading world map:", err);
        setError(true);
        // Keep using the fallback
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Replace the original component with our error-handling version
  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 170 }}
      style={{ width: "100%", height: "100%" }}
      {...props}
    >
      {children}
    </ComposableMap>
  );
}

// Add TimezoneMapBoundary interface near the top with other types
interface TimezoneMapBoundary {
  id: string;
  color: string;
  pathData: string;
}

// Interface for a timezone with color in the legend
interface TimezoneWithColor {
  id: string;
  name: string;
  color: string;
  city?: string;
  country?: string;
}

// Interface for the hovered timezone
interface HoveredTimezone {
  id: string;
  name: string;
  formatted: string;
  isDaylight: boolean;
  isBusinessHours: boolean;
}

// Interface for the map position
interface MapPosition {
  coordinates: [number, number];
  zoom: number;
  width?: number;
  height?: number;
  scale?: number;
  center?: [number, number];
}

// Define the TimezoneMapLegend component props
interface TimezoneMapLegendProps {
  timezones: TimezoneWithColor[];
}

/**
 * Component displays a legend for timezones on the map
 */
function TimezoneMapLegend({ timezones }: TimezoneMapLegendProps) {
  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10 max-w-xs">
      <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Selected Timezones</h3>
      <ul className="space-y-1.5">
        {timezones.map(timezone => (
          <li key={timezone.id} className="flex items-center text-sm">
            <span 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: timezone.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">{timezone.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Update the TimezoneData interface in this file to include boundaries and center properties
interface ExtendedTimezoneData extends TimezoneData {
  center?: { lat: number; lng: number };
  boundaries?: [number, number][];
}

/**
 * Interactive world map that allows selecting and visualizing timezones
 */
export function WorldMapSelector() {
  // Access timezone store
  const { 
    timezones: selectedTimezones, 
    addTimezone,
    localTimezone
  } = useTimezoneStore();

  // Map state
  const [position, setPosition] = useState<MapPosition>({
    coordinates: [0, 20], // Center slightly north for better view
    zoom: 1.2
  });
  
  // Hovered timezone
  const [hoveredTimezone, setHoveredTimezone] = useState<HoveredTimezone | null>(null);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Responsive state
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Handle map move
  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  }, []);
  
  // Move handleSelectTimezone above handleMapClick
  const handleSelectTimezone = useCallback((id: string) => {
    // Find the selected timezone data
    const tzData = getTimezoneFromId(id) as ExtendedTimezoneData;
    if (!tzData) return;

    // Check if this timezone is already selected
    if (!addTimezone) return;

    // Add the timezone to the store
    addTimezone({
      id: tzData.id,
      name: tzData.name,
      offset: tzData.offset,
      abbreviation: tzData.abbreviation ?? '',
    });

    // Update the map position to center on the selected timezone
    const { lat, lng } = tzData.center || { lat: 0, lng: 0 };
    setPosition({ coordinates: [lng, lat], zoom: 4 });
  }, [addTimezone, setPosition]);
  
  // Now define handleMapClick which uses handleSelectTimezone
  const handleMapClick = useCallback((e: React.MouseEvent, geo: any) => {
    // If no geography was clicked, use the click coordinates directly
    if (!geo) {
      const svgCoords = d3.pointer(e);
      
      // Convert SVG coordinates to map coordinates (rough approximation)
      // Use optional chaining to safely access properties
      const width = position.width ?? window.innerWidth;
      const height = position.height ?? window.innerHeight;
      const scale = position.scale ?? position.zoom;
      const center = position.center ?? position.coordinates;
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Calculate latitude and longitude from the click position
      const lng = ((svgCoords[0] - centerX) / scale) + center[0];
      const lat = ((centerY - svgCoords[1]) / scale) + center[1];
      
      // Get the timezone at these coordinates
      const tzData = getTimezoneFromMapCoordinates(lat, lng);
      if (tzData && tzData.id) {
        handleSelectTimezone(tzData.id);
      }
      return;
    }
    
    // Handle different geometry types
    const geometry = geo.geometry;
    if (!geometry) return;
    
    let coordinates: [number, number][] = [];
    
    switch (geometry.type) {
      case 'Polygon':
        // Extract first set of coordinates from the polygon
        coordinates = geometry.coordinates[0];
        break;
      case 'MultiPolygon':
        // Extract first set of coordinates from the first polygon
        coordinates = geometry.coordinates[0][0];
        break;
      case 'Point':
        // For point geometries, use the point directly
        coordinates = [geometry.coordinates];
        break;
      default:
        return; // Unsupported geometry type
    }
    
    if (coordinates.length === 0) return;
    
    // Calculate the center of the feature
    const centerLng = coordinates.reduce((sum, [lng]) => sum + lng, 0) / coordinates.length;
    const centerLat = coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length;
    
    // Get the timezone at these coordinates
    const tzData = getTimezoneFromMapCoordinates(centerLat, centerLng);
    if (tzData && tzData.id) {
      handleSelectTimezone(tzData.id);
    }
  }, [position, handleSelectTimezone]);
  
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
  
  // Optimize the selection of timezone boundaries
  const selectedTimezoneBoundaries = useMemo(() => {
    return Object.entries(TIMEZONE_BOUNDARIES)
      .map(([tz, data]) => {
        const isSelected = selectedTimezones.some(
          (selectedTz) => selectedTz.id === tz || getRelatedTimezones(tz).includes(selectedTz.id)
        );
        
        if (!isSelected) return null;
        
        // Pre-calculate the path data
        const pathData = mapPolygonToPath(data.boundaries as [number, number][]);
        
        return {
          id: tz,
          color: data.color,
          pathData
        };
      })
      .filter(Boolean) as TimezoneMapBoundary[]; // Use type assertion here
  }, [selectedTimezones]);
  
  // Prepare timezone info for the legend
  const legendTimezones = useMemo((): TimezoneWithColor[] => {
    return selectedTimezones.map(tz => {
      const region = TIMEZONE_REGIONS.find(r => r.id === tz.id);
      const name = region ? region.name : tz.id.split('/').pop()?.replace('_', ' ') || tz.id;
      
      // Try to get the human-readable name from the timezone boundaries
      let displayName = name;
      const tzBoundary = Object.keys(TIMEZONE_BOUNDARIES).find(key => {
        // Check if this is the exact timezone or a parent/related one
        if (key === tz.id) return true;
        
        // Check common patterns (e.g., America/New_York should match with America/Toronto)
        if (tz.id.startsWith('America/') && key.startsWith('America/')) {
          const boundary = getTimezoneBoundary(tz.id);
          if (boundary && TIMEZONE_BOUNDARIES[key]) {
            const keyBoundary = TIMEZONE_BOUNDARIES[key].boundaries;
            if (boundary && JSON.stringify(boundary) === JSON.stringify(keyBoundary)) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      if (tzBoundary && TIMEZONE_BOUNDARIES[tzBoundary]) {
        displayName = TIMEZONE_BOUNDARIES[tzBoundary].name;
      }
      
      return {
        id: tz.id,
        name: displayName || tz.id,
        color: getTimezoneColor(tz.id),
        city: tz.city,
        country: tz.country
      };
    });
  }, [selectedTimezones]);
  
  return (
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
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-blue-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        {/* Search Overlay */}
        {isSearchOpen && (
          <SearchOverlay 
            onSelectTimezone={handleSelectTimezone}
            onClose={() => setIsSearchOpen(false)}
          />
        )}
        
        {/* Map Controls */}
        <MapControls 
          position={position}
          setPosition={setPosition}
          onSearchClick={() => setIsSearchOpen(true)}
        />
        
        {/* Legend */}
        {!isMobile && <TimezoneMapLegend timezones={legendTimezones} />}
        
        {/* Hover tooltip */}
        {hoveredTimezone && (
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10 max-w-xs">
            <div className="font-medium text-gray-900 dark:text-white">{hoveredTimezone.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{hoveredTimezone.id}</div>
            <div className="text-lg font-medium text-gray-900 dark:text-white mt-1">{hoveredTimezone.formatted}</div>
            <div className="flex items-center mt-2 space-x-2">
              <span className={`inline-block w-3 h-3 rounded-full ${hoveredTimezone.isDaylight ? 'bg-yellow-400' : 'bg-indigo-700'}`}></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{hoveredTimezone.isDaylight ? 'Daylight' : 'Night time'}</span>
              
              <span className={`inline-block w-3 h-3 rounded-full ml-2 ${hoveredTimezone.isBusinessHours ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{hoveredTimezone.isBusinessHours ? 'Business hours' : 'Non-business hours'}</span>
            </div>
          </div>
        )}
        
        {/* Map Component */}
        <WorldMap>
          <SafeZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={6}
          >
            {/* Base geography - use our fallback if needed */}
            <SafeGeographies onMapClick={handleMapClick} />
            
            {/* Draw selected timezone boundaries */}
            {selectedTimezoneBoundaries.map(boundary => (
              <g key={boundary.id}>
                <path
                  d={boundary.pathData}
                  fill="none"
                  stroke={boundary.color}
                  strokeWidth={3 / position.zoom}
                  strokeOpacity={1}
                  strokeLinejoin="round"
                />
              </g>
            ))}
            
            {/* Display markers for the selected timezones */}
            {selectedTimezones.map(timezone => {
              // Get the center point of the timezone boundaries for the marker
              const boundary = getTimezoneBoundary(timezone.id);
              if (!boundary || !boundary.length) return null;
              
              // Calculate the center point of the timezone boundary
              const centerLat = boundary.reduce((sum, [lat]) => sum + lat, 0) / boundary.length;
              const centerLng = boundary.reduce((sum, [, lng]) => sum + lng, 0) / boundary.length;
              
              // Check if timezone is in business hours
              const isWorkHours = isBusinessHours(timezone.id);
              const markerColor = isWorkHours ? "#10b981" : "#3b82f6"; // Green for business hours, blue otherwise
              
              return (
                <Marker key={timezone.id} coordinates={[centerLng, centerLat]}>
                  <circle 
                    r={4 / position.zoom} 
                    fill={markerColor}
                    stroke="#ffffff"
                    strokeWidth={1.5 / position.zoom}
                  />
                  <text
                    textAnchor="middle"
                    y={12 / position.zoom}
                    style={{ 
                      fontSize: `${14 / position.zoom}px`,
                      fontWeight: 'bold',
                      fill: "#1e293b", // slate-800
                      stroke: "#ffffff",
                      strokeWidth: 0.5 / position.zoom,
                      paintOrder: "stroke"
                    }}
                  >
                    {timezone.name.split(' ')[0]}
                  </text>
                </Marker>
              );
            })}
          </SafeZoomableGroup>
        </WorldMap>
      </div>
    </ErrorBoundary>
  );
}

function SafeGeographies({ onMapClick }: { onMapClick: (e: React.MouseEvent, geo: any) => void }) {
  const [geojson, setGeojson] = useState<any>(FALLBACK_GEOJSON);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Try to load the map data
    fetch("/data/world-110m.json")
      .then(res => {
        if (!res.ok) throw new Error("Could not load map data");
        return res.json();
      })
      .then(data => {
        if (data && typeof data === 'object') {
          setGeojson(data);
        }
      })
      .catch(error => {
        console.error("Failed to load world-110m.json:", error);
        // Try the fallback file
        fetch("/data/fallback-world.json")
          .then(res => {
            if (!res.ok) throw new Error("Could not load fallback map");
            return res.json();
          })
          .then(data => {
            if (data && typeof data === 'object') {
              console.log("Using fallback world map");
              setGeojson(data);
            }
          })
          .catch(fallbackError => {
            console.error("Failed to load fallback map:", fallbackError);
            // Keep using the hardcoded fallback
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .finally(() => {
        if (loading) setLoading(false);
      });
  }, [loading]);
  
  if (loading) {
    return (
      <g>
        <text x="50%" y="50%" textAnchor="middle" fill="#6b7280">
          Loading map...
        </text>
      </g>
    );
  }
  
  return (
    <Geographies geography={geojson}>
      {({ geographies = [] }) => 
        geographies.length > 0 ? geographies.map(geo => (
          <Geography
            key={geo.rsmKey || (geo.properties ? geo.properties.name : 'world')}
            geography={geo}
            fill="#EAEAEC"
            stroke="#D6D6DA"
            style={{
              default: { 
                fill: "#EAEAEC", 
                stroke: "#D6D6DA", 
                strokeWidth: 0.5,
                outline: "none"
              },
              hover: { 
                fill: "#F5F5F5", 
                stroke: "#D6D6DA", 
                strokeWidth: 0.5,
                outline: "none"
              },
              pressed: { 
                fill: "#E0E0E0", 
                stroke: "#D6D6DA", 
                strokeWidth: 0.5,
                outline: "none"
              }
            }}
            onClick={(e) => onMapClick(e, geo)}
          />
        )) : (
          // Render a fallback rectangle if no geographies are available
          <rect
            x="-180"
            y="-90"
            width="360"
            height="180"
            fill="#EAEAEC"
            stroke="#D6D6DA"
            onClick={(e) => onMapClick(e, null)}
          />
        )
      }
    </Geographies>
  );
}

export default React.memo(WorldMapSelector); 