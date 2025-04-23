# Tech Context

timestamp: 2024-06-09T00:00:00Z

## Core Technologies
- Next.js (inferred from app/ structure and file naming)
- React (UI components)
- TypeScript (type safety)
- Tailwind CSS (tailwind.config.js present)
- Node.js (package.json, server-side logic)

## Key Dependencies (to be expanded)
- State management (custom store)
- Utility libraries (timezone-utils, utils)
- Static asset handling (public/)

## To be updated as more dependencies are discovered.

## API & Environment Setup for Timezone Events Feature

### Weather: Open-Meteo
- No API key required
- Global, free, production-ready
- API endpoint example:
  `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true`

### News: NewsData.io
- Requires API key
- Environment variable: `NEWS_API_KEY`
- Set in both `.env.local` and `.env.production`
- Example endpoint:
  `https://newsdata.io/api/1/news?apikey=$NEWS_API_KEY&country=us&category=technology`

### Sports: TheSportsDB
- Free test key: `3` (for development)
- Production key: `pub_82638261d3f5420abe0917997f1c9a9b2a73e` (or your premium key)
- Example endpoint:
  `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328` 