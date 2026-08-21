import React from 'react';
import { Bookmark, Star, MapPin, Sparkles } from 'lucide-react';
import { Place } from '../types';
import { LazyImage } from '../utils/imageOptimizer';

interface RecommendedSectionProps {
  places: Place[];
  savedPlaceIds: string[];
  onToggleSave: (placeId: string, e: React.MouseEvent) => void;
  onSelectPlace: (place: Place) => void;
  onSeeAll?: () => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  places,
  savedPlaceIds,
  onToggleSave,
  onSelectPlace,
  onSeeAll
}) => {
  // Curate recommended places (prioritizing diverse categories: hotels, restaurants, tourist spots, businesses)
  const recommendedList = places.filter(p => !p.popular || p.featured).slice(0, 6);
  const displayPlaces = recommendedList.length >= 3 ? recommendedList : places.slice(0, 6);

  return (
    <section className="w-full mt-7 mb-6 z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFC928]" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Recommended For You
            </h3>
          </div>
          <p className="text-xs text-[#9BAABD] mt-0.5">
            Curated stays, local bites & must-see landmarks
          </p>
        </div>

        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[#FFC928] hover:text-[#F5B800] text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ml-2"
          >
            See All
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Cards List */}
      <div className="flex gap-3 px-4 sm:px-5 overflow-x-auto no-scrollbar pb-2 pt-1">
        {displayPlaces.map((place) => {
          const isSaved = savedPlaceIds.includes(place.id);

          return (
            <div
              key={place.id}
              onClick={() => onSelectPlace(place)}
              className="w-44 sm:w-48 shrink-0 bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/70 rounded-2xl overflow-hidden cursor-pointer shadow-md group transition-all duration-300 active:scale-98 flex flex-col"
            >
              {/* Card Image */}
              <div className="relative w-full h-28 bg-[#08254D] overflow-hidden">
                <LazyImage
                  src={place.image}
                  alt={place.name}
                  widthParam={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Dark Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C] via-transparent to-black/30 z-10" />

                {/* Top-Right Gold Bookmark Ribbon */}
                <button
                  onClick={(e) => onToggleSave(place.id, e)}
                  aria-label="Bookmark place"
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[#04142F]/60 backdrop-blur-md flex items-center justify-center text-[#FFC928] hover:scale-110 transition cursor-pointer z-20 border border-white/10"
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 text-[#FFC928] ${
                      isSaved ? 'fill-[#FFC928]' : 'stroke-[2.2]'
                    }`}
                  />
                </button>

                {/* Category Pill on Image */}
                <span className="absolute bottom-2 left-2 text-[9px] font-semibold bg-[#04142F]/85 text-[#D5DCE8] border border-white/16 px-1.5 py-0.5 rounded backdrop-blur-md z-20">
                  {place.categoryLabel || place.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#FFC928] transition-colors">
                    {place.name}
                  </h4>

                  <div className="flex items-center gap-1 text-[10px] text-[#9BAABD] mt-1 truncate">
                    <MapPin className="w-2.5 h-2.5 text-[#FFC928] shrink-0" />
                    <span className="truncate">{place.area || place.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-white">
                    <Star className="w-3 h-3 fill-[#FFC928] text-[#FFC928]" />
                    <span>{place.rating}</span>
                    <span className="text-[9px] text-[#9BAABD] font-normal">
                      ({place.reviewsCount || 0})
                    </span>
                  </div>

                  {place.priceRange && (
                    <span className="text-[10px] font-bold text-[#FFC928] bg-[#FFC928]/10 px-1.5 py-0.5 rounded">
                      {place.priceRange}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
