import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Crosshair,
  RotateCcw,
  Navigation,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  Building,
  Compass,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';

export interface LocationData {
  address: string;
  area: string;
  landmark?: string;
  lga?: string;
  state?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  mapUrl?: string;
  directionsUrl?: string;
}

interface AdminMapLocationPickerProps {
  locationData: LocationData;
  onChange: (data: Partial<LocationData>) => void;
  listingName?: string;
}

const SHENDAM_AREAS = [
  'Shendam Central',
  'Texas Area',
  'Kalong Road',
  'Yelwa Road',
  'Central Market Area',
  'Shimankar Axis',
  'Mass Transit Hub',
  'Angwan Rogo',
  'Dokan Tofa',
  'Pankshin Road Axis',
  'Lafia Bypass',
  'Ngas Junction'
];

const PRESET_COORDINATES = [
  { label: 'Shendam Central', lat: 8.877, lng: 9.506 },
  { label: 'Texas Hub', lat: 8.882, lng: 9.512 },
  { label: 'Central Market', lat: 8.875, lng: 9.503 },
  { label: 'Mass Transit Park', lat: 8.871, lng: 9.498 },
  { label: 'Kalong Road Junction', lat: 8.889, lng: 9.521 },
  { label: 'Shimankar District', lat: 8.910, lng: 9.540 }
];

const createCustomMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-shendam-marker',
    html: `
      <div style="position: relative; width: 38px; height: 38px; transform: translate(-19px, -38px); cursor: grab; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="#FFC928" stroke="#04142F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3.2" fill="#04142F"></circle>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38]
  });
};

export const AdminMapLocationPicker: React.FC<AdminMapLocationPickerProps> = ({
  locationData,
  onChange,
  listingName = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [latInput, setLatInput] = useState<string>(
    locationData.lat !== undefined && locationData.lat !== null ? String(locationData.lat) : ''
  );
  const [lngInput, setLngInput] = useState<string>(
    locationData.lng !== undefined && locationData.lng !== null ? String(locationData.lng) : ''
  );
  const [coordError, setCoordError] = useState<string | null>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeNotice, setGeocodeNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [suggestedAddress, setSuggestedAddress] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Sync internal string inputs with incoming props when they change externally
  useEffect(() => {
    if (locationData.lat !== undefined && locationData.lat !== null) {
      setLatInput(String(locationData.lat));
    } else {
      setLatInput('');
    }
    if (locationData.lng !== undefined && locationData.lng !== null) {
      setLngInput(String(locationData.lng));
    } else {
      setLngInput('');
    }
  }, [locationData.lat, locationData.lng]);

  // Reverse geocoding helper (OpenStreetMap Nominatim)
  const fetchReverseGeocode = async (lat: number, lng: number) => {
    try {
      setIsReverseGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setSuggestedAddress(data.display_name);
        }
      }
    } catch {
      // Non-blocking, keep quiet
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Update marker on map
  const updateMarkerPosition = (lat: number, lng: number, shouldPan: boolean = false) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: createCustomMarkerIcon(),
        draggable: true,
        autoPan: true
      }).addTo(mapInstanceRef.current);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const newLat = Math.round(pos.lat * 1000000) / 1000000;
        const newLng = Math.round(pos.lng * 1000000) / 1000000;
        setLatInput(String(newLat));
        setLngInput(String(newLng));
        setCoordError(null);
        onChange({ lat: newLat, lng: newLng });
        fetchReverseGeocode(newLat, newLng);
      });

      markerRef.current = marker;
    }

    if (shouldPan) {
      mapInstanceRef.current.setView([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 15));
    }
  };

  // Remove marker
  const removeMarker = () => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setLatInput('');
    setLngInput('');
    setCoordError(null);
    setSuggestedAddress(null);
    onChange({ lat: null, lng: null });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = locationData.lat && !isNaN(locationData.lat) ? locationData.lat : 8.877;
    const initialLng = locationData.lng && !isNaN(locationData.lng) ? locationData.lng : 9.506;
    const initialZoom = locationData.lat && locationData.lng ? 15 : 13;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // If initial coordinates exist, place the marker
    if (locationData.lat && locationData.lng && !isNaN(locationData.lat) && !isNaN(locationData.lng)) {
      updateMarkerPosition(locationData.lat, locationData.lng, false);
    }

    // Click/tap on map places/moves marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Math.round(e.latlng.lat * 1000000) / 1000000;
      const clickedLng = Math.round(e.latlng.lng * 1000000) / 1000000;
      setLatInput(String(clickedLat));
      setLngInput(String(clickedLng));
      setCoordError(null);
      updateMarkerPosition(clickedLat, clickedLng, false);
      onChange({ lat: clickedLat, lng: clickedLng });
      fetchReverseGeocode(clickedLat, clickedLng);
    });

    // Invalidate size once rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Handle manual coordinate input changes
  const handleLatChange = (val: string) => {
    setLatInput(val);
    if (!val.trim()) {
      if (!lngInput.trim()) {
        removeMarker();
      }
      return;
    }
    const numLat = parseFloat(val);
    const numLng = parseFloat(lngInput);
    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      setCoordError('Latitude must be a valid number between -90.0 and 90.0');
      return;
    }
    setCoordError(null);
    if (!isNaN(numLng) && numLng >= -180 && numLng <= 180) {
      updateMarkerPosition(numLat, numLng, true);
      onChange({ lat: numLat, lng: numLng });
    }
  };

  const handleLngChange = (val: string) => {
    setLngInput(val);
    if (!val.trim()) {
      if (!latInput.trim()) {
        removeMarker();
      }
      return;
    }
    const numLat = parseFloat(latInput);
    const numLng = parseFloat(val);
    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      setCoordError('Longitude must be a valid number between -180.0 and 180.0');
      return;
    }
    setCoordError(null);
    if (!isNaN(numLat) && numLat >= -90 && numLat <= 90) {
      updateMarkerPosition(numLat, numLng, true);
      onChange({ lat: numLat, lng: numLng });
    }
  };

  // Find on Map / Locate Address Geocoding
  const handleFindOnMap = async () => {
    const rawAddress = locationData.address || '';
    const rawArea = locationData.area || '';
    const searchTarget = rawAddress.trim() || rawArea.trim() || listingName;

    if (!searchTarget) {
      setGeocodeNotice({
        type: 'error',
        text: 'Please enter a Street Address or Area before locating on map.'
      });
      return;
    }

    setIsGeocoding(true);
    setGeocodeNotice(null);

    // Prepare search queries with Shendam / Plateau Nigeria context
    const queries = [
      `${searchTarget}, Shendam, Plateau, Nigeria`,
      `${searchTarget}, Shendam, Nigeria`,
      `${searchTarget}, Plateau, Nigeria`,
      searchTarget
    ];

    let foundCoord: { lat: number; lng: number; displayName: string } | null = null;

    try {
      for (const q of queries) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
            foundCoord = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              displayName: data[0].display_name
            };
            break;
          }
        }
      }

      if (foundCoord) {
        const roundedLat = Math.round(foundCoord.lat * 1000000) / 1000000;
        const roundedLng = Math.round(foundCoord.lng * 1000000) / 1000000;
        setLatInput(String(roundedLat));
        setLngInput(String(roundedLng));
        setCoordError(null);
        updateMarkerPosition(roundedLat, roundedLng, true);
        onChange({ lat: roundedLat, lng: roundedLng });
        setGeocodeNotice({
          type: 'success',
          text: `Located: ${foundCoord.displayName.slice(0, 80)}... You can drag the marker to refine the exact spot.`
        });
        setSuggestedAddress(foundCoord.displayName);
      } else {
        setGeocodeNotice({
          type: 'error',
          text: `Address could not be automatically located on the map. You can tap or drag the marker anywhere on the map to set the exact spot manually.`
        });
      }
    } catch {
      setGeocodeNotice({
        type: 'error',
        text: 'Network issue connecting to location service. You can click on the map to place the marker manually.'
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Quick Preset Selection
  const handleApplyPreset = (preset: { label: string; lat: number; lng: number }) => {
    setLatInput(String(preset.lat));
    setLngInput(String(preset.lng));
    setCoordError(null);
    updateMarkerPosition(preset.lat, preset.lng, true);
    onChange({
      lat: preset.lat,
      lng: preset.lng,
      area: preset.label
    });
    fetchReverseGeocode(preset.lat, preset.lng);
  };

  const hasValidCoordinates =
    locationData.lat !== undefined &&
    locationData.lat !== null &&
    !isNaN(locationData.lat) &&
    locationData.lng !== undefined &&
    locationData.lng !== null &&
    !isNaN(locationData.lng) &&
    (locationData.lat !== 0 || locationData.lng !== 0);

  return (
    <div className="space-y-4">
      {/* 1. ADDRESS DETAILS FORM */}
      <div className="bg-[#08254D] border border-white/14 rounded-2xl p-4 space-y-3.5">
        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FFC928]" />
          <span>Address & Regional Details</span>
        </h4>

        {/* Street Address */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
            Street Address / Physical Location *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. KM 2, Kalong Road, Dungpit, Shendam"
              value={locationData.address || ''}
              onChange={(e) => onChange({ address: e.target.value })}
              className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        {/* Area / Neighborhood & Landmark */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Area / Neighborhood *
            </label>
            <div className="space-y-1.5">
              <select
                value={locationData.area || 'Shendam Central'}
                onChange={(e) => onChange({ area: e.target.value })}
                className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
              >
                {SHENDAM_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Nearest Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Beside Shendam Central Mosque, Opposite Motor Park"
              value={locationData.landmark || ''}
              onChange={(e) => onChange({ landmark: e.target.value })}
              className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        {/* LGA, State, Country */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Local Govt Area (LGA)
            </label>
            <input
              type="text"
              value={locationData.lga || 'Shendam'}
              onChange={(e) => onChange({ lga: e.target.value })}
              placeholder="Shendam"
              className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              State
            </label>
            <input
              type="text"
              value={locationData.state || 'Plateau State'}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="Plateau State"
              className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Country
            </label>
            <input
              type="text"
              value={locationData.country || 'Nigeria'}
              onChange={(e) => onChange({ country: e.target.value })}
              placeholder="Nigeria"
              className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        {/* Geocode Button "Find on Map" */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          <p className="text-[11px] text-[#9BAABD]">
            Locate coordinates automatically from address or click on the map below.
          </p>
          <button
            type="button"
            id="btn-admin-find-on-map"
            onClick={handleFindOnMap}
            disabled={isGeocoding}
            className="px-3.5 py-1.5 rounded-xl bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isGeocoding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Find on Map</span>
              </>
            )}
          </button>
        </div>

        {/* Geocoding Notice */}
        {geocodeNotice && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              geocodeNotice.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : geocodeNotice.type === 'error'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-[#051C3D] border-white/14 text-[#9BAABD]'
            }`}
          >
            {geocodeNotice.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{geocodeNotice.text}</span>
          </div>
        )}

        {/* Suggested Reverse Geocoding Address Banner */}
        {suggestedAddress && suggestedAddress !== locationData.address && (
          <div className="p-3 bg-[#051C3D] border border-[#FFC928]/30 rounded-xl space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-white block">Detected Address from Marker:</span>
                <span className="text-[#9BAABD] text-[11px] line-clamp-2">{suggestedAddress}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuggestedAddress(null)}
                className="px-2.5 py-1 text-[10px] text-[#9BAABD] hover:text-white font-bold cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({ address: suggestedAddress });
                  setSuggestedAddress(null);
                }}
                className="px-3 py-1 bg-[#FFC928]/20 hover:bg-[#FFC928] text-[#FFC928] hover:text-[#04142F] border border-[#FFC928]/40 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
              >
                Apply to Address Field
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. INTERACTIVE LEAFLET / OPENSTREETMAP PICKER */}
      <div className="bg-[#08254D] border border-white/14 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#FFC928]" />
              <span>Interactive Map Location Picker</span>
            </h4>
            <p className="text-[11px] text-[#9BAABD]">
              Click/tap on map or drag marker to set exact coordinates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasValidCoordinates ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> Exact Location Placed
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Location Not Placed
              </span>
            )}

            {hasValidCoordinates && (
              <button
                type="button"
                onClick={removeMarker}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1"
                title="Clear Coordinates"
              >
                <Trash2 className="w-3 h-3" /> Clear Pin
              </button>
            )}
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-white/16 shadow-inner bg-[#061B3A]">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Overlay Helper Tooltip */}
          <div className="absolute top-2 left-2 z-20 pointer-events-none bg-[#04142F]/90 backdrop-blur-md border border-white/14 px-2.5 py-1 rounded-lg text-[10px] text-white font-medium shadow-md">
            📍 Tap map or drag marker
          </div>
        </div>

        {/* Prominent Coordinates Display (User Requirement: Display: Latitude: [value], Longitude: [value]) */}
        <div className="bg-[#051C3D] border border-white/10 rounded-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-white">Selected Coordinates:</span>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-[#FFC928]">
                <strong>Latitude:</strong> {locationData.lat !== undefined && locationData.lat !== null ? locationData.lat : 'Not set'}
              </span>
              <span className="text-[#FFC928]">
                <strong>Longitude:</strong> {locationData.lng !== undefined && locationData.lng !== null ? locationData.lng : 'Not set'}
              </span>
            </div>
          </div>

          {/* Coordinate Numerical Manual Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                step="any"
                placeholder="8.877000"
                value={latInput}
                onChange={(e) => handleLatChange(e.target.value)}
                className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                step="any"
                placeholder="9.506000"
                value={lngInput}
                onChange={(e) => handleLngChange(e.target.value)}
                className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
              />
            </div>
          </div>

          {coordError && (
            <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {coordError}
            </p>
          )}
        </div>

        {/* Quick Shendam Area Coordinate Presets */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1.5">
            Quick Shendam Hub Presets:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COORDINATES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white/8 hover:bg-[#FFC928] hover:text-[#04142F] transition border border-white/10 cursor-pointer"
              >
                📍 {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. EXTERNAL MAP & DIRECTIONS URLS */}
      <div className="bg-[#08254D] border border-white/14 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[#FFC928]" />
          <span>External Map & Navigation Links</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Map URL */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1 flex items-center justify-between">
              <span>Google Maps URL (map_url)</span>
              <span className="text-[9px] text-[#9BAABD] font-normal">Auto if empty</span>
            </label>
            <input
              type="url"
              placeholder="https://www.google.com/maps?q=..."
              value={locationData.mapUrl || ''}
              onChange={(e) => onChange({ mapUrl: e.target.value })}
              className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>

          {/* Directions URL */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1 flex items-center justify-between">
              <span>Directions URL (directions_url)</span>
              <span className="text-[9px] text-[#9BAABD] font-normal">Auto if empty</span>
            </label>
            <input
              type="url"
              placeholder="https://www.google.com/maps/dir/?api=1&..."
              value={locationData.directionsUrl || ''}
              onChange={(e) => onChange({ directionsUrl: e.target.value })}
              className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
