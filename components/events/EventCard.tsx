import React from 'react';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface WeatherInfo {
  temperature: string;
  condition: string;
  iconUrl: string;
  forecast?: string;
}

interface EventData {
  timezone: string;
  city: string;
  offset: string;
  abbreviation: string;
  weather: WeatherInfo;
  news: NewsItem[];
}

export default function EventCard({ event }: { event: EventData }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-4 shadow-md border border-white/20 flex flex-col gap-4 transition hover:scale-[1.02] hover:shadow-lg">
      <div className="flex justify-between items-center border-b border-white/20 pb-2">
        <div>
          <h2 className="text-lg font-semibold">{event.city}</h2>
          <p className="text-sm text-gray-300">{event.abbreviation} (UTC{event.offset})</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/20 pb-2">
        <img src={event.weather.iconUrl} alt={event.weather.condition} className="w-12 h-12" />
        <div>
          <p className="text-xl font-bold">{event.weather.temperature}</p>
          <p className="text-sm">{event.weather.condition}</p>
          {event.weather.forecast && <p className="text-xs text-gray-400">{event.weather.forecast}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {event.news.map((item, idx) => (
          <a key={idx} href={item.url} className="text-sm hover:underline" target="_blank" rel="noopener noreferrer">
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-gray-400">{item.source} • {new Date(item.publishedAt).toLocaleTimeString()}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
