'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallback?: string;
  wrapperClassName?: string;
}

/**
 * OptimizedImage component with blur-up loading and fallback support
 * This component enhances the Next.js Image component with better loading UX
 * 
 * @param {string} src - The image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} fallback - Optional fallback image URL
 * @param {string} wrapperClassName - Optional class for the wrapper div
 * @param {object} ...props - Other Image props
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallback,
  wrapperClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true);
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  // Handle image load error
  const handleError = () => {
    setHasError(true);
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <div className={cn('relative overflow-hidden', wrapperClassName)}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError ? 'grayscale bg-gray-100 dark:bg-gray-800' : '',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        sizes={props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        quality={props.quality || 90}
        priority={props.priority}
        {...props}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" 
          aria-hidden="true"
        />
      )}
    </div>
  );
} 