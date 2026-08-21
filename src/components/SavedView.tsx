import React from 'react';
import { Place } from '../types';
import { Bookmark, Star, MapPin, Trash2, WifiOff, CheckCircle2, CloudCheck, Sparkles } from 'lucide-react';
import { useOnlineStatus } from '../utils/offlineCache';
import { LazyImage } from '../utils/imageOptimizer';

interface SavedViewProps {
  places: Place[];
  savedPlaceIds: string[];
  onToggleSave: (placeId: string) => void;
  onSelectPlace: (place: Place) => void;
  onExploreMore: () => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  places,
  savedPlaceIds,
  onToggleSave,
  onSelectPlace,
  onExploreMore
}) => {
  const savedPlaces = places.filter((p) => savedPlaceIds.includes(p.id));
  const { isOnline, simulatedOffline, toggleSimulateOffline } = useOnlineStatus();

  return (
    <div className="w-full px-5 py-4 pb-28 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-brand-sans">
            Saved Places
          </h2>
          <p className="text-xs text-[#9BAABD]">
            {savedPlaces.length} bookmark{savedPlaces.length === 1 ? '' : 's'} saved for your visit
          </p>
        </div>

        {/* Offline Simulation / Status Button */}
        <button
          onClick={toggleSimulateOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer ${
            !isOnline
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-[#0B2D5C] text-[#D5DCE8] border-white/16 hover:border-[#FFC928]/40'
          }`}
          title={simulatedOffline ? 'Click to restore online mode' : 'Test offline mode'}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Offline Ready</span>
            </>
          )}
        </button>
      </div>

      {/* Offline Status Info Banner */}
      <div className="bg-[#08254D] border border-white/16 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center shrink-0">
            <Bookmark className="w-3.5 h-3.5 text-[#FFC928]" />
          </div>
          <div>
            <p className="text-white font-semibold text-[11px] leading-tight">
              {!isOnline ? 'Viewing Cached Offline Directory' : 'Automatic Offline Caching Active'}
            </p>
            <p className="text-[#9BAABD] text-[10px] leading-tight mt-0.5">
              Saved hotels, contact numbers & directions remain accessible without cellular data.
            </p>
          </div>
        </div>
      </div>

      {savedPlaces.length > 0 ? (
        <div className="space-y-3">
          {savedPlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => onSelectPlace(place)}
              className="bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/60 rounded-2xl p-3 flex items-center gap-3.5 shadow-md cursor-pointer transition active:scale-98 group relative"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                <LazyImage
                  src={place.image}
                  alt={place.name}
                  widthParam={200}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#FFC928]/20 text-[#FFC928] font-bold px-2 py-0.5 rounded border border-[#FFC928]/30 uppercase">
                    {place.categoryLabel}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#FFC928] font-bold">
                    <Star className="w-3 h-3 fill-[#FFC928]" />
                    <span>{place.rating}</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-medium ml-auto flex items-center gap-0.5">
                    ✓ Cached
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white truncate mt-1 group-hover:text-[#FFC928] transition">
                  {place.name}
                </h4>

                <p className="text-[11px] text-[#9BAABD] flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-[#FFC928] shrink-0" />
                  <span className="truncate">{place.area}</span>
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(place.id);
                }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#9BAABD] hover:text-rose-400 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Remove bookmark"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#0B2D5C] rounded-2xl border border-white/16 p-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#08254D] text-[#FFC928] flex items-center justify-center mx-auto text-2xl">
            🔖
          </div>
          <h4 className="font-bold text-base text-white">No Saved Places Yet</h4>
          <p className="text-xs text-[#9BAABD] max-w-xs mx-auto">
            Tap the bookmark ribbon on any hotel, restaurant, or tourist spot in Shendam to save it for offline browsing.
          </p>
          <button
            onClick={onExploreMore}
            className="mt-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer transition"
          >
            Explore Directory
          </button>
        </div>
      )}
    </div>
  );
};

