import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import { EXPLORE_TOPICS } from '../data/mockData';
import { CategoryId } from '../types';
import { LazyImage } from '../utils/imageOptimizer';

interface ExploreShendamSectionProps {
  onSelectCategory: (category: CategoryId, searchQuery?: string) => void;
}

export const ExploreShendamSection: React.FC<ExploreShendamSectionProps> = ({ onSelectCategory }) => {
  return (
    <section className="w-full px-4 sm:px-5 mt-7 z-10">
      {/* Section Header */}
      <div className="mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#FFC928] shadow-[0_0_8px_#FFC928]" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Explore Shendam
          </h3>
        </div>
        <p className="text-xs text-[#9BAABD] mt-0.5 font-normal">
          Discover places, culture and experiences around Shendam.
        </p>
      </div>

      {/* 2x2 Grid of Attractive Image Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {EXPLORE_TOPICS.map((topic) => (
          <div
            key={topic.id}
            onClick={() => onSelectCategory(topic.targetCategory, topic.id === 'culture' ? 'Palace' : undefined)}
            className="group relative h-36 rounded-2xl overflow-hidden border border-white/16 hover:border-[#FFC928]/80 bg-[#0B2D5C] cursor-pointer shadow-lg transition-all duration-300 active:scale-98 flex flex-col justify-end p-3"
          >
            {/* Background Image with Zoom on Hover if uploaded */}
            {topic.image && topic.image.trim() ? (
              <LazyImage
                src={topic.image}
                alt={topic.title}
                widthParam={400}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
            ) : null}

            {/* Dark & Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#04142F] via-[#061B3A]/65 to-transparent z-10" />
            <div className="absolute inset-0 bg-[#061B3A]/25 group-hover:bg-transparent transition-colors duration-300 z-10" />

            {/* Top Pill / Count Badge */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <span className="text-[10px] font-semibold bg-[#04142F]/85 border border-white/16 group-hover:border-[#FFC928]/50 text-[#D5DCE8] px-2 py-0.5 rounded-full backdrop-blur-md transition">
                {topic.count}
              </span>
            </div>

            {/* Content at Bottom */}
            <div className="relative z-20">
              <h4 className="font-bold text-xs sm:text-sm text-white leading-tight group-hover:text-[#FFC928] transition-colors">
                {topic.title}
              </h4>
              <p className="text-[10px] text-[#9BAABD] line-clamp-1 mt-0.5 font-medium">
                {topic.subtitle}
              </p>
              
              <div className="flex items-center gap-1 text-[10px] text-[#FFC928] font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0 duration-200">
                <span>View listings</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
