import React, { useState, useEffect } from 'react';
import defaultLogoImg from '../assets/shendam_logo.jpg';

interface BrandLogoImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
}

export const BrandLogoImage: React.FC<BrandLogoImageProps> = ({
  src,
  alt = 'Shendam Connect',
  fallbackSrc = defaultLogoImg,
  className = '',
  ...props
}) => {
  const effectiveSrc = src && src.trim() !== '' ? src : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(effectiveSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setCurrentSrc(effectiveSrc);
  }, [effectiveSrc]);

  const handleError = () => {
    if (hasError) return;

    // 1. If /uploads/ failed, attempt /api/uploads/
    if (typeof currentSrc === 'string' && currentSrc.startsWith('/uploads/') && !currentSrc.startsWith('/api/uploads/')) {
      setCurrentSrc('/api' + currentSrc);
      return;
    }

    // 2. If it's a header or splash logo, check if a valid data URI was saved in localStorage
    try {
      const isSplash = (alt || '').toLowerCase().includes('splash') || (className || '').includes('splash');
      const localDataUri = isSplash
        ? localStorage.getItem('scSplashLogo')
        : localStorage.getItem('scHeaderLogo');
      
      if (localDataUri && localDataUri.startsWith('data:image/') && localDataUri !== currentSrc) {
        setCurrentSrc(localDataUri);
        return;
      }
    } catch {
      // Non-fatal
    }

    // 3. Fallback to default bundled logo image
    setHasError(true);
    setCurrentSrc(fallbackSrc);
  };

  return (
    <img
      {...props}
      src={hasError ? fallbackSrc : currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
};
