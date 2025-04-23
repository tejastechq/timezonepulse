'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timezone, ViewMode } from '@/store/timezoneStore';
import { isInDST } from '@/lib/utils/timezone';
import { DateTime } from 'luxon';

interface TimezoneCardProps {
  timezone: Timezone;
  currentTime: Date;
  // viewMode: ViewMode; // Removed
  onRemove: (id: string) => void;
  highlightedTime: Date | null;
  timeSlots: Date[];
  onTimeSelect: (time: Date) => void;
  roundToNearestIncrement: (date: Date, increment: number) => Date;
}

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || '';
const SPORTS_API_KEY = '3'; // Use '3' for free tier/dev
const EPL_LEAGUE_ID = '4328'; // English Premier League as default

const NEWS_CATEGORIES = [
  { value: 'top', label: 'Top' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'health', label: 'Health' },
  { value: 'science', label: 'Science' },
  { value: 'entertainment', label: 'Entertainment' },
];
const SPORTS_LEAGUES = [
  { value: '4328', label: 'EPL' },
  { value: '4387', label: 'NBA' },
  { value: '4424', label: 'MLB' },
  { value: '4391', label: 'NFL' },
];

/**
 * Component for displaying a single timezone with a glassmorphism effect
 */
export default function TimezoneCard({
  timezone,
  currentTime,
  // viewMode, // Removed
  onRemove,
  highlightedTime,
  timeSlots,
  onTimeSelect,
  roundToNearestIncrement
}: TimezoneCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [activeTab, setActiveTab] = useState<'weather' | 'news' | 'sports'>('weather');
  
  // Weather state
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // News state
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Sports state
  const [sports, setSports] = useState<any[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [sportsError, setSportsError] = useState<string | null>(null);

  // Filter state
  const [newsCategory, setNewsCategory] = useState('top');
  const [sportsLeague, setSportsLeague] = useState(EPL_LEAGUE_ID);

  // Convert current time to the timezone
  const zonedTime = DateTime.fromJSDate(currentTime).setZone(timezone.id);
  
  // Check if the timezone is in DST
  const isDST = isInDST(timezone.id);
  
  // Determine if it's business hours (9 AM to 5 PM)
  const hour = zonedTime.hour;
  const isBusinessHours = hour >= 9 && hour < 17;
  
  // Determine if it's night time (8 PM to 6 AM)
  const isNightTime = hour >= 20 || hour < 6;
  
  // Format the date for display
  const dateDisplay = zonedTime.toFormat('EEE, MMM d');
  
  // Glass card classes
  const glassClasses = `glass-card ${isNightTime ? 'glass-card-dark' : 'glass-card-light'}`;

  // Reset loading/error/data state on tab/filter change
  useEffect(() => {
    if (activeTab === 'weather') {
      setWeatherError(null);
    } else if (activeTab === 'news') {
      setNewsError(null);
    } else if (activeTab === 'sports') {
      setSportsError(null);
    }
  }, [activeTab]);

  // Fetch weather data when events section is shown and Weather tab is active
  useEffect(() => {
    if (showEvents && activeTab === 'weather' && timezone.lat && timezone.lon) {
      setWeatherLoading(true);
      setWeatherError(null);
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${timezone.lat}&longitude=${timezone.lon}&current_weather=true`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.current_weather) {
            setWeather({
              temperature: data.current_weather.temperature,
              wind: data.current_weather.windspeed,
              condition: data.current_weather.weathercode, // Weather code, can be mapped to icon/description
              icon: null, // Placeholder for icon mapping
              humidity: data.current_weather.humidity // May not be present in all Open-Meteo responses
            });
          } else {
            setWeatherError('No weather data available.');
          }
        })
        .catch(() => setWeatherError('Failed to fetch weather data.'))
        .finally(() => setWeatherLoading(false));
    }
  }, [showEvents, activeTab, timezone.lat, timezone.lon]);

  // Fetch news data when events section is shown, News tab is active, or newsCategory changes
  useEffect(() => {
    if (showEvents && activeTab === 'news' && timezone.country) {
      setNewsLoading(true);
      setNewsError(null);
      fetch(
        `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=${timezone.country.toLowerCase()}&language=en&category=${newsCategory}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && Array.isArray(data.results)) {
            setNews(data.results);
          } else {
            setNewsError('No news data available.');
          }
        })
        .catch(() => setNewsError('Failed to fetch news data.'))
        .finally(() => setNewsLoading(false));
    }
  }, [showEvents, activeTab, timezone.country, newsCategory]);

  // Fetch sports data when events section is shown, Sports tab is active, or sportsLeague changes
  useEffect(() => {
    if (showEvents && activeTab === 'sports') {
      setSportsLoading(true);
      setSportsError(null);
      fetch(
        `https://www.thesportsdb.com/api/v1/json/${SPORTS_API_KEY}/eventspastleague.php?id=${sportsLeague}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.events && Array.isArray(data.events)) {
            setSports(data.events.slice(0, 10));
          } else {
            setSportsError('No sports data available.');
          }
        })
        .catch(() => setSportsError('Failed to fetch sports data.'))
        .finally(() => setSportsLoading(false));
    }
  }, [showEvents, activeTab, sportsLeague]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative p-4 rounded-lg ${glassClasses} 
        w-full max-w-[400px] min-w-[280px] mx-auto
        ${isBusinessHours ? 'border-l-4 border-green-500' : ''}
        ${isNightTime ? 'text-white' : 'text-gray-900 dark:text-white'}
        border-2 border-transparent transition-all duration-300 ease-in-out
        hover:border-yellow-400
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold">{(timezone.city || timezone.name).replace(/[()]/g, '')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{timezone.id}</p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {DateTime.now().setZone(timezone.id).offsetNameShort || DateTime.now().setZone(timezone.id).toFormat('ZZZZ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEvents((v) => !v)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary-500 transition-colors"
            aria-label={showEvents ? 'Hide events' : 'Show events'}
            tabIndex={0}
          >
            {showEvents ? (
        <div className="flex items-center">
          {isDST && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100 mr-2">
              DST
            </span>
          )}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-primary-500 transition-colors"
            aria-label="Options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Options dropdown */}
      {showOptions && (
        <div className="absolute right-4 top-12 z-10 glass-card glass-card-light dark:glass-card-dark rounded-md shadow-lg py-1">
          <button
            onClick={() => {
              onRemove(timezone.id);
              setShowOptions(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Remove
          </button>
        </div>
      )}
      
      <p className="text-sm mb-4">{dateDisplay}</p>
      
      {/* Clock display */}
      <div className="flex justify-center mb-4">
        {/* AnimatePresence for smooth transition */}
        <motion.div layout initial={false} animate={{ opacity: showEvents ? 0 : 1, height: showEvents ? 0 : 'auto' }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', width: '100%' }}>
          {/* Time increments list (only show when not showing events) */}
          {!showEvents && (
            <>
              <div className="w-full max-h-40 overflow-y-auto">
                {timeSlots.map((slot) => {
                  const slotInTimezone = DateTime.fromJSDate(slot).setZone(timezone.id);
                  
                  // Round the current time down to the nearest slot increment
                  const roundedCurrentTime = highlightedTime 
                    ? roundToNearestIncrement(highlightedTime, 30 * 60 * 1000) // Assuming 30 min increment
                    : null;

                  // Convert rounded time to the card's timezone for comparison
                  const roundedCurrentInTimezone = roundedCurrentTime
                    ? DateTime.fromJSDate(roundedCurrentTime).setZone(timezone.id)
                    : null;

                  // Check if the slot matches the rounded current time
                  const isHighlighted = roundedCurrentInTimezone && 
                    roundedCurrentInTimezone.hasSame(slotInTimezone, 'hour') && 
                    roundedCurrentInTimezone.hasSame(slotInTimezone, 'minute');
                  
                  return (
                    <button
                      key={slot.getTime()}
                      onClick={() => onTimeSelect(slot)}
                      style={isHighlighted ? { fontFamily: "'Space Grotesk', 'JetBrains Mono', monospace" } : {}}
                      className={`
                        w-full text-left px-2 py-1 rounded-md mb-1 transition-colors duration-150 ease-in-out
                        ${isHighlighted 
                          ? 'bg-primary-500 text-white text-2xl font-bold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {slotInTimezone.toFormat('HH:mm')}
                    </button>
                  );
                })}
              </div>
              {/* Show Events button for testing */}
              <button
                onClick={() => setShowEvents(true)}
                className="mt-4 w-full py-2 rounded-lg bg-primary-500 text-white font-semibold shadow hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                aria-label="Show events for this timezone"
              >
                Show Events
              </button>
            </>
          )}
        </motion.div>
        {/* Events section (show when showEvents is true) */}
        <motion.div layout initial={false} animate={{ opacity: showEvents ? 1 : 0, height: showEvents ? 'auto' : 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden', width: '100%' }}>
          {showEvents && (
            <div className="w-full flex flex-col items-center justify-center py-4">
              {/* Hide Events button for testing */}
              <button
                onClick={() => setShowEvents(false)}
                className="mb-4 w-full py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold shadow hover:bg-gray-400 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                aria-label="Hide events for this timezone"
              >
                Hide Events
              </button>
              {/* Tab Bar */}
              <div role="tablist" aria-label="Current Events Tabs" className="flex w-full justify-center gap-2 mb-2">
                <button
                  role="tab"
                  aria-selected={activeTab === 'weather'}
                  tabIndex={activeTab === 'weather' ? 0 : -1}
                  className={`px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'weather' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setActiveTab('weather')}
                >
                  <span role="img" aria-label="Weather" className="mr-1">☀️</span> Weather
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'news'}
                  tabIndex={activeTab === 'news' ? 0 : -1}
                  className={`px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'news' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setActiveTab('news')}
                >
                  <span role="img" aria-label="News" className="mr-1">📰</span> News
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'sports'}
                  tabIndex={activeTab === 'sports' ? 0 : -1}
                  className={`px-4 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeTab === 'sports' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setActiveTab('sports')}
                >
                  <span role="img" aria-label="Sports" className="mr-1">🏟️</span> Sports
                </button>
              </div>
              {/* Filter Bar */}
              <div className="flex w-full justify-center gap-4 mb-4">
                {activeTab === 'news' && (
                  <div>
                    <label htmlFor="filter-category" className="text-xs text-gray-500 dark:text-gray-400 mr-1">Category</label>
                    <select
                      id="filter-category"
                      className="rounded px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      value={newsCategory}
                      onChange={e => setNewsCategory(e.target.value)}
                    >
                      {NEWS_CATEGORIES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {activeTab === 'sports' && (
                  <div>
                    <label htmlFor="filter-league" className="text-xs text-gray-500 dark:text-gray-400 mr-1">League</label>
                    <select
                      id="filter-league"
                      className="rounded px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                      value={sportsLeague}
                      onChange={e => setSportsLeague(e.target.value)}
                    >
                      {SPORTS_LEAGUES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {/* Tab Content Area */}
              <div className="w-full flex flex-col items-center justify-center min-h-[80px]">
                {activeTab === 'weather' && (
                  <div className="w-full flex flex-col items-center">
                    {weatherLoading && <div className="text-gray-500">Loading weather...</div>}
                    {weatherError && <div className="text-red-600">{weatherError}</div>}
                    {!weatherLoading && !weatherError && weather && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                          {weather.temperature}&deg;C
                        </div>
                        <div className="text-lg text-gray-700 dark:text-gray-200">
                          {/* Map weather code to description if desired */}
                          Condition code: {weather.condition}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Wind: {weather.wind} km/h
                        </div>
                        {weather.humidity !== undefined && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Humidity: {weather.humidity}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'news' && (
                  <div className="w-full flex flex-col items-center">
                    {newsLoading && <div className="text-gray-500">Loading news...</div>}
                    {newsError && <div className="text-red-600">{newsError}</div>}
                    {!newsLoading && !newsError && news && news.length > 0 && (
                      <ul className="w-full max-w-md divide-y divide-gray-200 dark:divide-gray-700">
                        {news.map((article, idx) => (
                          <li key={idx} className="py-2">
                            <a href={article.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 dark:text-primary-300 hover:underline">
                              {article.title}
                            </a>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {article.source_id || article.creator?.[0] || 'Unknown Source'}
                              {article.pubDate && (
                                <span> &middot; {new Date(article.pubDate).toLocaleString()}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!newsLoading && !newsError && (!news || news.length === 0) && (
                      <div className="text-gray-500">No news found for this region.</div>
                    )}
                  </div>
                )}
                {activeTab === 'sports' && (
                  <div className="w-full flex flex-col items-center">
                    {sportsLoading && <div className="text-gray-500">Loading sports events...</div>}
                    {sportsError && <div className="text-red-600">{sportsError}</div>}
                    {!sportsLoading && !sportsError && sports && sports.length > 0 && (
                      <ul className="w-full max-w-md divide-y divide-gray-200 dark:divide-gray-700">
                        {sports.map((event, idx) => (
                          <li key={event.idEvent || idx} className="py-2">
                            <div className="font-semibold text-primary-600 dark:text-primary-300">
                              {event.strEvent}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {event.strLeague} &middot; {event.dateEvent} {event.strTime}
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-200">
                              {event.strHomeTeam} {event.intHomeScore !== null ? event.intHomeScore : ''}
                              {event.intHomeScore !== null && event.intAwayScore !== null ? ' - ' : ''}
                              {event.strAwayTeam} {event.intAwayScore !== null ? event.intAwayScore : ''}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!sportsLoading && !sportsError && (!sports || sports.length === 0) && (
                      <div className="text-gray-500">No sports events found.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Status indicators */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {isBusinessHours ? 'Business Hours' : isNightTime ? 'Night Time' : 'Off Hours'}
        </span>
        <span>
          {zonedTime.toFormat('ZZZZ')}
        </span>
      </div>
    </motion.div>
  );
}
