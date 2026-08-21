import React, { useState } from 'react';
import shendamLogoImg from '../assets/shendam_logo.jpg';

interface ShendamLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ShendamLogo: React.FC<ShendamLogoProps> = ({ showText = true }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      {/* Official Shendam Connect 3D Golden & Sapphire 'S' Emblem */}
      <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(8,120,209,0.35)] ring-1 ring-[#FFC928]/30 shrink-0 bg-[#04142F] flex items-center justify-center">
        {!imgError ? (
          <img
            src={shendamLogoImg}
            alt="Shendam Connect"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain rounded-xl"
          />
        ) : (
          <div className="w-full h-full bg-[#04142F] flex items-center justify-center p-2.5 text-[#FFC928]">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
              <path d="M50 10 C30 10 20 25 20 40 C20 60 80 50 80 75 C80 90 65 95 50 95 C35 95 20 85 20 70 L32 70 C32 80 40 85 50 85 C62 85 68 78 68 72 C68 58 10 65 10 38 C10 20 28 10 50 10 Z" />
              <circle cx="50" cy="20" r="8" fill="#0878D1" />
            </svg>
          </div>
        )}
      </div>

      {showText && (
        <>
          {/* Main Title: SHENDAM */}
          <h1 className="text-[#FFC928] font-black text-2xl sm:text-[27px] tracking-[0.14em] uppercase leading-none mt-1.5 font-brand-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            SHENDAM
          </h1>

          {/* Subtitle: CONNECT */}
          <span className="text-[#FFFFFF] font-bold text-base sm:text-[17px] tracking-[0.38em] uppercase leading-none mt-1 font-brand-sans">
            CONNECT
          </span>

          {/* Tagline: DISCOVER. CONNECT. EXPERIENCE. */}
          <p className="text-[#D5DCE8] text-[9px] tracking-[0.22em] font-semibold uppercase mt-1.5 opacity-90">
            DISCOVER. CONNECT. EXPERIENCE.
          </p>
        </>
      )}
    </div>
  );
};


