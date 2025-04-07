const weatherCache: Record<string, { data: any; timestamp: number }> = {};
const newsCache: Record<string, { data: any; timestamp: number }> = {};

const WEATHER_TTL = 30 * 60 * 1000; // 30 minutes
const NEWS_TTL = 30 * 60 * 1000; // 30 minutes

const WEATHERAPI_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_KEY!;
const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY!;

export async function fetchWeather(city: string) {
  const now = Date.now();
  if (weatherCache[city] && now - weatherCache[city].timestamp < WEATHER_TTL) {
    return weatherCache[city].data;
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(city)}&aqi=no`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API error');
  const data = await res.json();

  const weatherData = {
    temperature: `${Math.round(data.current.temp_f)}°F`,
    condition: data.current.condition.text,
    iconUrl: `https:${data.current.condition.icon}`,
    forecast: '' // Placeholder, can extend with forecast API
  };

  weatherCache[city] = { data: weatherData, timestamp: now };
  return weatherData;
}

export async function fetchNews(city: string) {
  const now = Date.now();
  if (newsCache[city] && now - newsCache[city].timestamp < NEWS_TTL) {
    return newsCache[city].data;
  }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(city)}&apiKey=${NEWS_API_KEY}&pageSize=3&sortBy=publishedAt&language=en`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('News API error');
  const data = await res.json();

  const newsItems = (data.articles || []).map((article: any) => {
    // naive topic tagging based on keywords
    const topics: string[] = [];
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    if (text.includes('tech') || text.includes('ai') || text.includes('software') || text.includes('app')) topics.push('Technology');
    if (text.includes('sport') || text.includes('game') || text.includes('match') || text.includes('tournament')) topics.push('Sports');
    if (text.includes('politic') || text.includes('election') || text.includes('government') || text.includes('senate') || text.includes('president')) topics.push('Politics');
    if (text.includes('movie') || text.includes('music') || text.includes('celebrity') || text.includes('show') || text.includes('entertainment')) topics.push('Entertainment');
    if (text.includes('science') || text.includes('space') || text.includes('research') || text.includes('nasa')) topics.push('Science');

    return {
      title: article.title,
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      topics
    };
  });

  newsCache[city] = { data: newsItems, timestamp: now };
  return newsItems;
}
