import React, { useState } from 'react';
import { Place } from '../../types';
import {
  Compass,
  PlusCircle,
  Search,
  MapPin,
  Star,
  Edit2,
  Trash2,
  Sparkles
} from 'lucide-react';

interface AdminAttractionsProps {
  places: Place[];
  onAddAttraction: () => void;
  onEditAttraction: (place: Place) => void;
  onDeleteAttraction: (placeId: string, placeName: string) => void;
  onToggleFeatured: (place: Place) => void;
}

export const AdminAttractions: React.FC<AdminAttractionsProps> = ({
  places,
  onAddAttraction,
  onEditAttraction,
  onDeleteAttraction,
  onToggleFeatured
}) => {
  const [search, setSearch] = useState('');

  const attractions = places.filter((p) => p.category === 'tourist_spots');

  const filteredAttractions = attractions.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.area.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span>Tourist Spots & Cultural Heritage ({attractions.length})</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Preserve and promote natural wonders, historic monuments, water falls, and royal palaces in Shendam LGA.
          </p>
        </div>

        <button
          onClick={onAddAttraction}
          className="flex items-center gap-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Attraction</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search attractions by name or district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
        />
      </div>

      {/* Grid of Tourist Spot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAttractions.map((spot) => (
          <div
            key={spot.id}
            className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-lg text-white flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-44 w-full bg-[#04142F] overflow-hidden">
                <img
                  src={spot.image}
                  alt={spot.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08254D] via-transparent to-black/30" />

                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFC928] text-[#04142F] px-2.5 py-1 rounded-full shadow">
                    {spot.area}
                  </span>
                </div>

                <button
                  onClick={() => onToggleFeatured(spot)}
                  className={`absolute top-3 right-3 p-1.5 rounded-xl border backdrop-blur-md transition cursor-pointer ${
                    spot.featured
                      ? 'bg-[#FFC928] text-[#04142F] border-[#FFC928]'
                      : 'bg-black/40 text-white/70 border-white/20 hover:text-white'
                  }`}
                  title="Toggle Featured Spot"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-white font-brand-sans">{spot.name}</h3>
                <p className="text-xs text-[#D5DCE8] line-clamp-2 leading-relaxed">
                  {spot.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs text-[#9BAABD]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC928]" />
                    <span>{spot.area}</span>
                  </span>
                  <div className="flex items-center gap-1 text-[#FFC928] font-bold">
                    <Star className="w-3.5 h-3.5 fill-[#FFC928]" />
                    <span>{spot.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center justify-between border-t border-white/8 mt-3">
              <span className="text-[11px] text-[#9BAABD]">
                {spot.coordinates ? `${spot.coordinates.lat.toFixed(3)}, ${spot.coordinates.lng.toFixed(3)}` : 'Shendam LGA'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditAttraction(spot)}
                  className="p-2 rounded-xl bg-white/8 hover:bg-white/16 text-white transition cursor-pointer"
                  title="Edit Attraction"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteAttraction(spot.id, spot.name)}
                  className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition cursor-pointer"
                  title="Delete Attraction"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
