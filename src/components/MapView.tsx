import React, { useState } from 'react';
import { Place } from '../types';
import { MapPin, Navigation, Star, Bookmark, Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface MapViewProps {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string, e: React.MouseEvent) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  onSelectPlace,
  selectedPlace,
  savedPlaceIds,
  onToggleSave
}) => {
  const [activePin, setActivePin] = useState<Place | null>(selectedPlace || places[0] || null);
  const [mapZoom, setMapZoom] = useState(1);

  return (
    <div className="w-full h-[calc(100vh-140px)] relative overflow-hidden flex flex-col">
      {/* Top Map Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-[#08254D]/90 backdrop-blur-md border border-white/16 px-3.5 py-1.5 rounded-full shadow-lg pointer-events-auto">
          <span className="text-xs font-bold text-[#FFC928] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFC928] animate-ping" />
            Shendam LGA Interactive Map
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#08254D]/90 backdrop-blur-md border border-white/16 p-1 rounded-xl shadow-lg pointer-events-auto">
          <button
            onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 1.6))}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.8))}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stylized SVG Map Canvas */}
      <div className="w-full h-full bg-[#061B3A] relative overflow-hidden flex items-center justify-center">
        <div
          className="relative w-[500px] h-[500px] transition-transform duration-300 select-none"
          style={{ transform: `scale(${mapZoom})` }}
        >
          {/* Map Grid and terrain contours */}
          <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 500 500">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0878D1" strokeWidth="0.8" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Plateau Southern Escarpment Hills Contours */}
            <path
              d="M 50 120 Q 150 80, 260 140 T 450 100"
              fill="none"
              stroke="#FFC928"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.6"
            />
            <path
              d="M 80 280 Q 200 320, 320 270 T 480 340"
              fill="none"
              stroke="#0878D1"
              strokeWidth="3"
              opacity="0.5"
            />
            {/* River Shimankar / River Shemankar Stream */}
            <path
              d="M 220 20 Q 260 180, 240 320 T 270 480"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3.5"
              opacity="0.8"
            />
          </svg>

          {/* District Labels */}
          <div className="absolute top-10 left-12 text-[10px] uppercase tracking-widest text-[#FFC928]/80 font-extrabold">
            ▲ Kwolla Hills
          </div>
          <div className="absolute top-44 left-32 text-[11px] uppercase tracking-widest text-white/90 font-bold bg-[#08254D]/90 px-2 py-0.5 rounded border border-white/16">
            Shendam Central
          </div>
          <div className="absolute bottom-20 right-14 text-[10px] uppercase tracking-widest text-[#9BAABD] font-semibold">
            Shimankar Valley
          </div>
          <div className="absolute bottom-32 left-10 text-[10px] uppercase tracking-widest text-[#9BAABD] font-semibold">
            Namu Corridor
          </div>

          {/* Place Map Pins */}
          {places.map((place) => {
            const x = place.mapPosition?.x || 50;
            const y = place.mapPosition?.y || 50;
            const isSelected = activePin?.id === place.id;

            return (
              <button
                key={place.id}
                onClick={() => setActivePin(place)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
              >
                <div
                  className={`relative flex items-center justify-center transition-all ${
                    isSelected
                      ? 'scale-125 z-30'
                      : 'hover:scale-110 opacity-90'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xl border-2 ${
                      isSelected
                        ? 'bg-[#FFC928] text-[#061B3A] border-white shadow-[0_0_15px_rgba(255,201,40,0.8)]'
                        : 'bg-[#0B2D5C] text-[#FFC928] border-[#FFC928]'
                    }`}
                  >
                    <MapPin className="w-4 h-4 fill-current" />
                  </div>

                  {/* Pulsing ring for selected pin */}
                  {isSelected && (
                    <span className="absolute inset-0 rounded-full bg-[#FFC928] animate-ping opacity-40 -z-10" />
                  )}
                </div>

                {/* Floating mini label */}
                <div
                  className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow-md transition ${
                    isSelected
                      ? 'bg-[#FFC928] text-[#061B3A]'
                      : 'bg-[#08254D]/90 text-white border border-white/16'
                  }`}
                >
                  {place.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Place Preview Card */}
      {activePin && (
        <div className="absolute bottom-20 left-4 right-4 z-30 animate-in slide-in-from-bottom duration-200">
          <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
            <img
              src={activePin.image}
              alt={activePin.name}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-[#FFC928] text-[#061B3A] font-extrabold px-1.5 py-0.2 rounded uppercase">
                  {activePin.categoryLabel}
                </span>
                <div className="flex items-center gap-0.5 text-[#FFC928] text-xs font-bold">
                  <Star className="w-3 h-3 fill-[#FFC928]" />
                  <span>{activePin.rating}</span>
                </div>
              </div>

              <h4 className="font-bold text-xs sm:text-sm text-white truncate mt-0.5">
                {activePin.name}
              </h4>
              <p className="text-[11px] text-[#9BAABD] truncate">{activePin.address}</p>
            </div>

            <button
              onClick={() => onSelectPlace(activePin)}
              className="bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] text-xs font-extrabold px-3 py-2 rounded-xl shrink-0 shadow cursor-pointer"
            >
              View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
