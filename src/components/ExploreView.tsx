import React, { useState } from 'react';
import { Place, CategoryId } from '../types';
import { Bookmark, Star, MapPin, Search } from 'lucide-react';
import { LazyImage } from '../utils/imageOptimizer';

interface ExploreViewProps {
  places: Place[];
  selectedCategory: CategoryId | 'all';
  onSelectCategory: (category: CategoryId | 'all') => void;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string, e: React.MouseEvent) => void;
  onSelectPlace: (place: Place) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  places,
  selectedCategory,
  onSelectCategory,
  savedPlaceIds,
  onToggleSave,
  onSelectPlace,
  searchQuery,
  onSearchChange
}) => {
  const categoryFilters: { id: CategoryId | 'all'; label: string }[] = [
    { id: 'all', label: 'All Places' },
    { id: 'hotels', label: 'Hotels' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'businesses', label: 'Businesses' },
    { id: 'tourist_spots', label: 'Tourist Spots' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'transport', label: 'Transport' },
    { id: 'health', label: 'Health' },
    { id: 'emergency', label: 'Emergency' }
  ];

  const filteredPlaces = places.filter((place) => {
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full px-5 py-4 pb-28 space-y-4 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white font-brand-sans">
          Explore Shendam
        </h2>
        <p className="text-xs text-[#9BAABD]">
          Find top-rated hospitality, attractions, and local services
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {categoryFilters.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#FFC928] text-[#061B3A] shadow-md font-bold'
                : 'bg-[#0B2D5C] text-[#D5DCE8] hover:bg-[#08254D] border border-white/16'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Places */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {filteredPlaces.map((place) => {
          const isSaved = savedPlaceIds.includes(place.id);
          return (
            <div
              key={place.id}
              onClick={() => onSelectPlace(place)}
              className="bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/70 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group cursor-pointer transition-all duration-200 active:scale-98"
            >
              {/* Hotel Image */}
              <div className="relative w-full h-36 bg-[#08254D] overflow-hidden">
                <LazyImage
                  src={place.image}
                  alt={place.name}
                  widthParam={500}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Save/Bookmark Icon */}
                <button
                  onClick={(e) => onToggleSave(place.id, e)}
                  aria-label="Save Place"
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-[#04142F]/70 backdrop-blur-md flex items-center justify-center text-[#FFC928] hover:scale-110 transition cursor-pointer border border-white/10 z-10"
                >
                  <Bookmark
                    className={`w-4 h-4 text-[#FFC928] ${
                      isSaved ? 'fill-[#FFC928]' : 'stroke-[2]'
                    }`}
                  />
                </button>

                <span className="absolute bottom-2.5 left-2.5 bg-[#04142F]/85 backdrop-blur-md text-[10px] text-[#FFC928] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-white/16 z-10">
                  {place.categoryLabel}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  {/* Hotel Name & Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-[#FFC928] transition-colors">
                      {place.name}
                    </h4>

                    {/* Star / Rating display */}
                    <div className="flex items-center gap-1 bg-[#08254D] border border-white/10 px-2 py-0.5 rounded-lg shrink-0 text-xs">
                      <Star className="w-3.5 h-3.5 text-[#FFC928] fill-[#FFC928]" />
                      {place.rating && place.rating > 0 ? (
                        <span className="font-bold text-white text-xs">{place.rating}</span>
                      ) : (
                        <span className="text-[10px] text-[#FFC928] font-semibold">Contact hotel for details</span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <p className="text-xs text-[#9BAABD] flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                    <span className="truncate">{place.address || place.area}</span>
                  </p>

                  {/* Short Description */}
                  <p className="text-xs text-[#D5DCE8] line-clamp-2 mt-1.5 leading-snug">
                    {place.description || 'Information coming soon'}
                  </p>
                </div>

                {/* Card Footer with View Details Button */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
                  <span className="text-xs font-semibold text-[#9BAABD]">
                    {place.priceRange || 'Contact hotel for details'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlace(place);
                    }}
                    className="px-3.5 py-1.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm active:scale-95"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlaces.length === 0 && (
        <div className="text-center py-12 bg-[#0B2D5C] rounded-2xl border border-white/16">
          <p className="text-sm text-[#9BAABD]">No places found for your search.</p>
          <button
            onClick={() => {
              onSelectCategory('all');
              onSearchChange('');
            }}
            className="mt-3 text-xs text-[#FFC928] font-bold underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
