import React from 'react';
import { Place, CategoryId, ShendamEvent, Opportunity } from '../types';
import { Bookmark, Star, MapPin, Search, Calendar, Briefcase } from 'lucide-react';
import { LazyImage } from '../utils/imageOptimizer';
import { matchPlaceSearch, matchPlaceCategory, matchEventSearch, matchOpportunitySearch } from '../utils/searchHelper';
import { LocalSponsoredAd } from './ads/LocalSponsoredAd';
import { GoogleAdSlot } from './ads/GoogleAdSlot';

interface ExploreViewProps {
  places: Place[];
  events: ShendamEvent[];
  opportunities: Opportunity[];
  selectedCategory: CategoryId | 'all' | 'jobs';
  onSelectCategory: (category: CategoryId | 'all' | 'jobs') => void;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string, e: React.MouseEvent) => void;
  onSelectPlace: (place: Place) => void;
  onSelectEvent: (event: ShendamEvent) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  places,
  events,
  opportunities,
  selectedCategory,
  onSelectCategory,
  savedPlaceIds,
  onToggleSave,
  onSelectPlace,
  onSelectEvent,
  onSelectOpportunity,
  searchQuery,
  onSearchChange
}) => {
  const categoryFilters: { id: CategoryId | 'all' | 'jobs'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'hotels', label: 'Hotels' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'businesses', label: 'Businesses' },
    { id: 'tourist_spots', label: 'Tourist Attractions' },
    { id: 'services', label: 'Services' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'transport', label: 'Transport' },
    { id: 'health', label: 'Health' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'events', label: 'Events' },
    { id: 'jobs', label: 'Jobs & Opportunities' }
  ];

  const filteredPlaces = places.filter(
    (place) => matchPlaceCategory(place, selectedCategory) && matchPlaceSearch(place, searchQuery)
  );

  const filteredEvents =
    selectedCategory === 'all' || selectedCategory === 'events'
      ? events.filter((event) => matchEventSearch(event, searchQuery))
      : [];

  const filteredOpps =
    selectedCategory === 'all' || selectedCategory === 'jobs'
      ? opportunities.filter((opp) => matchOpportunitySearch(opp, searchQuery))
      : [];

  const totalResults = filteredPlaces.length + filteredEvents.length + filteredOpps.length;

  return (
    <div className="w-full px-5 py-4 pb-28 space-y-4 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white font-brand-sans">
          Explore Shendam
        </h2>
        <p className="text-xs text-[#9BAABD]">
          Find top-rated hospitality, businesses, events, and opportunities
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

      {/* Directory Advertising Slots (Local Sponsored & Google Ads) */}
      <div className="space-y-2.5">
        <LocalSponsoredAd
          placement={
            selectedCategory === 'hotels'
              ? 'hotels'
              : selectedCategory === 'restaurants'
              ? 'restaurants'
              : selectedCategory === 'businesses'
              ? 'businesses'
              : 'directory_top'
          }
          variant="compact"
          onSelectPlace={(placeId) => {
            const found = places.find((p) => p.id === placeId);
            if (found) onSelectPlace(found);
          }}
        />
        <GoogleAdSlot
          placement={
            selectedCategory === 'hotels'
              ? 'hotels'
              : selectedCategory === 'businesses'
              ? 'businesses'
              : 'discover'
          }
        />
      </div>

      {/* Grid of Places */}
      {filteredPlaces.length > 0 && (
        <div className="space-y-2">
          {selectedCategory === 'all' && <h3 className="text-xs font-bold text-[#FFC928] uppercase tracking-wider">Places & Businesses</h3>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {filteredPlaces.map((place) => {
              const isSaved = savedPlaceIds.includes(place.id);
              return (
                <div
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  className="bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/70 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group cursor-pointer transition-all duration-200 active:scale-98"
                >
                  <div className="relative w-full h-36 bg-[#08254D] overflow-hidden">
                    <LazyImage
                      src={place.image}
                      alt={place.name}
                      widthParam={500}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => onToggleSave(place.id, e)}
                      aria-label="Save Place"
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-[#04142F]/70 backdrop-blur-md flex items-center justify-center text-[#FFC928] hover:scale-110 transition cursor-pointer border border-white/10 z-10"
                    >
                      <Bookmark className={`w-4 h-4 text-[#FFC928] ${isSaved ? 'fill-[#FFC928]' : 'stroke-[2]'}`} />
                    </button>
                    <span className="absolute bottom-2.5 left-2.5 bg-[#04142F]/85 backdrop-blur-md text-[10px] text-[#FFC928] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-white/16 z-10">
                      {place.categoryLabel}
                    </span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-[#FFC928] transition-colors">
                          {place.name}
                        </h4>
                        <div className="flex items-center gap-1 bg-[#08254D] border border-white/10 px-2 py-0.5 rounded-lg shrink-0 text-xs">
                          <Star className="w-3.5 h-3.5 text-[#FFC928] fill-[#FFC928]" />
                          {place.rating && place.rating > 0 ? (
                            <span className="font-bold text-white text-xs">{place.rating}</span>
                          ) : (
                            <span className="text-[10px] text-[#9BAABD] font-semibold">New</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#9BAABD] flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                        <span className="truncate">{place.address || place.area}</span>
                      </p>
                      <p className="text-xs text-[#D5DCE8] line-clamp-2 mt-1.5 leading-snug">
                        {place.description || 'No information available yet.'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
                      <span className="text-xs font-semibold text-[#9BAABD]">
                        {place.priceRange || 'No price info'}
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
        </div>
      )}

      {/* Grid of Events */}
      {filteredEvents.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-[#FFC928] uppercase tracking-wider">Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/70 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group cursor-pointer transition-all duration-200 active:scale-98"
              >
                <div className="relative w-full h-36 bg-[#08254D] overflow-hidden">
                  <LazyImage src={ev.image} alt={ev.title} widthParam={500} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute bottom-2.5 left-2.5 bg-[#04142F]/85 backdrop-blur-md text-[10px] text-[#FFC928] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-white/16 z-10">
                    Event
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-[#FFC928] transition-colors">{ev.title}</h4>
                    <p className="text-xs text-[#9BAABD] flex items-center gap-1 mt-1 truncate">
                      <Calendar className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                      <span className="truncate">{ev.date} at {ev.time} • {ev.location}</span>
                    </p>
                    <p className="text-xs text-[#D5DCE8] line-clamp-2 mt-1.5 leading-snug">{ev.description}</p>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className="px-3.5 py-1.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm active:scale-95"
                    >
                      View Event
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Opportunities/Jobs */}
      {filteredOpps.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-[#FFC928] uppercase tracking-wider">Jobs & Opportunities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {filteredOpps.map((opp) => (
              <div
                key={opp.id}
                onClick={() => onSelectOpportunity(opp)}
                className="bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/70 rounded-2xl p-4 shadow-md flex flex-col justify-between group cursor-pointer transition-all duration-200 active:scale-98"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-[#FFC928] transition-colors">{opp.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFC928]/20 text-[#FFC928] border border-[#FFC928]/40 uppercase">
                      {opp.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#9BAABD] flex items-center gap-1 mt-1 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                    <span className="truncate">{opp.organization} • {opp.location}</span>
                  </p>
                  <p className="text-xs text-[#D5DCE8] line-clamp-2 mt-1.5 leading-snug">{opp.description}</p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-3">
                  <span className="text-[11px] text-[#9BAABD]">Deadline: {opp.deadline || 'Open'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOpportunity(opp);
                    }}
                    className="px-3.5 py-1.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm active:scale-95"
                  >
                    View Opportunity
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalResults === 0 && (
        <div className="text-center py-12 px-4 bg-[#0B2D5C] rounded-2xl border border-white/16">
          <div className="w-12 h-12 rounded-full bg-[#08254D] text-[#FFC928] flex items-center justify-center mx-auto mb-3 text-xl">
            <Search className="w-6 h-6 text-[#FFC928]" />
          </div>
          <h4 className="font-bold text-base text-white">No results found</h4>
          <p className="text-xs text-[#9BAABD] max-w-xs mx-auto mt-1">
            Try searching for another hotel, business, restaurant or attraction.
          </p>
          <button
            onClick={() => {
              onSelectCategory('all');
              onSearchChange('');
            }}
            className="mt-4 px-4 py-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-bold text-xs rounded-xl shadow transition cursor-pointer active:scale-95"
          >
            Clear Filters & Search
          </button>
        </div>
      )}
    </div>
  );
};
