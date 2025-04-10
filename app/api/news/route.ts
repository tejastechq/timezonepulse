import { NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(city)}&apiKey=${NEWS_API_KEY}&pageSize=3&sortBy=publishedAt&language=en`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`News API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    
    const newsItems = (data.articles || []).map((article: any) => {
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

    return NextResponse.json(newsItems);
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
} 