import React, { useState } from 'react';

/**
 * Image Optimizer Utility for Shendam Connect
 * Converts remote images (Unsplash) to optimized WebP format with target widths
 */
export function getOptimizedImageUrl(url: string, width: number = 600, quality: number = 75): string {
  if (!url) return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=75&fm=webp';
  
  if (url.includes('images.unsplash.com')) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('fit', 'crop');
      parsedUrl.searchParams.set('w', width.toString());
      parsedUrl.searchParams.set('q', quality.toString());
      parsedUrl.searchParams.set('fm', 'webp');
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }
  return url;
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  widthParam?: number;
  qualityParam?: number;
  className?: string;
  wrapperClassName?: string;
}

/**
 * High-performance Lazy Loaded Image component with Skeleton Shimmer Placeholder
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  widthParam = 600,
  qualityParam = 75,
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = error
    ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=75&fm=webp'
    : getOptimizedImageUrl(src, widthParam, qualityParam);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || 'w-full h-full'}`}>
      {/* Skeleton Pulse Loading State */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#08254D] via-[#0B2D5C] to-[#08254D] animate-pulse z-0" />
      )}

      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
