import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Place, CategoryId } from '../types';
import {
  MapPin,
  Navigation,
  Star,
  ZoomIn,
  ZoomOut,
  Phone,
  ExternalLink,
  Crosshair,
  Compass,
  Building2,
  Wrench,
  Utensils,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Search,
  X,
  Info
} from 'lucide-react';
import { LazyImage } from '../utils/imageOptimizer';
import { trackEvent } from '../utils/analytics';

interface MapViewProps {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  selectedPlace: Place | null;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string, e: React.MouseEvent) => void;
}

// Coordinate calculation for Shendam bounding box
function getMapCoordinates(place: Place): { x: number; y: number } | null {
  if (!place.coordinates || typeof place.coordinates.lat !== 'number' || typeof place.coordinates.lng !== 'number') {
    return null;
  }

  const { lat, lng } = place.coordinates;
  if (lat === 0 || lng === 0) return null;

  // Use explicit mapPosition if set by listing
  if (place.mapPosition && typeof place.mapPosition.x === 'number' && typeof place.mapPosition.y === 'number') {
    return { x: place.mapPosition.x, y: place.mapPosition.y };
  }

  // Geographic bounds for Shendam LGA Urban Center
  const minLat = 8.850;
  const maxLat = 8.905;
  const minLng = 9.480;
  const maxLng = 9.530;

  const x = Math.min(Math.max(((lng - minLng) / (maxLng - minLng)) * 74 + 13, 8), 92);
  const y = Math.min(Math.max((1 - (lat - minLat) / (maxLat - minLat)) * 74 + 13, 8), 92);

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// Distance calculation using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

const CATEGORY_CHIPS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'all', label: 'All Places', icon: '📍' },
  { id: 'hotels', label: 'Hotels', icon: '🏨' },
  { id: 'services', label: 'Tech & Repair', icon: '🔧' },
  { id: 'restaurants', label: 'Food & Dining', icon: '🍲' },
  { id: 'tourist_spots', label: 'Attractions', icon: '🏞️' },
  { id: 'businesses', label: 'Commercial', icon: '🏪' }
];

