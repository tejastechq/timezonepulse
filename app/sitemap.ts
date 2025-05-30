import { MetadataRoute } from 'next';

/**
 * Sitemap generation for the TimeZonePulse application
 * This helps search engines discover and index all pages of the site
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.timezonepulse.com'; // Updated base URL
  
  // Default pages with static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    // Removed settings page entry
  ];
  return routes;
}
