import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppBranding } from '../hooks/useAppBranding';
import { BrandLogoImage } from './BrandLogoImage';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { splashLogo } = useAppBranding();

  // Show for 2.5 seconds on app start if onFinish callback is provided
  useEffect(() => {
    if (onFinish) {
      const timer = setTimeout(() => {
        onFinish();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [onFinish]);

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
          <BrandLogoImage
            src={splashLogo}
            alt="Shendam Connect Official Logo"
            className="w-full h-full object-contain rounded-2xl"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