export const MapView: React.FC<MapViewProps> = ({
  places,
  onSelectPlace,
  selectedPlace,
  savedPlaceIds,
  onToggleSave
}) => {
  const [activePin, setActivePin] = useState<Place | null>(selectedPlace || places[0] || null);
  const [mapZoom, setMapZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);

  // User location states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Synchronize when selectedPlace changes from outside (e.g. from listing detail page)
  useEffect(() => {
    if (selectedPlace) {
      setActivePin(selectedPlace);
      // Reset pan and center
      setPanOffset({ x: 0, y: 0 });
    }
  }, [selectedPlace?.id]);

  // Request user location on explicit tap
  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setLocationStatus('granted');
        showToast('Current location detected successfully.');
        trackEvent('search_performed' as any, { page: 'map_geolocation' });
      },
      (error) => {
        setLocationStatus('denied');
        if (error.code === error.PERMISSION_DENIED) {
          showToast('Location permission denied. You can enable it in browser settings.');
        } else {
          showToast('Could not retrieve current location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // Filter places based on Category chip and Search query
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      // Category check
      if (selectedCategoryFilter !== 'all' && p.category !== selectedCategoryFilter) {
        return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesArea = (p.area || p.address || '').toLowerCase().includes(q);
        const matchesCategory = (p.categoryLabel || '').toLowerCase().includes(q);
        if (!matchesName && !matchesArea && !matchesCategory) return false;
      }
      return true;
    });
  }, [places, selectedCategoryFilter, searchQuery]);

  // Places with valid coordinates that can be plotted
  const plottablePlaces = useMemo(() => {
    return filteredPlaces
      .map((p) => {
        const coords = getMapCoordinates(p);
        return coords ? { place: p, mapCoords: coords } : null;
      })
      .filter((item): item is { place: Place; mapCoords: { x: number; y: number } } => item !== null);
  }, [filteredPlaces]);

  // User position on map if within Shendam region
  const userMapPosition = useMemo(() => {
    if (!userLocation) return null;
    return getMapCoordinates({
      id: 'user-pos',
      name: 'You',
      category: 'more',
      categoryLabel: 'User',
      rating: 0,
      reviewsCount: 0,
      image: '',
      address: '',
      area: '',
      description: '',
      coordinates: userLocation
    });
  }, [userLocation]);

  // Handle Get Directions navigation
  const handleGetDirections = (pin: Place) => {
    trackEvent('directions_clicked' as any, {
      entityId: pin.id,
      entityTitle: pin.name,
      category: pin.category
    });

    const destLat = pin.coordinates?.lat;
    const destLng = pin.coordinates?.lng;
    const destination = (destLat && destLng && destLat !== 0)
      ? `${destLat},${destLng}`
      : `${pin.name}, ${pin.address || 'Shendam LGA, Plateau State'}`;

    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${encodeURIComponent(destination)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const originLat = position.coords.latitude;
          const originLng = position.coords.longitude;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${encodeURIComponent(destination)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        },
        () => {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        },
        { timeout: 6000, maximumAge: 60000 }
      );
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setMapZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Calculate distance for active pin if user location is available
  const activePinDistance = useMemo(() => {
    if (!activePin || !activePin.coordinates || !userLocation) return null;
    const { lat, lng } = activePin.coordinates;
    if (!lat || !lng) return null;
    const dist = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
    return formatDistance(dist);
  }, [activePin, userLocation]);

  const hasCoordinates = Boolean(
    activePin?.coordinates &&
    typeof activePin.coordinates.lat === 'number' &&
    typeof activePin.coordinates.lng === 'number' &&
    activePin.coordinates.lat !== 0
  );

  return (
    <div className="w-full h-[calc(100vh-140px)] relative overflow-hidden flex flex-col select-none bg-[#061B3A]">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#FFC928] text-[#061B3A] font-extrabold text-xs px-4 py-2 rounded-full shadow-2xl z-40 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-150 whitespace-nowrap">
          {toastNotice}
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. TOP MAP CONTROLS & CATEGORY CHIPS */}
      {/* =================================================================== */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          {/* Map Title / Status Badge */}
          <div className="bg-[#08254D]/95 backdrop-blur-md border border-white/16 px-3.5 py-1.5 rounded-full shadow-lg pointer-events-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFC928] animate-ping shrink-0" />
            <span className="text-xs font-bold text-white font-brand-sans">
              Shendam LGA Map
            </span>
            <span className="text-[10px] bg-[#FFC928]/20 text-[#FFC928] px-1.5 py-0.5 rounded font-bold">
              {plottablePlaces.length} plotted
            </span>
          </div>

          {/* Map Tool Actions: Search, Locate Me, Zoom Controls, Reset */}
          <div className="flex items-center gap-1.5 bg-[#08254D]/95 backdrop-blur-md border border-white/16 p-1 rounded-2xl shadow-lg pointer-events-auto">
            {/* Search Toggle */}
            <button
              id="btn-map-search-toggle"
              onClick={() => setShowSearchInput(!showSearchInput)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                showSearchInput ? 'bg-[#FFC928] text-[#061B3A]' : 'hover:bg-white/10 text-white'
              }`}
              aria-label="Search map"
              title="Search Places on Map"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Locate Me */}
            <button
              id="btn-map-locate-me"
              onClick={handleRequestUserLocation}
              disabled={locationStatus === 'requesting'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                locationStatus === 'granted'
                  ? 'bg-[#38BDF8] text-[#061B3A]'
                  : locationStatus === 'requesting'
                  ? 'bg-[#FFC928]/40 text-white animate-pulse'
                  : 'hover:bg-white/10 text-[#FFC928]'
              }`}
              aria-label="My location"
              title={locationStatus === 'granted' ? 'Current location active' : 'Detect my location'}
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {/* Zoom In */}
            <button
              id="btn-map-zoom-in"
              onClick={() => setMapZoom((prev) => Math.min(prev + 0.25, 2.0))}
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              aria-label="Zoom in"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              id="btn-map-zoom-out"
              onClick={() => setMapZoom((prev) => Math.max(prev - 0.25, 0.75))}
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              aria-label="Zoom out"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Reset View */}
            {(mapZoom !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
              <button
                id="btn-map-reset-view"
                onClick={resetView}
                className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-[#9BAABD] hover:text-white cursor-pointer"
                aria-label="Reset view"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input Bar (when toggled) */}
        {showSearchInput && (
          <div className="bg-[#08254D]/95 backdrop-blur-md border border-white/16 p-1.5 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <Search className="w-4 h-4 text-[#FFC928] ml-2 shrink-0" />
            <input
              type="text"
              placeholder="Search listings on map (e.g. Dreams Hotel, Paul GSM)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-[#9BAABD] outline-none flex-1 py-1"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-white/10 rounded-full text-[#9BAABD] hover:text-white cursor-pointer mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Horizontal Category Chips Filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedCategoryFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategoryFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                  isSelected
                    ? 'bg-[#FFC928] text-[#061B3A] border-[#FFC928]'
                    : 'bg-[#08254D]/90 backdrop-blur-md text-white border-white/16 hover:bg-[#0B2D5C]'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. INTERACTIVE GEOSPATIAL MAP CANVAS */}
      {/* =================================================================== */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full relative overflow-hidden flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          className="relative w-[540px] h-[540px] transition-transform duration-150"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${mapZoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Map Grid and Terrain Contours */}
          <svg className="w-full h-full absolute inset-0 opacity-50" viewBox="0 0 540 540">
            <defs>
              <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse">
                <path d="M 45 0 L 0 0 0 45" fill="none" stroke="#0878D1" strokeWidth="0.8" opacity="0.35" />
              </pattern>
              <radialGradient id="centralGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0878D1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#061B3A" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <circle cx="270" cy="270" r="220" fill="url(#centralGlow)" />

            {/* Kalong Road Arterial Route */}
            <path
              d="M 120 480 Q 230 350, 270 270 T 420 80"
              fill="none"
              stroke="#FFC928"
              strokeWidth="3"
              strokeDasharray="6 4"
              opacity="0.75"
            />

            {/* Yelwa / Langtang Highway Axis */}
            <path
              d="M 60 220 Q 200 250, 270 270 T 500 290"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="3"
              opacity="0.6"
            />

            {/* River Shimankar / River Shemankar Stream */}
            <path
              d="M 280 10 Q 310 180, 290 340 T 330 530"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="4"
              opacity="0.85"
            />
          </svg>

          {/* Key Geographic Landmarks in Shendam */}
          <div className="absolute top-10 left-10 text-[10px] uppercase tracking-widest text-[#FFC928]/80 font-extrabold flex items-center gap-1">
            <span>▲</span> Kwolla Hills
          </div>

          <div className="absolute top-28 right-14 text-[10px] uppercase tracking-widest text-[#38BDF8]/90 font-bold bg-[#04142F]/80 px-2 py-0.5 rounded border border-white/10">
            Shimankar River
          </div>

          <div className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 text-[11px] uppercase tracking-widest text-white font-black bg-[#08254D]/95 px-2.5 py-1 rounded-lg border border-[#FFC928]/40 shadow-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FFC928]" />
            Shendam Central Roundabout
          </div>

          <div className="absolute top-[38%] left-[54%] text-[10px] font-bold text-[#FFC928] bg-[#04142F]/90 px-2 py-0.5 rounded border border-white/10 shadow">
            Texas / Lu'uriemdet Axis
          </div>

          <div className="absolute bottom-28 left-12 text-[10px] uppercase tracking-widest text-[#9BAABD] font-semibold">
            Namu / Lafia Corridor
          </div>

          <div className="absolute bottom-16 right-16 text-[10px] uppercase tracking-widest text-[#9BAABD] font-semibold">
            Kalong / Mass Transit
          </div>

          {/* User Location Radar Marker (if active) */}
          {userLocation && (
            <div
              style={{
                left: `${userMapPosition ? userMapPosition.x : 50}%`,
                top: `${userMapPosition ? userMapPosition.y : 50}%`
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-25 pointer-events-none"
            >
              <div className="relative flex items-center justify-center">
                <span className="w-8 h-8 rounded-full bg-[#38BDF8]/30 animate-ping absolute" />
                <div className="w-5 h-5 rounded-full bg-[#38BDF8] border-2 border-white shadow-[0_0_12px_#38BDF8] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#061B3A]" />
                </div>
              </div>
              <div className="mt-1 px-1.5 py-0.5 rounded bg-[#38BDF8] text-[#061B3A] text-[9px] font-black whitespace-nowrap shadow-md text-center">
                You Are Here
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PLOT REAL PLACE PINS */}
          {/* ================================================================= */}
          {plottablePlaces.map(({ place, mapCoords }) => {
            const isSelected = activePin?.id === place.id;
            const isHotel = place.category === 'hotels';
            const isService = place.category === 'services';
            const isFood = place.category === 'restaurants';

            return (
              <button
                key={place.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(place);
                }}
                style={{ left: `${mapCoords.x}%`, top: `${mapCoords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer focus:outline-none"
                aria-label={`Select ${place.name}`}
              >
                <div
                  className={`relative flex items-center justify-center transition-all duration-200 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 opacity-90'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl border-2 transition-colors ${
                      isSelected
                        ? 'bg-[#FFC928] text-[#061B3A] border-white shadow-[0_0_20px_rgba(255,201,40,0.9)]'
                        : isHotel
                        ? 'bg-[#0B2D5C] text-[#FFC928] border-[#FFC928]'
                        : isService
                        ? 'bg-[#08254D] text-[#48BB78] border-[#48BB78]'
                        : isFood
                        ? 'bg-[#0B2D5C] text-[#F6AD55] border-[#F6AD55]'
                        : 'bg-[#0B2D5C] text-[#38BDF8] border-[#38BDF8]'
                    }`}
                  >
                    {isHotel ? (
                      <Building2 className="w-5 h-5" />
                    ) : isService ? (
                      <Wrench className="w-4 h-4" />
                    ) : isFood ? (
                      <Utensils className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-5 h-5 fill-current" />
                    )}
                  </div>

                  {/* Pulsing ring for selected pin */}
                  {isSelected && (
                    <span className="absolute inset-0 rounded-full bg-[#FFC928] animate-ping opacity-40 -z-10" />
                  )}
                </div>

                {/* Floating Label */}
                <div
                  className={`mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap shadow-lg transition max-w-[140px] truncate ${
                    isSelected
                      ? 'bg-[#FFC928] text-[#061B3A] ring-2 ring-white/40'
                      : 'bg-[#08254D]/95 text-white border border-white/16'
                  }`}
                >
                  {place.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BOTTOM PLACE PREVIEW CARD */}
      {/* =================================================================== */}
      {activePin && (
        <div className="absolute bottom-20 left-3 right-3 sm:left-6 sm:right-6 max-w-xl mx-auto z-30 animate-in slide-in-from-bottom duration-200 pointer-events-auto">
          <div className="bg-[#0B2D5C]/98 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 sm:p-4 shadow-2xl space-y-3 text-white">
            <div className="flex items-start gap-3">
              {/* Photo Thumbnail */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-white/16 bg-[#08254D] relative">
                {activePin.image ? (
                  <LazyImage
                    src={activePin.image}
                    alt={activePin.name}
                    widthParam={200}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#FFC928]">
                    <MapPin className="w-8 h-8" />
                  </div>
                )}
                {activePin.verified && (
                  <div className="absolute bottom-1 right-1 bg-[#48BB78] text-white p-0.5 rounded-full shadow">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Place Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] bg-[#FFC928] text-[#061B3A] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {activePin.categoryLabel}
                  </span>

                  {/* Rating or New badge */}
                  <div className="flex items-center gap-1 text-[#FFC928] text-xs font-bold shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#FFC928]" />
                    {activePin.rating && activePin.rating > 0 ? (
                      <>
                        <span>{activePin.rating}</span>
                        <span className="text-[10px] text-[#9BAABD] font-normal">({activePin.reviewsCount || 0})</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-[#9BAABD] font-normal">No reviews yet</span>
                    )}
                  </div>
                </div>

                <h4 className="font-bold text-sm sm:text-base text-white truncate mt-1 font-brand-sans">
                  {activePin.name}
                </h4>

                {/* Location / Area */}
                <p className="text-[11px] text-[#D5DCE8] line-clamp-1 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                  <span className="truncate">{activePin.area || activePin.address || 'Shendam LGA'}</span>
                </p>

                {/* Distance Badge if Geolocation is active */}
                {activePinDistance && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded-md mt-1 border border-[#38BDF8]/30">
                    <Navigation className="w-3 h-3" />
                    <span>{activePinDistance}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notice if Coordinates are not yet calibrated */}
            {!hasCoordinates && (
              <div className="bg-[#04142F] border border-[#FFC928]/30 rounded-xl p-2 flex items-center gap-2 text-[11px] text-[#FFC928]">
                <Info className="w-4 h-4 shrink-0" />
                <span>Location coordinates are not available yet. Directions will use the street address.</span>
              </div>
            )}

            {/* Action Buttons: Call, Directions, View Details */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
              {activePin.phone ? (
                <a
                  id="btn-map-call"
                  href={`tel:${activePin.phone.replace(/\s+/g, '')}`}
                  className="py-2.5 bg-[#08254D] hover:bg-[#061F42] border border-white/16 text-[#FFC928] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 text-center cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>CALL</span>
                </a>
              ) : (
                <button
                  disabled
                  className="py-2.5 bg-[#08254D]/50 border border-white/10 text-[#9BAABD] font-semibold text-xs rounded-xl flex items-center justify-center"
                >
                  No Phone
                </button>
              )}

              {/* Get Directions Button */}
              <button
                id="btn-map-get-directions"
                onClick={() => handleGetDirections(activePin)}
                className="py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(255,201,40,0.3)] transition active:scale-95 cursor-pointer text-center"
              >
                <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>DIRECTIONS</span>
              </button>

              {/* View Details Button */}
              <button
                id="btn-map-view-details"
                onClick={() => onSelectPlace(activePin)}
                className="py-2.5 bg-[#08254D] hover:bg-[#061F42] border border-white/16 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>DETAILS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
