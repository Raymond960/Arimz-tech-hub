import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { HeroSlide, CategoryId } from '../types';
import { LazyImage } from '../utils/imageOptimizer';

interface HeroCarouselProps {
  slides: HeroSlide[];
  onExplore: (categoryTarget?: CategoryId) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides, onExplore }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide] || slides[0];

  return (
    <div className="w-full px-4 sm:px-5 mt-5 z-10 hero-carousel-container">
      <div className="relative w-full h-52 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/16 shadow-[0_8px_30px_rgba(0,0,0,0.45)] group">
        {/* Background Image if uploaded */}
        {slide.image && slide.image.trim() ? (
          <LazyImage
            src={slide.image}
            alt={slide.title}
            widthParam={800}
            qualityParam={80}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : null}

        {/* Gradient Overlay matching reference (Dark sapphire on left, transparent on right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#04142F]/95 via-[#061B3A]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04142F]/85 via-transparent to-transparent z-10" />

        {/* Content Container */}
        <div className="relative h-full flex flex-col justify-between p-4 sm:p-6 z-20">
          <div className="space-y-0.5 max-w-[80%] sm:max-w-[70%]">
            {/* Script Tagline: "Discover" */}
            <span className="font-script text-[#FFC928] text-xl sm:text-3xl drop-shadow-md tracking-wide block">
              {slide.tagline}
            </span>

            {/* Large Bold Title: "SHENDAM" */}
            <h2 className="font-brand-sans font-bold text-white text-2xl sm:text-4xl tracking-wide uppercase leading-tight drop-shadow-lg">
              {slide.title}
            </h2>

            {/* Multi-line Subtitle */}
            <p className="text-[#D5DCE8] text-[11px] sm:text-sm font-medium leading-snug whitespace-pre-line pt-0.5 sm:pt-1 drop-shadow line-clamp-2 sm:line-clamp-none">
              {slide.description}
            </p>
          </div>

          {/* Explore Now Button & Carousel Dots */}
          <div className="flex items-end justify-between w-full pt-1">
            {/* Gold Action Button */}
            <button
              onClick={() => onExplore(slide.categoryTarget)}
              className="bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 text-[#061B3A] font-extrabold text-xs sm:text-sm px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-lg transition cursor-pointer"
            >
              <span>Explore Now</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </button>

            {/* Carousel Dots Centered / Bottom */}
            <div className="flex items-center gap-1.5 pb-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentSlide === idx
                      ? 'w-4 h-2 bg-[#FFC928]'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
