import React, { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Place } from '../types';
import { LazyImage } from '../utils/imageOptimizer';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  places?: Place[];
  onSelectPlace?: (place: Place) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  places = [],
  onSelectPlace
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sync internal input value with external searchQuery prop
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Debounce search query updates by 250ms to prevent excessive filtering operations
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(inputValue);
    }, 250);
    return () => clearTimeout(handler);
  }, [inputValue, onSearchChange]);

  const filtered = inputValue.trim()
    ? places
        .filter(
          (p) =>
            p.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            p.categoryLabel.toLowerCase().includes(inputValue.toLowerCase()) ||
            p.area.toLowerCase().includes(inputValue.toLowerCase())
        )
        .slice(0, 6) // Limit top auto-suggest results to 6 items
    : [];

  return (
    <div className="relative w-full px-4 sm:px-5 mt-2 z-20">
      <div className="w-full bg-white rounded-full p-1.5 pl-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition border border-transparent focus-within:border-[#F5B800]">
        {/* Left: Gold Map Pin Icon */}
        <div className="flex items-center gap-2.5 flex-1 mr-2">
          <MapPin className="w-5 h-5 text-[#F5B800] fill-[#F5B800] shrink-0" />
          
          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search hotels, places, business..."
            className="w-full bg-transparent text-[#061B3A] placeholder-[#718096] text-xs sm:text-sm font-medium outline-none"
          />
        </div>

        {/* Right: Search Button */}
        <button
          type="button"
          aria-label="Search"
          className="w-10 h-10 rounded-full bg-[#08254D] hover:bg-[#0B2D5C] text-white flex items-center justify-center shrink-0 shadow-md transition cursor-pointer active:scale-95 border border-[#0878D1]/30"
        >
          <Search className="w-5 h-5 text-white stroke-[2.5]" />
        </button>
      </div>

      {/* Auto-suggest dropdown when searching */}
      {isFocused && inputValue.trim() && filtered.length > 0 && (
        <div className="absolute top-full left-4 right-4 sm:left-5 sm:right-5 mt-2 bg-[#0B2D5C] border border-white/16 rounded-2xl p-2 shadow-2xl z-30 max-h-60 overflow-y-auto no-scrollbar">
          {filtered.map((place) => (
            <button
              key={place.id}
              onClick={() => {
                onSelectPlace?.(place);
                setIsFocused(false);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-left transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                <LazyImage
                  src={place.image}
                  alt={place.name}
                  widthParam={120}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{place.name}</div>
                <div className="text-[11px] text-[#9BAABD] truncate">
                  {place.categoryLabel} • {place.area}
                </div>
              </div>
              <span className="text-xs text-[#FFC928] font-semibold">★ {place.rating}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
