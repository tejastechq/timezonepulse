'use client';

import React, { useEffect, useState } from 'react';
import EventCard from '../events/EventCard';
import { fetchWeather, fetchNews } from '../../lib/utils/apiFetchers';

interface EventData {
  timezone: string;
  city: string;
  offset: string;
  abbreviation: string;
  weather: {
    temperature: string;
    condition: string;
    iconUrl: string;
    forecast?: string;
  };
  news: {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
  }[];
}

const cities = [
  { city: 'Chicago', timezone: 'America/Chicago', offset: '-05:00', abbreviation: 'CDT' },
  { city: 'London', timezone: 'Europe/London', offset: '+01:00', abbreviation: 'BST' }
];

export default function CurrentEventsView() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const results: EventData[] = [];
      for (const c of cities) {
        try {
          const [weather, news] = await Promise.all([
            fetchWeather(c.city),
            fetchNews(c.city)
          ]);
          results.push({
            ...c,
            weather,
            news
          });
        } catch (e) {
          console.error('Error fetching data for', c.city, e);
        }
      }
      setEvents(results);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="text-center w-full">Loading current events...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
      {events.map((event, idx) => (
        <EventCard key={idx} event={event} />
      ))}
    </div>
  );
}
