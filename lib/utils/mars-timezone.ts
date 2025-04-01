import { DateTime } from 'luxon';
import { TimezoneInfo } from './timezone';

// Constants for Mars time calculations
const MARS_SOL_TO_EARTH_DAY_RATIO = 1.0274912517; // Mars sol is 24h 39m 35.244s
const MARS_HOUR_IN_EARTH_SECONDS = 3699.37; // Mars hour = 1h 1m 39.37s
const MARS_MINUTE_IN_EARTH_SECONDS = 61.6562; // Mars minute = 61.6562 Earth seconds
const MARS_SECOND_IN_EARTH_SECONDS = 1.0276; // Mars second = 1.0276 Earth seconds

// Add constants for calculating Mars Sol count
const PERSEVERANCE_LANDING_DATE = DateTime.fromISO('2021-02-18T20:55:00Z'); // Landing time in UTC
const SOL_DURATION_MS = MARS_SOL_TO_EARTH_DAY_RATIO * 24 * 60 * 60 * 1000; // Duration of one Mars sol in milliseconds

/**
 * Mars settlement/location information
 */
interface MarsLocation {
  id: string;
  name: string;
  city: string;
  longitude: number; // Degrees from Mars Prime Meridian (Airy-0 crater)
  latitude: number; // Degrees north/south of equator
  description: string;
  roverPresent?: boolean; // Flag for locations with active rovers
  roverName?: string; // Name of rover if present
  roverMission?: string; // Mission details if rover present
  roverLandingDate?: string; // When the rover landed
}

/**
 * Define notable locations on Mars (real landing sites or fictional settlements)
 */
const MARS_LOCATIONS: MarsLocation[] = [
  {
    id: 'Mars/Jezero',
    name: 'Jezero Crater',
    city: 'Jezero Crater',
    longitude: 77.58, // East longitude (updated to match Perseverance's actual location)
    latitude: 18.38, // North latitude
    description: 'Perseverance Rover landing site (2021)',
    roverPresent: true,
    roverName: 'Perseverance',
    roverMission: 'NASA Mars 2020 Mission',
    roverLandingDate: 'February 18, 2021'
  },
  {
    id: 'Mars/Elysium',
    name: 'Elysium Planitia',
    city: 'Elysium Planitia',
    longitude: 135.97, // East longitude
    latitude: 4.5, // North latitude
    description: 'InSight landing site (2018)'
  },
  {
    id: 'Mars/Gale',
    name: 'Gale Crater',
    city: 'Gale Crater',
    longitude: 137.44, // East longitude
    latitude: -5.08, // South latitude
    description: 'Curiosity Rover landing site (2012)'
  },
  {
    id: 'Mars/Olympus',
    name: 'Olympus City',
    city: 'Olympus Mons',
    longitude: 226.31, // East longitude (Olympus Mons)
    latitude: 18.39, // North latitude
    description: 'Future settlement at the base of the largest volcano in the solar system'
  },
  {
    id: 'Mars/Marineris',
    name: 'Marineris Colony',
    city: 'Valles Marineris',
    longitude: 70.00, // East longitude (near Valles Marineris)
    latitude: -13.8, // South latitude
    description: 'Future settlement in the largest canyon system in the solar system'
  },
  {
    id: 'Mars/Airy',
    name: 'Airy Prime',
    city: 'Airy-0 (Prime Meridian)',
    longitude: 0, // Prime Meridian
    latitude: 5.1, // South latitude
    description: 'Mars Prime Meridian settlement (Airy-0 crater)'
  }
];

/**
 * Calculate the current Mars time for a specific Mars location
 * @param location The Mars location ID
 * @returns Current Earth DateTime adjusted for Mars time
 */
