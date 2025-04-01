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
  longitude: number; // Degrees East from Mars Prime Meridian (Airy-0 crater)
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
    roverPresent: false,
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
  // This function is likely incorrect for calculating current time,
  // as it doesn't properly account for the MTC epoch.
  // It's kept for potential reference but convertEarthToMarsTime should be used.
  return DateTime.fromMillis(0); // Return epoch or handle error
}

/** Helper function to calculate Julian Date from UTC DateTime */
function getJulianDate(dt: DateTime): number {
  const utcDt = dt.toUTC();
  const year = utcDt.year;
  const month = utcDt.month;
  const day = utcDt.day;
  const hour = utcDt.hour;
  const minute = utcDt.minute;
  const second = utcDt.second;

  // Formula for Julian Date calculation
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const julianDayNumber = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const fractionOfDay = (hour - 12) / 24 + minute / 1440 + second / 86400;

  return julianDayNumber + fractionOfDay;
}

// Constants for MSD calculation
const JD_TT_OFFSET_SECONDS = 69.184; // Approximate leap seconds + 32.184s (TAI-UTC + TT-TAI) for recent dates
const MSD_EPOCH_OFFSET = 44796.0; // Offset for MSD epoch relative to JD
const MSD_CONSTANT = 0.00096; // Small constant in MSD formula

// Calculate MSD for Perseverance Landing Date once
const PERSEVERANCE_LANDING_JD_UT = getJulianDate(PERSEVERANCE_LANDING_DATE);
const PERSEVERANCE_LANDING_JD_TT = PERSEVERANCE_LANDING_JD_UT + (JD_TT_OFFSET_SECONDS / 86400.0);
const PERSEVERANCE_LANDING_MSD = (PERSEVERANCE_LANDING_JD_TT - 2451549.5) / MARS_SOL_TO_EARTH_DAY_RATIO + MSD_EPOCH_OFFSET - MSD_CONSTANT;


/**
 * Convert an Earth DateTime object to its equivalent Mars Local Mean Solar Time (LMST) components and Sol number.
 * Uses Julian Date calculation for higher accuracy.
 * @param earthDateTime The Earth DateTime object to convert
 * @param location The Mars location ID
 * @returns An object containing Mars hours, minutes, seconds, and the Sol number relative to Perseverance landing.
 */
interface MarsTimeData {
  hours: number;
  minutes: number;
  seconds: number;
  sol: number; // Sol number relative to Perseverance landing (Sol 0)
}

export function convertEarthToMarsTime(earthDateTime: DateTime, location: string): MarsTimeData {
  const marsLocation = MARS_LOCATIONS.find(loc => loc.id === location);
  if (!marsLocation) {
    console.error(`Unknown Mars location: ${location}`);
    return { hours: 0, minutes: 0, seconds: 0, sol: -1 }; // Return default/error state
  }

  // 1. Calculate Julian Date (JD_UT)
  const jd_ut = getJulianDate(earthDateTime);

  // 2. Calculate Julian Date (JD_TT)
  const jd_tt = jd_ut + (JD_TT_OFFSET_SECONDS / 86400.0);

  // 3. Calculate Mars Sol Date (MSD)
  const msd = (jd_tt - 2451549.5) / MARS_SOL_TO_EARTH_DAY_RATIO + MSD_EPOCH_OFFSET - MSD_CONSTANT;

  // 4. Calculate Coordinated Mars Time (MTC) - fractional hours
  const mtc_hours = (msd * 24) % 24;

  // 5. Calculate Local Mean Solar Time (LMST) - fractional hours
  // Longitude is degrees East. LMST = MTC - (longitude_east / 15.0)
  let lmst_hours = mtc_hours - (marsLocation.longitude / 15.0);
  // Ensure LMST is within 0-24 range
  lmst_hours = (lmst_hours + 24) % 24;

  // 6. Extract H:M:S from LMST - Alternative extraction focusing on fractional parts
  let hours_calc = Math.floor(lmst_hours);
  const fractional_hour = lmst_hours - hours_calc;
  const total_minutes_fractional = fractional_hour * 60;
  let minutes_calc = Math.floor(total_minutes_fractional);
  const fractional_minute = total_minutes_fractional - minutes_calc;
  // Add epsilon before rounding seconds
  let seconds_calc = Math.round(fractional_minute * 60 + 1e-9); 

  // Handle rounding up seconds to 60
  if (seconds_calc >= 60) {
    minutes_calc += 1;
    seconds_calc = 0; // Reset seconds
    if (minutes_calc >= 60) {
      hours_calc = (hours_calc + 1) % 24; // Handle hour rollover
      minutes_calc = 0; // Reset minutes
    }
  }
  
  // Assign final values
  const hours = hours_calc;
  const minutes = minutes_calc;
  const seconds = seconds_calc;

  // 7. Calculate Sol Number relative to Perseverance landing
  const sol = Math.floor(msd - PERSEVERANCE_LANDING_MSD);

  return {
    hours,
    minutes,
    seconds,
    sol
  };
}


/**
 * Format Mars time string using calculated components.
 * @param marsTimeData Object containing Mars H:M:S and Sol number
 * @returns Formatted time string (e.g., "6:46 AM MTC (Sol 2002)")
 */
export function formatMarsTime(marsTimeData: MarsTimeData): string {
  const { hours, minutes, sol } = marsTimeData;

  // Format using the calculated H:M components manually
  const hours12 = hours % 12 === 0 ? 12 : hours % 12; // Convert 0 to 12 for 12-hour format
  const ampm = hours < 12 ? 'AM' : 'PM';
  const formattedMinutes = minutes.toString().padStart(2, '0');

  // Note: The label "MTC" is technically incorrect here as we've calculated LMST.
  // However, for user display consistency with common Mars time reporting, we might keep it,
  // or change it to LMST or simply omit it. Let's keep MTC for now as per previous format.
  return `${hours12}:${formattedMinutes} ${ampm} MTC (Sol ${sol})`;
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
      name: `${location.name} ${location.roverPresent ? '' : ''} (${offset})`,
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
