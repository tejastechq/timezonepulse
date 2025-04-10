const weatherCache: Record<string, { data: any; timestamp: number }> = {};
const newsCache: Record<string, { data: any; timestamp: number }> = {};

const WEATHER_TTL = 30 * 60 * 1000; // 30 minutes
const NEWS_TTL = 30 * 60 * 1000; // 30 minutes

export async function fetchWeather(city: string) {
  const now = Date.now();
  if (weatherCache[city] && now - weatherCache[city].timestamp < WEATHER_TTL) {
    return weatherCache[city].data;
  }

  const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error('Weather API error');
  const weatherData = await res.json();

  if ('error' in weatherData) {
    throw new Error(weatherData.error);
  }

  weatherCache[city] = { data: weatherData, timestamp: now };
  return weatherData;
}

export async function fetchNews(city: string) {
  const now = Date.now();
  if (newsCache[city] && now - newsCache[city].timestamp < NEWS_TTL) {
    return newsCache[city].data;
  }

  const res = await fetch(`/api/news?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error('News API error');
  const newsItems = await res.json();

  if ('error' in newsItems) {
    throw new Error(newsItems.error);
  }

  newsCache[city] = { data: newsItems, timestamp: now };
  return newsItems;
}
