import React, { useState } from 'react';
import { motion } from 'motion/react';
import shendamLogoImg from '../assets/shendam_logo.jpg';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      key="shendam-splash-screen"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.02,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020B18] select-none overflow-hidden p-6"
      style={{
        background: 'radial-gradient(circle at 50% 50%, #052046 0%, #020B18 75%)'
      }}
    >
      {/* CENTER: Exact App Logo Image Locked - Source of Truth */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Halo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.35, 0.75, 0.45], scale: [0.9, 1.08, 0.95] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(8, 120, 209, 0.4) 0%, rgba(255, 201, 40, 0.2) 50%, transparent 70%)',
            filter: 'blur(36px)'
          }}
        />

        {/* Exact Logo Image Container - Object Contain Preserves 100% Aspect Ratio */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1]
          }}
          className="relative w-48 h-48 sm:w-60 sm:h-60 max-w-[75vw] max-h-[75vh] rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(8,120,209,0.45)] ring-1 ring-[#FFC928]/40 bg-[#04142F] flex items-center justify-center p-1"
        >
          {!imgError ? (
            <img
              src={shendamLogoImg}
              alt="Shendam Connect Official Logo"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain rounded-2xl"
            />
          ) : (
            /* Fallback Local Asset / SVG Emblem */
            <div className="w-full h-full bg-[#04142F] flex items-center justify-center p-4 text-[#FFC928]">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                <path d="M50 10 C30 10 20 25 20 40 C20 60 80 50 80 75 C80 90 65 95 50 95 C35 95 20 85 20 70 L32 70 C32 80 40 85 50 85 C62 85 68 78 68 72 C68 58 10 65 10 38 C10 20 28 10 50 10 Z" />
                <circle cx="50" cy="20" r="8" fill="#0878D1" />
              </svg>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};


