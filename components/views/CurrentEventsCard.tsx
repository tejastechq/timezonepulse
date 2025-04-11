'use client';

import React, { useEffect, useState, useRef } from 'react';
import { DateTime } from 'luxon';
import Image from 'next/image';
import { X, ChevronDown } from 'lucide-react'; // Added ChevronDown
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion'; // Added framer-motion

// Types
import { Timezone } from '@/store/timezoneStore';

// WeatherCard and NewsList will be created below as stubs for now
function WeatherCard({ weather }: { weather: any }) {
  if (!weather) return <div className="text-gray-500">No weather data.</div>;
  return (
    <div className="flex items-center gap-3">
      {weather.icon && (
        <Image src={weather.icon} alt={weather.description || 'Weather'} width={40} height={40} />
      )}
      <div>
        <div className="font-semibold text-lg">{weather.temp ? `${weather.temp}°` : ''}</div>
        <div className="text-sm text-gray-600">{weather.description}</div>
      </div>
    </div>
  );
}

function NewsList({ news }: { news: any[] }) {
  if (!news || news.length === 0) return <div className="text-gray-500">No news articles found.</div>;
  return (
    <ul className="space-y-2">
      {news.map((article, idx) => (
        <li key={idx} className="bg-gray-50 rounded p-3 shadow">
          <div className="font-bold">{article.title}</div>
          <div className="text-sm text-gray-600">{article.source?.name}</div>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Read more</a>
        </li>
      ))}
    </ul>
  );
}

interface CurrentEventsCardProps {
  timezone: Timezone;
  userLocalTimezone: string;
  onRemove?: (id: string) => void;
}

const CurrentEventsCard: React.FC<CurrentEventsCardProps> = ({ timezone, userLocalTimezone, onRemove }) => {
  const [weather, setWeather] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false); // State for weather collapse
  const [isNewsOpen, setIsNewsOpen] = useState(false); // State for news collapse

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const weatherRes = await fetch(`/api/weather?timezone=${encodeURIComponent(timezone.id)}`);
        const weatherData = await weatherRes.json();

        const newsRes = await fetch(`/api/news?timezone=${encodeURIComponent(timezone.id)}`);
        const newsData = await newsRes.json();

        if (!cancelled) {
          setWeather(weatherData);
          setNews(newsData.articles || []);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load weather or news data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [timezone.id]);

  // Card header: name, offset, remove button, flag/city icon, live time
  const [now, setNow] = useState(() => DateTime.now().setZone(timezone.id));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const offset = now.toFormat('ZZ');
  const isMars = timezone.id.startsWith('Mars/');

  // Emoji flag fallback (simple country code to flag emoji)
  function getFlagEmoji(country?: string) {
    if (!country) return "🌐";
    // Only works for 2-letter country codes
    if (country.length === 2) {
      // Use Array.from for compatibility with ES5/ES2015 targets
      return String.fromCodePoint(...Array.from(country.toUpperCase()).map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
    }
    // Fallback for common names
    if (country.toLowerCase().includes("united states")) return "🇺🇸";
    if (country.toLowerCase().includes("united kingdom")) return "🇬🇧";
    if (country.toLowerCase().includes("japan")) return "🇯🇵";
    if (country.toLowerCase().includes("france")) return "🇫🇷";
    if (country.toLowerCase().includes("germany")) return "🇩🇪";
    if (country.toLowerCase().includes("china")) return "🇨🇳";
    if (country.toLowerCase().includes("india")) return "🇮🇳";
    return "🌐";
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNow(DateTime.now().setZone(timezone.id));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timezone.id]);

  return (
    <div
      className={clsx(
        "bg-white/30 dark:bg-gray-800/40 backdrop-blur-lg rounded-xl overflow-hidden shadow-2xl border-2 border-primary-100/40 dark:border-primary-900/40 flex flex-col transition-transform duration-200",
        "min-w-[280px] group hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
      )}
      style={{
        backgroundImage: isMars
          ? 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.03))'
          : 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.13), rgba(59, 130, 246, 0.03))'
      }}
      data-timezone-id={timezone.id}
      tabIndex={0}
      aria-label={`Card for ${timezone.city || timezone.name}`}
    >
      <div className="p-4 border-b-2 border-primary-100/30 dark:border-primary-900/30 flex justify-between items-center relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2">
            {/* Flag or Mars icon */}
            {isMars ? (
              <span className="inline-block" title="Mars Time">
                <Image src="/mars.png" alt="Mars" width={20} height={20} className="inline-block w-5 h-5 align-text-bottom" />
              </span>
            ) : (
              <span className="text-2xl mr-1" aria-label="Country flag">{getFlagEmoji(timezone.country)}</span>
            )}
            <h3 className={clsx(
              "text-lg font-semibold flex items-center",
              isMars ? "text-red-600 dark:text-red-400" : "text-primary-700 dark:text-primary-300"
            )}>
              <span className="truncate">{(timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name).replace(/[()]/g, '').replace(/[-+]\d{2}:\d{2}/, '')}</span>
            </h3>
            {/* Relative Offset Badge */}
            <span className="ml-2 text-xs font-medium text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {(() => {
                  const localOffset = DateTime.now().setZone(userLocalTimezone).offset;
                  const tzOffset = DateTime.now().setZone(timezone.id).offset;
                  const diffMinutes = tzOffset - localOffset;
                  const sign = diffMinutes >= 0 ? '+' : '-';
                  const absMinutes = Math.abs(diffMinutes);
                  const hours = Math.floor(absMinutes / 60).toString().padStart(2, '0');
                  const minutes = (absMinutes % 60).toString().padStart(2, '0');
                  // Avoid showing +00:00 for the user's own timezone
                  if (hours === '00' && minutes === '00') return 'Local'; 
                  return `${sign}${hours}:${minutes}`;
                })()}
            </span>
          </div>
          {/* Live local time */}
          <div className="text-2xl font-mono font-bold mt-1 text-primary-900 dark:text-primary-200" aria-label="Current local time">
            {now.toFormat('HH:mm:ss')}
          </div>
          <div className="text-xs text-gray-500 mt-1">{timezone.id}</div>
        </div>
        {onRemove && timezone.id !== userLocalTimezone && (
          <button
            onClick={() => onRemove(timezone.id)}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors transform hover:scale-110 active:scale-95"
            aria-label={`Remove timezone ${(timezone.name.split('/').pop()?.replace('_', ' ') || timezone.name).replace(/[()]/g, '')}`}
            tabIndex={0}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2 p-4">
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        {!loading && !error && (
          <>
            {/* Collapsible Weather Section */}
            <CollapsibleSection label="Weather" isOpen={isWeatherOpen} onToggle={() => setIsWeatherOpen(!isWeatherOpen)}>
              <WeatherCard weather={weather} />
            </CollapsibleSection>

            {/* Collapsible News Section */}
            <CollapsibleSection label="News" isOpen={isNewsOpen} onToggle={() => setIsNewsOpen(!isNewsOpen)}>
              <NewsList news={news} />
            </CollapsibleSection>
          </>
        )}
      </div>
      {/* Removed absolute offset display */}
    </div>
  );
};

// Simple Collapsible Section Component
interface CollapsibleSectionProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ label, isOpen, onToggle, children }) => {
  return (
    <div className="border-t border-primary-100/30 dark:border-primary-900/30 pt-2">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full py-2 font-medium text-left text-primary-800 dark:text-primary-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <ChevronDown
          className={clsx(
            "h-5 w-5 transition-transform duration-200",
            isOpen ? "transform rotate-180" : ""
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="pb-2 pt-1"> {/* Added padding */}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default CurrentEventsCard;
