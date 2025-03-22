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
  isDaylightSavingTime,
  swapCoordinates,
  normalizeCoordinates
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
    center: props.center || [0, 0],
    // Add smoothness properties to the zoom behavior
    translateExtent: [[-Infinity, -Infinity], [Infinity, Infinity]],
    transitionDuration: 350,  // Add a sensible duration for smooth transitions
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
    // Apply transition duration through style props instead
    const ZoomableGroupWithoutRef = (props: ZoomableGroupProps) => {
      // Filter out custom props that should not be passed to DOM elements
      const { transitionDuration, ...domSafeProps } = props;
      
      return (
        <ZoomableGroup 
          {...domSafeProps}
          // Apply animation settings properly
          style={{
            transition: "transform 250ms"
          }}
        />
      );
    };
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
  
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    // Set up cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Try to fetch the world map data
    const controller = new AbortController();
    
    fetch("/data/world-110m.json", { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load map data: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (isMounted.current) {
          console.log('Successfully loaded map data');
          setGeoData(data);
          setError(false);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        
        console.error("Error loading world map:", err);
        if (isMounted.current) {
          setError(true);
        }
        // Keep using the fallback
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
      
    return () => {
      controller.abort();
    };
  }, []);

  // Replace the original component with our error-handling version
  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ 
        scale: 170,
        center: [0, 0], // Ensure center is properly set
        rotate: [0, 0, 0] // Prevent any rotation that might skew coordinates
      }}
      width={800}
      height={400}
      style={{ 
        width: "100%", 
        height: "100%",
        // Add CSS to improve SVG rendering
        shapeRendering: "optimizeSpeed",
        textRendering: "optimizeSpeed",
        // This helps with SVG performance
        vectorEffect: "non-scaling-stroke"
      }}
      {...props}
    >
      {loading && (
        <g>
          <text x="50%" y="50%" textAnchor="middle" fill="#666" fontSize="14px">
            Loading map data...
          </text>
        </g>
      )}
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
    <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10 max-w-xs">
      <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Selected Timezones</h3>
      <ul className="space-y-1.5">
        {timezones.map(timezone => (
          <li key={timezone.id} className="flex items-center text-sm">
            <span 
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: timezone.color }}
            />
            <span className="text-gray-700 dark:text-gray-300 truncate">{timezone.name}</span>
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

// Add a throttled Geography component to optimize rendering
const OptimizedGeography = React.memo(({ 
  geo, 
  isDarkMode, 
  onClick, 
  onHoverEnter, 
  onHoverLeave 
}: { 
  geo: any;
  isDarkMode: boolean;
  onClick: (e: React.MouseEvent) => void;
  onHoverEnter: (e: React.MouseEvent) => void;
  onHoverLeave: () => void;
}) => {
  const geoId = geo.rsmKey || (geo.properties ? geo.properties.name : 'world');
  
  return (
    <Geography
      key={geoId}
      geography={geo}
      fill={isDarkMode ? "#374151" : "#EAEAEC"} 
      stroke={isDarkMode ? "#6B7280" : "#D6D6DA"}
      style={{
        default: { 
          fill: isDarkMode ? "#374151" : "#EAEAEC", 
          stroke: isDarkMode ? "#6B7280" : "#D6D6DA", 
          strokeWidth: 0.5,
          outline: "none",
          transition: "fill 0.2s"
        },
        hover: { 
          fill: isDarkMode ? "#4B5563" : "#F5F5F5", 
          stroke: isDarkMode ? "#9CA3AF" : "#D6D6DA", 
          strokeWidth: 0.5,
          outline: "none",
          transition: "fill 0.2s"
        },
        pressed: { 
          fill: isDarkMode ? "#1F2937" : "#E0E0E0", 
          stroke: isDarkMode ? "#6B7280" : "#D6D6DA", 
          strokeWidth: 0.5,
          outline: "none",
          transition: "fill 0.2s"
        }
      }}
      onClick={onClick}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if dark mode changes or the geography changes
  return prevProps.isDarkMode === nextProps.isDarkMode && 
         prevProps.geo.rsmKey === nextProps.geo.rsmKey;
});

OptimizedGeography.displayName = 'OptimizedGeography';

// Create a more reliable marker component that ensures proper positioning
const SafeMarker = ({ coordinates, children }: { coordinates: [number, number], children: React.ReactNode }) => {
  // Validate coordinates before rendering
  const isValidCoordinate = (
    Array.isArray(coordinates) && 
    coordinates.length === 2 &&
    Number.isFinite(coordinates[0]) && 
    Number.isFinite(coordinates[1]) &&
    Math.abs(coordinates[1]) <= 90 &&  // Valid latitude range
    Math.abs(coordinates[0]) <= 180    // Valid longitude range
  );
  
  if (!isValidCoordinate) {
    console.error("Invalid marker coordinates:", coordinates);
    return null; // Don't render invalid markers
  }
  
  return (
    <Marker coordinates={coordinates}>
      {children}
    </Marker>
  );
};

// Create a tooltip component to help with performance
const HoverTooltip = React.memo(({
  hoveredTimezone,
  hoverCoordinates
}: {
  hoveredTimezone: HoveredTimezone | null;
  hoverCoordinates: [number, number] | null;
}) => {
  if (!hoveredTimezone) return null;
  
  return (
    <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10 max-w-xs">
      <div className="font-medium text-gray-900 dark:text-white">{hoveredTimezone.name}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{hoveredTimezone.id}</div>
      <div className="text-lg font-medium text-gray-900 dark:text-white mt-1">{hoveredTimezone.formatted}</div>
      {hoverCoordinates && (
        <div className="text-xs text-gray-500 mt-1">
          Map position [lng, lat]: {hoverCoordinates[0].toFixed(2)}°, {hoverCoordinates[1].toFixed(2)}°
        </div>
      )}
      <div className="flex items-center mt-2 space-x-2">
        <span className={`inline-block w-3 h-3 rounded-full ${hoveredTimezone.isDaylight ? 'bg-yellow-400' : 'bg-indigo-700'}`}></span>
        <span className="text-sm text-gray-600 dark:text-gray-300">{hoveredTimezone.isDaylight ? 'Daylight' : 'Night time'}</span>
        
        <span className={`inline-block w-3 h-3 rounded-full ml-2 ${hoveredTimezone.isBusinessHours ? 'bg-green-500' : 'bg-gray-500'}`}></span>
        <span className="text-sm text-gray-600 dark:text-gray-300">{hoveredTimezone.isBusinessHours ? 'Business hours' : 'Non-business hours'}</span>
      </div>
    </div>
  );
});

HoverTooltip.displayName = 'HoverTooltip';

// Optimize rendering of map boundaries
const TimezoneBoundary = React.memo(({ 
  boundary, 
  zoom 
}: { 
  boundary: TimezoneMapBoundary,
  zoom: number
}) => {
  // Only render if we have valid path data
  if (!boundary || !boundary.pathData || boundary.pathData === 'Z' || boundary.pathData === ' Z') {
    console.error('Invalid boundary path data:', boundary);
    return null;
  }

  return (
    <g key={boundary.id} className="timezone-boundary">
      <path
        d={boundary.pathData}
        fill="none"
        stroke={boundary.color}
        strokeWidth={3 / zoom}
        strokeOpacity={0.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
});

TimezoneBoundary.displayName = 'TimezoneBoundary';

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
  const [hoverCoordinates, setHoverCoordinates] = useState<[number, number] | null>(null);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Responsive state
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Log selected timezones on component mount and when they change
  useEffect(() => {
    console.log('WorldMapSelector - Selected timezones from store:', selectedTimezones);
    
    // Check if we need to add the local timezone
    if (selectedTimezones.length === 0 && localTimezone && addTimezone) {
      console.log('No selected timezones, adding local timezone:', localTimezone);
      
      // Get the timezone data for local timezone
      const tzData = getTimezoneFromId(localTimezone);
      
      if (tzData) {
        addTimezone({
          id: localTimezone,
          name: tzData.name || `Local (${localTimezone})`,
          offset: tzData.offset || '',
          abbreviation: tzData.abbreviation || '',
        });
      } else {
        // If we can't get timezone data, try a simpler approach
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZoneName: 'short',
            timeZone: localTimezone
          });
          const formattedZone = formatter.format(now);
          const abbreviation = formattedZone.split(' ').pop() || '';
          
          // Get simple city name from timezone ID
          const parts = localTimezone.split('/');
          const cityName = parts[parts.length - 1].replace(/_/g, ' ');
          
          addTimezone({
            id: localTimezone,
            name: cityName || `Local (${localTimezone})`,
            offset: '',
            abbreviation,
          });
        } catch (error) {
          console.error(`Error adding local timezone (${localTimezone}):`, error);
          
          // Last resort fallback
          addTimezone({
            id: localTimezone,
            name: `Local (${localTimezone})`,
            offset: '',
            abbreviation: '',
          });
        }
      }
    }
    
    // Debug log of boundaries and markers
    if (selectedTimezones.length > 0) {
      console.log(`WorldMapSelector - Selected ${selectedTimezones.length} timezones:`);
      selectedTimezones.forEach(tz => {
        // Check if boundary exists
        const boundary = getTimezoneBoundary(tz.id);
        const tzData = getTimezoneData(tz.id);
        const hasCenter = !!(tzData && tzData.center);
        console.log(`Timezone ${tz.id} - Has boundary: ${!!boundary}, Has center: ${hasCenter}`);
        
        if (hasCenter && tzData?.center) {
          console.log(`  Center coordinates for ${tz.id}: [${tzData.center.lat}, ${tzData.center.lng}]`);
        }
      });
    }
  }, [selectedTimezones, localTimezone, addTimezone]);
  
  // Handle map move with useCallback to prevent rerenders
  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(prevPosition => {
      // Only update if the position actually changed
      if (
        prevPosition.coordinates[0] !== position.coordinates[0] ||
        prevPosition.coordinates[1] !== position.coordinates[1] ||
        prevPosition.zoom !== position.zoom
      ) {
        return position;
      }
      return prevPosition;
    });
  }, []);
  
  // Add a debounce flag for hover updates
  const isUpdatingHover = useRef(false);
  
  // Handle hovering over a point on the map - optimized with rate limiting
  const handleMapHover = useCallback((coordinates: [number, number] | null) => {
    // Skip updates if we're already processing one
    if (isUpdatingHover.current) return;
    
    // Set flag to prevent simultaneous updates
    isUpdatingHover.current = true;
    
    try {
      if (!coordinates) {
        setHoveredTimezone(null);
        setHoverCoordinates(null);
        return;
      }
      
      // Save the original coordinates for debugging
      setHoverCoordinates(coordinates);
      
      // IMPORTANT: coordinates from react-simple-maps are in [lng, lat] format
      const [lng, lat] = coordinates;
      
      // Normalize coordinates to valid ranges
      const [normalizedLng, normalizedLat] = normalizeCoordinates(lng, lat);
      
      // findClosestTimezone expects [lat, lng] format
      const timezoneId = findClosestTimezone(normalizedLat, normalizedLng);
      
      if (!timezoneId) {
        console.warn('No timezone found for hover coordinates:', [normalizedLat, normalizedLng]);
        setHoveredTimezone(null);
        return;
      }
      
      const region = TIMEZONE_REGIONS.find(r => r.id === timezoneId);
      
      if (region) {
        const now = new Date();
        const isDaylight = isPointInDaylight(normalizedLat, normalizedLng, now);
        const isWorkHours = isBusinessHours(timezoneId, now);
        
        // For display purposes
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            timeZone: timezoneId,
            hour12: true
          });
          
          const formatted = formatter.format(now);
          
          setHoveredTimezone({
            id: timezoneId,
            name: region.name,
            formatted: formatted,
            isBusinessHours: isWorkHours,
            isDaylight
          });
        } catch (error) {
          console.error(`Error formatting time for hover timezone ${timezoneId}:`, error);
          // Provide a fallback even if formatting fails
          setHoveredTimezone({
            id: timezoneId,
            name: region.name,
            formatted: '(time unavailable)',
            isBusinessHours: false,
            isDaylight: false
          });
        }
      } else {
        console.warn(`Found timezone ID ${timezoneId} but no matching region data`);
        setHoveredTimezone(null);
      }
    } catch (error) {
      console.error('Error in handleMapHover:', error);
      setHoveredTimezone(null);
    } finally {
      // Use requestAnimationFrame to limit the rate of updates
      requestAnimationFrame(() => {
        isUpdatingHover.current = false;
      });
    }
  }, []);
  
  // Move handleSelectTimezone above handleMapClick
  const handleSelectTimezone = useCallback((id: string) => {
    if (!id) {
      console.warn('handleSelectTimezone called with empty ID');
      return;
    }
    
    // Find the selected timezone data
    const tzData = getTimezoneFromId(id) as ExtendedTimezoneData;
    console.log('Selecting timezone:', id, tzData);
    
    if (!tzData) {
      console.warn('Failed to get timezone data for ID:', id);
      return;
    }

    // Check if this timezone is already selected
    const isAlreadySelected = selectedTimezones.some(tz => tz.id === id);
    if (isAlreadySelected) {
      console.log(`Timezone ${id} is already selected, skipping`);
      return;
    }

    if (!addTimezone) {
      console.warn('addTimezone function is not available');
      return;
    }

    // Add the timezone to the store
    console.log('Adding timezone to store:', {
      id: tzData.id,
      name: tzData.name,
      offset: tzData.offset,
      abbreviation: tzData.abbreviation ?? '',
    });
    
    addTimezone({
      id: tzData.id,
      name: tzData.name,
      offset: tzData.offset,
      abbreviation: tzData.abbreviation ?? '',
    });

    // Update the map position to center on the selected timezone if it has center coordinates
    if (tzData.center) {
      const { lat, lng } = tzData.center;
      setPosition({ coordinates: [lng, lat], zoom: 4 });
    }
  }, [addTimezone, setPosition, selectedTimezones]);
  
  // Handle map click
  const handleMapClick = useCallback((coordinates: [number, number]) => {
    console.log('Map clicked at coordinates:', coordinates);
    
    // IMPORTANT: coordinates from react-simple-maps are in [lng, lat] format
    const [lng, lat] = coordinates;
    
    // Normalize coordinates to valid ranges
    const [normalizedLng, normalizedLat] = normalizeCoordinates(lng, lat);
    console.log('Normalized coordinates:', [normalizedLng, normalizedLat]);
    
    // Get timezone from coordinates (findClosestTimezone expects [lat, lng] format)
    const timezoneId = findClosestTimezone(normalizedLat, normalizedLng);
    console.log('Found timezone for click:', timezoneId);
    
    // Find the timezone data
    if (timezoneId) {
      // Handle timezone selection
      handleSelectTimezone(timezoneId);
    } else {
      console.warn('No timezone found for coordinates:', [normalizedLat, normalizedLng]);
    }
  }, [handleSelectTimezone]);
  
  // Timezone boundaries
  const selectedTimezoneBoundaries = useMemo(() => {
    // Add logging to debug
    if (selectedTimezones.length === 0) {
      console.log('No selected timezones to display boundaries for');
      return [];
    }
    
    console.log('Processing boundaries for selected timezones:', selectedTimezones.map(tz => tz.id));
    
    const boundaries = selectedTimezones.map((tz, index) => {
      if (!tz || !tz.id) {
        console.error('Invalid timezone object in selectedTimezones array', tz);
        return null;
      }
      
      console.log(`Processing boundary for timezone: ${tz.id}`);
      
      // Get the boundary data for the timezone
      const boundaryPaths = getTimezoneBoundary(tz.id);
      
      // Log if we failed to get boundaries
      if (!boundaryPaths) {
        console.warn(`No boundary found for timezone: ${tz.id}`);
        return null;
      }
      
      if (!Array.isArray(boundaryPaths) || boundaryPaths.length === 0) {
        console.warn(`Empty boundary array for timezone: ${tz.id}`);
        return null;
      }

      // Validate boundary data - make sure all points are valid coordinates
      const validBoundary = boundaryPaths.every(point => 
        Array.isArray(point) && 
        point.length === 2 && 
        Number.isFinite(point[0]) && 
        Number.isFinite(point[1]) &&
        Math.abs(point[1]) <= 90 && 
        Math.abs(point[0]) <= 180
      );

      if (!validBoundary) {
        console.error(`Invalid boundary coordinates for timezone: ${tz.id}`);
        console.log('First few boundary points:', boundaryPaths.slice(0, 3));
        return null;
      }
      
      // Convert polygons to SVG path data
      const pathData = mapPolygonToPath(boundaryPaths);
      
      // Verify we have valid path data
      if (!pathData || pathData === '' || pathData === 'Z' || pathData === ' Z') {
        console.warn(`Invalid path data for timezone: ${tz.id}, boundary points: ${boundaryPaths.length}`);
        return null;
      }
      
      console.log(`Generated valid path data for timezone: ${tz.id}`);
      
      // Create the map boundary object
      const color = getTimezoneColor(tz.id);
      
      return {
        id: tz.id,
        pathData,
        color
      };
    }).filter(Boolean) as TimezoneMapBoundary[];

    console.log(`Generated ${boundaries.length} valid timezone boundaries`);
    return boundaries;
  }, [selectedTimezones]);
  
  // Map markers for selected timezones (cities, labels, etc.)
  const mapMarkers = useMemo(() => {
    return selectedTimezones.map((timezone, index) => {
      // Get timezone data with coordinates
      let tzData = getTimezoneData(timezone.id);
      
      if (!tzData) {
        console.warn(`Failed to get any timezone data for: ${timezone.id}`);
        return null;
      }
      
      if (!tzData.center) {
        console.warn(`Missing center coordinates for timezone: ${timezone.id}`);
        
        // Try to find region directly from TIMEZONE_REGIONS array
        const region = TIMEZONE_REGIONS.find(r => r.id === timezone.id);
        if (region) {
          console.log(`Found region for ${timezone.id} in TIMEZONE_REGIONS`);
          tzData.center = { lat: region.lat, lng: region.lng };
        } else {
          // Log helpful debugging information
          console.error(`Timezone ${timezone.id} not found in TIMEZONE_REGIONS array`);
          
          // Fallback to looking for a boundary to estimate a center
          const boundaryPaths = getTimezoneBoundary(timezone.id);
          if (boundaryPaths && boundaryPaths.length > 0) {
            console.log(`Using boundary to calculate center for: ${timezone.id}`);
            // Calculate center from boundary points
            const points = boundaryPaths;
            const totalLng = points.reduce((sum, [lng, lat]) => sum + lng, 0);
            const totalLat = points.reduce((sum, [lng, lat]) => sum + lat, 0);
            const avgLng = totalLng / points.length;
            const avgLat = totalLat / points.length;
            
            // Add center to tzData
            tzData.center = { lat: avgLat, lng: avgLng };
          } else {
            // Last resort - try to extract city from timezone ID and look for matching cities
            const parts = timezone.id.split('/');
            const cityPart = parts[parts.length - 1].replace(/_/g, ' ');
            
            // Look for any region that contains this city name
            const matchingRegion = TIMEZONE_REGIONS.find(r => 
              r.name.toLowerCase().includes(cityPart.toLowerCase())
            );
            
            if (matchingRegion) {
              console.log(`Found matching region by city name: ${matchingRegion.id} for ${timezone.id}`);
              tzData.center = { lat: matchingRegion.lat, lng: matchingRegion.lng };
            } else {
              console.error(`Cannot find any coordinates for: ${timezone.id}`);
              // Return without coordinates - we'll handle this case in a moment
            }
          }
        }
      }
      
      // If we still don't have coordinates, skip this marker
      if (!tzData.center) {
        console.error(`Still missing center coordinates for: ${timezone.id} after all fallback attempts`);
        return null;
      }
      
      // Validate coordinates - make sure they're in valid ranges
      if (
        !Number.isFinite(tzData.center.lat) || 
        !Number.isFinite(tzData.center.lng) ||
        Math.abs(tzData.center.lat) > 90 ||
        Math.abs(tzData.center.lng) > 180
      ) {
        console.error(`Invalid coordinates for timezone ${timezone.id}:`, tzData.center);
        return null;
      }
      
      // Convert coordinates to map format [lng, lat] - IMPORTANT: order matters here
      const coordinates: [number, number] = [tzData.center.lng, tzData.center.lat];
      
      console.log(`Timezone marker for ${timezone.id} positioned at:`, coordinates);
      
      // Get color for the timezone marker
      const color = getTimezoneColor(timezone.id);
      
      // Format the current time in this timezone
      const now = new Date();
      let formatted;
      try {
        formatted = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          timeZone: timezone.id,
          hour12: true
        }).format(now);
      } catch (e) {
        console.error(`Error formatting time for ${timezone.id}:`, e);
        formatted = '(invalid timezone)';
      }
      
      // Determine if the location is in daytime or nighttime
      const isDaylight = isPointInDaylight(tzData.center.lat, tzData.center.lng, now);
      
      // Determine if the location is in business hours
      const isWorkHour = isBusinessHours(timezone.id, now);
      
      return (
        <g key={timezone.id} className="timezone-marker">
          {/* Circle marker */}
          <SafeMarker coordinates={coordinates}>
            <g transform="translate(-12, -22)">
              {/* Marker circle with time-based coloring */}
              <circle
                r={8}
                fill={isDaylight ? "#F9FAFB" : "#1F2937"}
                stroke={color}
                strokeWidth={2.5}
                className={`transition-all duration-300 ${isWorkHour ? "filter-none" : "opacity-70"}`}
              />
              
              {/* City name label */}
              <text
                textAnchor="middle"
                y={-10}
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fill: isDaylight ? "#111827" : "#F9FAFB",
                  fontSize: '12px',
                  fontWeight: '600',
                  textShadow: isDaylight ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.3)',
                  userSelect: 'none',
                }}
              >
                {timezone.name}
              </text>
              
              {/* Time label */}
              <text
                textAnchor="middle"
                y={25}
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fill: isDaylight ? "#4B5563" : "#D1D5DB",
                  fontSize: '11px',
                  fontWeight: '500',
                  textShadow: isDaylight ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.3)',
                  userSelect: 'none',
                }}
              >
                {formatted}
              </text>
            </g>
          </SafeMarker>
        </g>
      );
    }).filter(Boolean); // Filter out null markers where we couldn't get coordinates
  }, [selectedTimezones]);
  
  // Selected timezone legend
  const legendTimezones = useMemo(() => selectedTimezones.map((tz) => ({
    ...tz,
    color: getTimezoneColor(tz.id)
  })), [selectedTimezones]);
  
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
        
        {/* Legend - moved to the left to avoid conflict with controls */}
        {!isMobile && <TimezoneMapLegend timezones={legendTimezones} />}
        
        {/* Map Controls - moved to the right */}
        <MapControls 
          position={position}
          setPosition={setPosition}
          onSearchClick={() => setIsSearchOpen(true)}
        />
        
        {/* Hover tooltip with coordinate debugging info - use memoized component */}
        <HoverTooltip 
          hoveredTimezone={hoveredTimezone}
          hoverCoordinates={hoverCoordinates}
        />
        
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
            <SafeGeographies onMapClick={handleMapClick} onMapHover={handleMapHover} />
            
            {/* Draw selected timezone boundaries with memoized components */}
            {selectedTimezoneBoundaries.map(boundary => (
              <TimezoneBoundary 
                key={boundary.id}
                boundary={boundary}
                zoom={position.zoom}
              />
            ))}
            
            {/* Display markers for the selected timezones */}
            {mapMarkers}
          </SafeZoomableGroup>
        </WorldMap>
      </div>
    </ErrorBoundary>
  );
}

