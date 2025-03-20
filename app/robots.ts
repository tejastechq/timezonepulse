import { MetadataRoute } from 'next';

/**
 * Robots configuration for search engine crawling
 * This helps search engines understand which parts of the site to crawl and index
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/*', '/settings/admin'],
    },
    sitemap: 'https://worldclock.app/sitemap.xml',
  };
} 