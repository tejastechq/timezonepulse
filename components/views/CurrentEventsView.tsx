import React from 'react';
import EventCard from '../events/EventCard';

const mockEvents = [
  {
    timezone: 'America/Chicago',
    city: 'Chicago',
    offset: '-05:00',
    abbreviation: 'CDT',
    weather: {
      temperature: '72°F',
      condition: 'Sunny',
      iconUrl: 'https://openweathermap.org/img/wn/01d.png',
      forecast: 'Clear skies throughout the day'
    },
    news: [
      {
        title: 'Local festival kicks off this weekend',
        url: '#',
        source: 'Chicago Tribune',
        publishedAt: '2025-04-07T10:00:00Z'
      },
      {
        title: 'New tech hub opens downtown',
        url: '#',
        source: 'TechCrunch',
        publishedAt: '2025-04-07T08:30:00Z'
      }
    ]
  },
  {
    timezone: 'Europe/London',
    city: 'London',
    offset: '+01:00',
    abbreviation: 'BST',
    weather: {
      temperature: '58°F',
      condition: 'Partly Cloudy',
      iconUrl: 'https://openweathermap.org/img/wn/03d.png',
      forecast: 'Clouds clearing by afternoon'
    },
    news: [
      {
        title: 'Parliament debates new bill',
        url: '#',
        source: 'BBC News',
        publishedAt: '2025-04-07T12:00:00Z'
      },
      {
        title: 'Major art exhibition opens',
        url: '#',
        source: 'The Guardian',
        publishedAt: '2025-04-07T09:15:00Z'
      }
    ]
  }
];

export default function CurrentEventsView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl">
      {mockEvents.map((event, idx) => (
        <EventCard key={idx} event={event} />
      ))}
    </div>
  );
}
