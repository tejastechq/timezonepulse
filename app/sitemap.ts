import { MetadataRoute } from 'next';

/**
 * Sitemap generation for the World Clock application
 * This helps search engines discover and index all pages of the site
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://worldclock.app';
  
  // Default pages with static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];
  
  return routes;
} 