export function getCurrentMarsTime(location: string): DateTime {
  // Find the location info
  const marsLocation = MARS_LOCATIONS.find(loc => loc.id === location);
  if (!marsLocation) {
    console.error(`Unknown Mars location: ${location}`);
    return DateTime.now();
  }

  // Current Earth time in UTC
  const now = DateTime.now().toUTC();
  
  // First, apply the Mars sol duration factor to get Mars "UTC" (Coordinated Mars Time)
  // This stretches Earth time to match Mars sol duration
  // This gives us a baseline Mars time at the Mars prime meridian (longitude 0)
  const earthTimestamp = now.toMillis();
  const marsTimestamp = earthTimestamp * MARS_SOL_TO_EARTH_DAY_RATIO;
  
  // Now we need to adjust for the location's longitude on Mars
  // On Mars, just like Earth, every 15 degrees of longitude = 1 hour time difference
  // But Mars hours are longer than Earth hours
  // First convert longitude to hours (15° = 1 hour)
  const longitudeHours = marsLocation.longitude / 15;
  
  // Now adjust the timestamp by the hours offset
  // Need to convert Mars hours to milliseconds (1 Mars hour = 3699.37 seconds = 3699370 ms)
  const hourOffsetMs = longitudeHours * MARS_HOUR_IN_EARTH_SECONDS * 1000;
  
  // Add the offset to the Mars timestamp
  const localMarsTimestamp = marsTimestamp + hourOffsetMs;
  
  // Convert back to DateTime
  // We use UTC to avoid any Earth timezone adjustments
  return DateTime.fromMillis(localMarsTimestamp).toUTC();
}

/**
 * Format Mars time string with "MTC" to indicate Mars Time Coordinated
 * @param marsTime DateTime for Mars
 * @returns Formatted time string with appropriate Mars indicators
 */
export function formatMarsTime(marsTime: DateTime): string {
  // Calculate the current Mars sol (number of days since Perseverance landing)
  const earthTimeSinceLanding = marsTime.toMillis() - PERSEVERANCE_LANDING_DATE.toMillis();
  // Convert to Mars sols and round to nearest integer
  const currentSol = Math.floor(earthTimeSinceLanding / SOL_DURATION_MS);
  
  // Format using standard Earth time format but with Mars as prefix and sol count
  return `${marsTime.toFormat('h:mm a')} MTC (Sol ${currentSol})`;
}

/**
 * Get Mars timezone offset from Earth UTC
 * @param location Mars location ID
 * @returns Offset string in format suitable for display
 */
export function getMarsTimezoneOffset(location: string): string {
  // Mars offset always changes relative to Earth because of the length of Mars sol
  const marsLocation = MARS_LOCATIONS.find(loc => loc.id === location);
  if (!marsLocation) {
    return 'MTC+0';
  }
  
  // Approximate offset in Mars hours
  const longitudeHours = marsLocation.longitude / 15;
  const sign = longitudeHours >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(longitudeHours));
  const minutes = Math.floor((Math.abs(longitudeHours) - hours) * 60);
  
  return `MTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get list of available Mars timezones
 * @returns Array of Mars timezone information objects
 */
export function getMarsSiteTimezones(): TimezoneInfo[] {
  return MARS_LOCATIONS.map(location => {
    const offset = getMarsTimezoneOffset(location.id);
    
    return {
      id: location.id,
      name: `${location.name} ${location.roverPresent ? '🤖' : ''} (${offset})`,
      offset,
      city: location.city,
      country: 'Mars',
      abbreviation: 'MTC',
      region: 'Mars',
      description: location.description,
      roverPresent: location.roverPresent,
      roverName: location.roverName,
      roverMission: location.roverMission
    };
  });
}

/**
 * Get details about any active rover at a Mars location
 * @param locationId Mars location ID
 * @returns Object with rover details or null if no rover present
 */
export function getRoverInfo(locationId: string): {
  name: string;
  mission: string;
  landingDate: string;
  location: string;
  latitude: number;
  longitude: number;
} | null {
  const location = MARS_LOCATIONS.find(loc => loc.id === locationId);
  
  if (!location || !location.roverPresent) {
    return null;
  }
  
  return {
    name: location.roverName || 'Unknown Rover',
    mission: location.roverMission || 'Unknown Mission',
    landingDate: location.roverLandingDate || 'Unknown Date',
    location: location.name,
    latitude: location.latitude,
    longitude: location.longitude
  };
} 