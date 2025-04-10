import { NextResponse } from 'next/server';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
  }

  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Weather API responded with status: ${res.status}`);
    }
    
    const data = await res.json();

    const weatherData = {
      temperature: `${Math.round(data.current.temp_f)}°F`,
      condition: data.current.condition.text,
      iconUrl: `https:${data.current.condition.icon}`,
      forecast: '' // Placeholder, can extend with forecast API
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
} 