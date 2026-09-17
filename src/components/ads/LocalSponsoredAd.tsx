import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ExternalLink,
  MessageCircle,
  Phone,
  Store,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Advertisement } from '../../types';
import { fetchPublicAds, recordAdClick, recordAdImpression } from '../../services/adService';

interface LocalSponsoredAdProps {
  placement: string;
  variant?: 'card' | 'compact' | 'banner';
  className?: string;
  onSelectPlace?: (placeId: string) => void;
}

export const LocalSponsoredAd: React.FC<LocalSponsoredAdProps> = ({
  placement,
  variant = 'banner',
  className = '',
  onSelectPlace
}) => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const recordedImpressionsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVisibleInViewportRef = useRef(false);

  // Touch Swipe coordinates
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  // Fetch advertisements for this placement
  useEffect(() => {
    let isMounted = true;
    async function loadAds() {
      const fetchedAds = await fetchPublicAds(placement);
      if (isMounted) {
        setAds(fetchedAds);
        setCurrentIndex(0);
      }
    }
    loadAds();
    return () => {
      isMounted = false;
    };
  }, [placement]);

  const currentAd = ads[currentIndex] || ads[0] || null;

  // Viewport-based impression recording using IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || ads.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries[0].isIntersecting;
        isVisibleInViewportRef.current = isIntersecting;
        if (isIntersecting && currentAd && !recordedImpressionsRef.current.has(currentAd.id)) {
          recordAdImpression(currentAd.id);
          recordedImpressionsRef.current.add(currentAd.id);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ads.length, currentAd]);

  // Record impression when slide changes while visible in viewport
  useEffect(() => {
    if (isVisibleInViewportRef.current && currentAd && !recordedImpressionsRef.current.has(currentAd.id)) {
      recordAdImpression(currentAd.id);
      recordedImpressionsRef.current.add(currentAd.id);
    }
  }, [currentAd]);

  // Carousel Navigation Helpers
  const nextSlide = useCallback(() => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const prevSlide = useCallback(() => {
    if (ads.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Automatic slide rotation every 5 seconds (paused on interaction)
  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [ads.length, isPaused, nextSlide]);

  // Touch handlers for mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (ads.length <= 1) return;
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;

    // If moving predominantly horizontally, record delta
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      touchDeltaXRef.current = deltaX;
    }
  };

  const handleTouchEnd = () => {
    if (ads.length > 1 && touchStartXRef.current !== null) {
      const deltaX = touchDeltaXRef.current;
      const swipeThreshold = 40; // min 40px swipe

      if (deltaX < -swipeThreshold) {
        nextSlide();
      } else if (deltaX > swipeThreshold) {
        prevSlide();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;

    // Resume auto slide after brief pause
    setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (ads.length <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  // Click & Action dispatcher
  const handleAdClick = (e: React.MouseEvent, ad: Advertisement) => {
    // Prevent triggering when clicking navigation buttons
    const target = e.target as HTMLElement;
    if (target.closest('button.ad-nav-btn') || target.closest('button.ad-dot-btn')) {
      return;
    }

    recordAdClick(ad.id);

    // Destination handling
    if (ad.destinationType === 'listing' && (ad.destinationListingId || ad.linkedPlaceId) && onSelectPlace) {
      e.preventDefault();
      onSelectPlace(ad.destinationListingId || ad.linkedPlaceId || '');
      return;
    }

    if (ad.destinationType === 'whatsapp' || (ad.destinationWhatsApp && !ad.destinationPhone && !ad.destinationUrl)) {
      const num = (ad.destinationWhatsApp || '').replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`Hello ${ad.businessName}, I saw your advertisement on Shendam Connect.`);
      window.open(`https://wa.me/${num}?text=${text}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (ad.destinationType === 'phone' || (ad.destinationPhone && !ad.destinationUrl)) {
      window.location.href = `tel:${ad.destinationPhone}`;
      return;
    }

    const targetUrl = ad.destinationUrl || ad.linkUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // If no advertisements exist in database, return null (no fake ads shown)
  if (!currentAd || ads.length === 0) {
    return null;
  }

  // ============================================================================
  // COMPACT VARIANT (for directory lists or category sidebars)
  // ============================================================================
  if (variant === 'compact') {
    return (
      <div
        ref={containerRef}
        onClick={(e) => handleAdClick(e, currentAd)}
        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#04142F] to-[#0A2540] border border-amber-500/20 p-4 shadow-lg hover:border-amber-400/40 transition-all cursor-pointer ${className}`}
        id={`ad-${currentAd.id}-compact`}
      >
        <div className="flex items-center gap-3">
          {currentAd.imageUrl && (
            <img
              src={currentAd.imageUrl}
              alt={currentAd.title}
              loading="lazy"
              className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sponsored
              </span>
              <span className="text-xs font-semibold text-slate-300 truncate">{currentAd.businessName}</span>
            </div>
            <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
              {currentAd.title}
            </h4>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CARD VARIANT (vertical grid)
  // ============================================================================
  if (variant === 'card') {
    return (
      <div
        ref={containerRef}
        onClick={(e) => handleAdClick(e, currentAd)}
        className={`group relative overflow-hidden rounded-2xl bg-[#04142F] border border-amber-500/20 shadow-xl hover:border-amber-400/50 hover:shadow-2xl transition-all cursor-pointer flex flex-col ${className}`}
        id={`ad-${currentAd.id}-card`}
      >
        {/* Visual Creative */}
        {(currentAd.bannerImageUrl || currentAd.imageUrl) && (
          <div className="relative h-44 w-full overflow-hidden bg-slate-900 shrink-0">
            <img
              src={currentAd.bannerImageUrl || currentAd.imageUrl}
              alt={currentAd.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#04142F] via-transparent to-black/30" />
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Sponsored
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-amber-400/90 flex items-center gap-1 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {currentAd.businessName}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
              {currentAd.title}
            </h3>
            {currentAd.description && (
              <p className="text-xs md:text-sm text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {currentAd.description}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
            <span className="flex items-center gap-1.5">
              {currentAd.destinationType === 'whatsapp' ? (
                <>
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Contact on WhatsApp</span>
                </>
              ) : currentAd.destinationType === 'phone' ? (
                <>
                  <Phone className="w-4 h-4 text-sky-400" />
                  <span>Call Merchant</span>
                </>
              ) : currentAd.destinationType === 'listing' ? (
                <>
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Explore Place</span>
                </>
              ) : (
                <>
                  <span>Visit Offer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </span>
            <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // BANNER CAROUSEL VARIANT (Default on Homepage & Featured Sections)
  // ============================================================================
  const bannerBg = currentAd.bannerImageUrl || currentAd.imageUrl;
  const hasMultipleAds = ads.length > 1;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promoted Advertisements Carousel"
      className={`relative w-full select-none outline-none ${className}`}
      id="shendam-promoted-carousel"
    >
      {/* Main Banner Card */}
      <div
        onClick={(e) => handleAdClick(e, currentAd)}
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#04142F] border border-amber-500/25 p-4 sm:p-5 md:p-6 shadow-xl hover:border-amber-400/50 transition-all cursor-pointer min-h-[140px] sm:min-h-[160px] flex flex-col justify-center"
      >
        {/* Background Visual Creative */}
        {bannerBg && (
          <div className="absolute inset-0 z-0 opacity-20 sm:opacity-25 group-hover:opacity-30 transition-opacity duration-500">
            <img
              key={currentAd.id}
              src={bannerBg}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover animate-in fade-in duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#04142F] via-[#04142F]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#04142F] via-transparent to-black/20" />
          </div>
        )}

        {/* Card Content & Action Area */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pl-8 sm:pl-10 pr-8 sm:pr-10">
          <div className="max-w-xl sm:max-w-2xl w-full">
            {/* Tagline & Business Name */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3 h-3 text-amber-400" /> Promoted
              </span>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{currentAd.businessName}</span>
              </span>
            </div>

            {/* Ad Headline */}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
              {currentAd.title}
            </h3>

            {/* Ad Description */}
            {currentAd.description && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {currentAd.description}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-1 sm:pt-0 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              {currentAd.destinationType === 'whatsapp' ? (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </>
              ) : currentAd.destinationType === 'phone' ? (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </>
              ) : currentAd.destinationType === 'listing' ? (
                <>
                  <Store className="w-4 h-4" />
                  <span>View Listing</span>
                </>
              ) : (
                <>
                  <span>Learn More</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Left / Right Carousel Navigation Arrows */}
        {/* =================================================================== */}
        {hasMultipleAds && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous advertisement"
              className="ad-nav-btn absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#04142F]/80 hover:bg-[#08254D] active:scale-90 text-white hover:text-amber-300 border border-white/20 hover:border-amber-400/50 backdrop-blur-md flex items-center justify-center shadow-lg transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next advertisement"
              className="ad-nav-btn absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#04142F]/80 hover:bg-[#08254D] active:scale-90 text-white hover:text-amber-300 border border-white/20 hover:border-amber-400/50 backdrop-blur-md flex items-center justify-center shadow-lg transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </>
        )}
      </div>

      {/* =================================================================== */}
      {/* Dot Indicators */}
      {/* =================================================================== */}
      {hasMultipleAds && (
        <div className="flex items-center justify-center gap-1.5 pt-2.5 pb-1">
          {ads.map((adItem, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={adItem.id || idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                aria-label={`Go to advertisement ${idx + 1}: ${adItem.businessName}`}
                className={`ad-dot-btn transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-[#FFC928] rounded-full shadow-sm'
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/35 hover:bg-white/70 rounded-full'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocalSponsoredAd;
