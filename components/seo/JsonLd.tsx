'use client';

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * JsonLd component for adding structured data to pages
 * This improves SEO by providing search engines with detailed information about page content
 *
 * @param {Object} data - The JSON-LD data to be rendered
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
} 