import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ChevronRight, Volume2 } from 'lucide-react';
import { useAppBranding } from '../hooks/useAppBranding';
import { getSeasonalThemeDetails } from '../utils/seasonalThemes';

export const FestiveCelebrationBanner: React.FC = () => {
  const { seasonal } = useAppBranding();
  const themeDetails = getSeasonalThemeDetails(seasonal);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check session dismissal state
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(`sc_festive_dismissed_${seasonal?.activeTheme}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      // Non-fatal
    }
  }, [seasonal?.activeTheme]);

  if (!themeDetails.isActive) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(`sc_festive_dismissed_${seasonal?.activeTheme}`, 'true');
    } catch {
      // Non-fatal
    }
  };

  const handleExpand = () => {
    setIsDismissed(false);
    try {
      sessionStorage.removeItem(`sc_festive_dismissed_${seasonal?.activeTheme}`);
    } catch {
      // Non-fatal
    }
  };

  // If dismissed, show a small, elegant festive pill badge that can be clicked to re-open
  if (isDismissed) {
    return (
      <div className="px-4 sm:px-5 mt-1.5 mb-1 animate-in fade-in">
        <button
          type="button"
          onClick={handleExpand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer group"
          style={{
            backgroundColor: `${themeDetails.accentColor}18`,
            borderColor: `${themeDetails.accentColor}40`,
            color: '#FFFFFF'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{themeDetails.theme.icon}</span>
            <span className="text-[11px] font-bold text-white tracking-wide">
              {themeDetails.theme.badgeLabel}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] opacity-80 group-hover:opacity-100" style={{ color: themeDetails.accentColor }}>
            <span>View greeting</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="px-4 sm:px-5 mt-2 mb-2 relative z-10"
      >
        <div
          className="relative overflow-hidden rounded-2xl p-4 border shadow-lg transition-all"
          style={{
            background: `linear-gradient(135deg, ${themeDetails.theme.gradientFrom} 0%, #03142F 60%, ${themeDetails.theme.gradientTo} 100%)`,
            borderColor: `${themeDetails.accentColor}45`,
            boxShadow: `0 8px 24px -4px ${themeDetails.accentColor}25`
          }}
        >
          {/* Subtle Ambient Decorative Glow */}
          <div
            className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none blur-2xl opacity-40"
            style={{ backgroundColor: themeDetails.accentColor }}
          />

          {/* Optional Festive Banner Image */}
          {themeDetails.bannerUrl && (
            <div className="mb-3 rounded-xl overflow-hidden max-h-36 w-full relative">
              <img
                src={themeDetails.bannerUrl}
                alt={themeDetails.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Top Row: Theme Badge + Dismiss Button */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase shadow-sm border"
              style={{
                backgroundColor: `${themeDetails.accentColor}25`,
                color: themeDetails.accentColor,
                borderColor: `${themeDetails.accentColor}50`
              }}
            >
              <span className="text-sm">{themeDetails.theme.icon}</span>
              <span>{themeDetails.theme.badgeLabel}</span>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Minimize festive greeting"
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Headline */}
          <h2 className="text-base sm:text-lg font-black text-white font-brand-sans leading-tight tracking-tight drop-shadow-sm mb-1">
            {themeDetails.title}
          </h2>

          {/* Celebratory Message */}
          <p className="text-xs sm:text-[13px] text-[#E2E8F0] font-medium leading-relaxed drop-shadow-sm">
            {themeDetails.greeting}
          </p>

          {/* Bottom subtle accent bar */}
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] text-white/70 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" style={{ color: themeDetails.accentColor }} />
              <span>Shendam Connect Celebration</span>
            </div>
            <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/30 text-white/80">
              Plateau State
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
