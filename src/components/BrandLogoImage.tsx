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

  return (
    <img
      {...props}
      src={hasError ? fallbackSrc : currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setCurrentSrc(fallbackSrc);
        }
      }}
      className={className}
    />
  );
};
