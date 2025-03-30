import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found - TimeZonePulse',
  robots: 'noindex, nofollow' // Prevent search engines from indexing error pages
};

/**
 * Custom 404 page with minimal information disclosure
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Page Not Found</h2>
      <p className="mb-8 max-w-md">
        The requested page could not be found.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        rel="nofollow"  // Prevent search engines from following links on error pages
      >
        Return Home
      </Link>
      
      {/* Add structured data to help search engines understand this is an error page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [{
              '@type': 'ListItem',
              position: 1,
              item: {
                '@id': '/',
                name: 'Home'
              }
            }, {
              '@type': 'ListItem',
              position: 2,
              item: {
                '@id': '#',
                name: '404 Not Found'
              }
            }]
          })
        }}
      />
    </div>
  );
}
