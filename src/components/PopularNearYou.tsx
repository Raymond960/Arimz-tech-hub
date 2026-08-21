import React from 'react';
import { Bookmark, Star } from 'lucide-react';
import { Place } from '../types';
import { LazyImage } from '../utils/imageOptimizer';

interface PopularNearYouProps {
  places: Place[];
  savedPlaceIds: string[];
  onToggleSave: (placeId: string, e: React.MouseEvent) => void;
  onSelectPlace: (place: Place) => void;
  onSeeAll: () => void;
}

export const PopularNearYou: React.FC<PopularNearYouProps> = ({
  places,
  savedPlaceIds,
  onToggleSave,
  onSelectPlace,
  onSeeAll
}) => {
  // Show popular places from data
  const popularPlaces = places.slice(0, 4);

  return (
    <div className="w-full mt-6 z-10">
      {/* Header with Title and "See All" */}
      <div className="flex items-center justify-between px-4 sm:px-5 mb-3">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Popular Near You
        </h3>
        <button
          onClick={onSeeAll}
          className="text-[#FFC928] hover:text-[#F5B800] text-xs sm:text-sm font-semibold transition cursor-pointer"
        >
          See All
        </button>
      </div>

      {/* Horizontal Scrollable Cards List */}
      <div className="flex gap-3 px-4 sm:px-5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-0">
        {popularPlaces.map((place) => {
          const isSaved = savedPlaceIds.includes(place.id);

          return (
            <div
              key={place.id}
              onClick={() => onSelectPlace(place)}
              className="w-36 sm:w-40 shrink-0 bg-[#0B2D5C] border border-white/16 rounded-2xl overflow-hidden hover:border-[#FFC928]/70 transition-all duration-200 cursor-pointer shadow-md group active:scale-98 flex flex-col"
            >
              {/* Card Image */}
              <div className="relative w-full h-28 sm:h-32 bg-[#08254D] overflow-hidden">
                <LazyImage
                  src={place.image}
                  alt={place.name}
                  widthParam={320}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Top-Right Gold Bookmark Ribbon */}
                <button
                  onClick={(e) => onToggleSave(place.id, e)}
                  aria-label="Bookmark place"
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[#04142F]/60 backdrop-blur-md flex items-center justify-center text-[#FFC928] hover:scale-110 transition cursor-pointer z-10 border border-white/10"
                >
                  <Bookmark
                    className={`w-4 h-4 text-[#FFC928] ${
                      isSaved ? 'fill-[#FFC928]' : 'stroke-[2.2]'
                    }`}
                  />
                </button>
              </div>

              {/* Card Info */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#FFC928] transition">
                  {place.name}
                </h4>

                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-[#9BAABD] truncate max-w-[65%]">
                    {place.categoryLabel}
                  </span>

                  <div className="flex items-center gap-1 font-semibold text-[#D5DCE8]">
                    <span>{place.rating}</span>
                    <Star className="w-3 h-3 text-[#FFC928] fill-[#FFC928]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