// Safe wrapper for Geographies component with fallback
function SafeGeographies({ 
  onMapClick, 
  onMapHover 
}: { 
  onMapClick: (coordinates: [number, number]) => void;
  onMapHover: (coordinates: [number, number] | null) => void;
}) {
  const [geoJson, setGeoJson] = useState<any>(null);
  const [geoJsonError, setGeoJsonError] = useState<Error | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isMounted = useRef(true);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const lastHoveredGeo = useRef<Feature | null>(null);
  const lastTimeoutId = useRef<number | null>(null);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Set up observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Reference to track if component is mounted
    isMounted.current = true;
    
    // Create an AbortController to cancel fetch if needed
    const controller = new AbortController();
    const { signal } = controller;

    async function fetchGeoData() {
      try {
        const response = await fetch('/data/world-110m.json', { signal });
        if (!response.ok) {
          throw new Error(`Failed to load map data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setGeoJson(data);
          setGeoJsonError(null);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError' && isMounted.current) {
          console.error('Error loading map data:', error);
          setGeoJsonError(error as Error);
          
          // Try to load a fallback simpler map
          try {
            const fallbackResponse = await fetch('/data/world-50m.json', { signal });
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              if (isMounted.current) {
                setGeoJson(fallbackData);
                console.info('Loaded fallback map data');
              }
            }
          } catch (fallbackError) {
            console.error('Failed to load fallback map:', fallbackError);
          }
        }
      }
    }

    fetchGeoData();

    // Cleanup function - runs when component unmounts
    return () => {
      isMounted.current = false;
      controller.abort();
      
      // Clear any pending timers
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      
      if (lastTimeoutId.current !== null) {
        window.clearTimeout(lastTimeoutId.current);
        lastTimeoutId.current = null;
      }
    };
  }, []);

  const handleMouseEnter = useCallback((geo: Feature, evt: React.MouseEvent) => {
    lastHoveredGeo.current = geo;
    
    // Clear any existing timeout
    if (lastTimeoutId.current !== null) {
      window.clearTimeout(lastTimeoutId.current);
    }
    
    // Create a new timeout to handle hover after a short delay
    lastTimeoutId.current = window.setTimeout(() => {
      // Verify we're still hovering over the same element
      if (lastHoveredGeo.current === geo) {
        // Safely access centroid - check if properties and centroid exist
        const centroid = geo.properties?.centroid;
        if (centroid) {
          // IMPORTANT: Coordinates from centroid are in [longitude, latitude]
          onMapHover([centroid[0], centroid[1]]);
        } else if (geo.geometry?.type === 'Polygon' && geo.geometry.coordinates && geo.geometry.coordinates.length > 0) {
          // If no centroid, calculate the center of the polygon
          const polygon = geo.geometry.coordinates[0];
          if (polygon && polygon.length > 0) {
            let sumLng = 0;
            let sumLat = 0;
            
            polygon.forEach(([lng, lat]) => {
              sumLng += lng;
              sumLat += lat;
            });
            
            const centerLng = sumLng / polygon.length;
            const centerLat = sumLat / polygon.length;
            
            onMapHover([centerLng, centerLat]);
          }
        }
      }
    }, 50); // 50ms delay to debounce hover events
  }, [onMapHover]);

  const handleMouseLeave = useCallback(() => {
    lastHoveredGeo.current = null;
    
    // Clear any existing timeout
    if (lastTimeoutId.current !== null) {
      window.clearTimeout(lastTimeoutId.current);
    }
    
    // Create a new timeout to slightly delay the exit
    lastTimeoutId.current = window.setTimeout(() => {
      // Only remove hover if we haven't hovered over something new
      if (lastHoveredGeo.current === null) {
        onMapHover(null);
      }
    }, 100); // 100ms delay to prevent flickering
  }, [onMapHover]);

  if (geoJsonError && !geoJson) {
    return (
      <g>
        <text x="50%" y="50%" textAnchor="middle" fill="red">
          Error loading map data. Please try again later.
        </text>
      </g>
    );
  }

  if (!geoJson) {
    return (
      <g>
        <text x="50%" y="50%" textAnchor="middle" fill={isDarkMode ? "#fff" : "#333"}>
          Loading map...
        </text>
      </g>
    );
  }
  
  return (
    <Geographies geography={geoJson}>
      {({ geographies }) => 
        geographies.map((geo) => (
          <OptimizedGeography
            key={geo.rsmKey}
            geo={geo}
            isDarkMode={isDarkMode}
            onClick={(evt) => {
              evt.stopPropagation();
              // Safely access centroid with optional chaining
              const centroid = geo.properties?.centroid;
              if (centroid) {
                // centroid is in [lng, lat] format, which is what we need
                onMapClick([centroid[0], centroid[1]]);
              } else if (geo.geometry?.type === 'Polygon' && geo.geometry.coordinates && geo.geometry.coordinates.length > 0) {
                // If no centroid, calculate the center of the polygon
                const polygon = geo.geometry.coordinates[0];
                if (polygon && polygon.length > 0) {
                  let sumLng = 0;
                  let sumLat = 0;
                  
                  polygon.forEach(([lng, lat]) => {
                    sumLng += lng;
                    sumLat += lat;
                  });
                  
                  const centerLng = sumLng / polygon.length;
                  const centerLat = sumLat / polygon.length;
                  
                  // Coordinates should be in [lng, lat] format for onMapClick
                  onMapClick([centerLng, centerLat]);
                }
              }
            }}
            onHoverEnter={(geo) => {
              // Safely access centroid with optional chaining
              const centroid = geo.properties?.centroid;
              if (centroid) {
                // centroid is in [lng, lat] format, which is what we need
                onMapHover([centroid[0], centroid[1]]);
              } else if (geo.geometry?.type === 'Polygon' && geo.geometry.coordinates && geo.geometry.coordinates.length > 0) {
                // If no centroid, calculate the center of the polygon
                const polygon = geo.geometry.coordinates[0];
                if (polygon && polygon.length > 0) {
                  let sumLng = 0;
                  let sumLat = 0;
                  
                  polygon.forEach(([lng, lat]) => {
                    sumLng += lng;
                    sumLat += lat;
                  });
                  
                  const centerLng = sumLng / polygon.length;
                  const centerLat = sumLat / polygon.length;
                  
                  // Coordinates should be in [lng, lat] format for onMapHover
                  onMapHover([centerLng, centerLat]);
                }
              }
            }}
            onHoverLeave={handleMouseLeave}
          />
        ))
      }
    </Geographies>
  );
}

export default React.memo(WorldMapSelector); 