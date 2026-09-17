import React from 'react';
import { useAppBranding } from '../hooks/useAppBranding';
import { BrandLogoImage } from './BrandLogoImage';

interface ShendamLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ShendamLogo: React.FC<ShendamLogoProps> = ({ showText = true }) => {
  const { homepageLogo } = useAppBranding();

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Official Shendam Connect 3D Golden & Sapphire Emblem */}
      <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl overflow-hidden shadow-[0_4px_18px_rgba(8,120,209,0.38)] ring-1 ring-[#FFC928]/35 shrink-0 bg-[#04142F] flex items-center justify-center">
        <BrandLogoImage
          src={homepageLogo}
          alt="Shendam Connect"
          className="w-full h-full object-contain rounded-xl"
        />
      </div>

      {showText && (
        <div className="mt-1 flex flex-col items-center">
          {/* Main Title: SHENDAM */}
          <h1 className="text-[#FFC928] font-black text-xl sm:text-[22px] tracking-[0.16em] uppercase leading-none font-brand-sans drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
            SHENDAM
          </h1>

          {/* Subtitle: CONNECT */}
          <span className="text-white font-extrabold text-xs sm:text-[13px] tracking-[0.38em] uppercase leading-none mt-0.5 font-brand-sans">
            CONNECT
          </span>

          {/* Tagline: DISCOVER. CONNECT. EXPERIENCE. */}
          <p className="text-[#D5DCE8] text-[8px] sm:text-[8.5px] tracking-[0.22em] font-bold uppercase mt-1 opacity-85">
            DISCOVER. CONNECT. EXPERIENCE.
          </p>
        </div>
      )}
    </div>
  );
};
