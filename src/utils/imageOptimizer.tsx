import React, { useState } from 'react';
import { ImageOff, Building2 } from 'lucide-react';

/**
 * Image Optimizer Utility for Shendam Connect
 * Converts remote images (Unsplash) to optimized WebP format with target widths
 */
export function getOptimizedImageUrl(url: string, width: number = 600, quality: number = 75): string {
  if (!url) return '';
  
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
  src?: string;
  alt: string;
  widthParam?: number;
  qualityParam?: number;
  className?: string;
  wrapperClassName?: string;
}

/**
 * High-performance Lazy Loaded Image component with Skeleton Shimmer Placeholder
 * Displays a clean, neutral "No Image Available" placeholder when image is absent or errors
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

  if (!src || !src.trim()) {
    return (
      <div 
        role="img"
        aria-label={`No image available for ${alt}`}
        className={`relative overflow-hidden bg-gradient-to-br from-[#08254D] to-[#0B2D5C] flex flex-col items-center justify-center text-center p-2 border border-white/5 select-none ${wrapperClassName || 'w-full h-full'}`}
      >
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9BAABD] mb-1">
          <Building2 className="w-4 h-4 opacity-70" />
        </div>
        <span className="text-[9px] text-[#9BAABD]/80 font-medium tracking-wide">
          No Image Available
        </span>
      </div>
    );
  }

  const optimizedSrc = error ? '' : getOptimizedImageUrl(src, widthParam, qualityParam);

  if (error || !optimizedSrc) {
    return (
      <div 
        role="img"
        aria-label={`No image available for ${alt}`}
        className={`relative overflow-hidden bg-gradient-to-br from-[#08254D] to-[#0B2D5C] flex flex-col items-center justify-center text-center p-2 border border-white/5 select-none ${wrapperClassName || 'w-full h-full'}`}
      >
        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9BAABD] mb-1">
          <ImageOff className="w-4 h-4 opacity-70" />
        </div>
        <span className="text-[9px] text-[#9BAABD]/80 font-medium tracking-wide">
          No Image Available
        </span>
      </div>
    );
  }

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
