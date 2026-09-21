import React, { useState, useEffect, useRef } from 'react';
import { Place, PlaceReview } from '../types';
import { LazyImage } from '../utils/imageOptimizer';
import { trackEvent } from '../utils/analytics';
import {
  X,
  Bookmark,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Navigation,
  Share2,
  CheckCircle2,
  Send,
  CalendarCheck,
  Info,
  BedDouble,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  User,
  Smartphone,
  Package,
  Wrench,
  Utensils,
  Compass,
  Layers,
  Check
} from 'lucide-react';

interface PlaceDetailModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (placeId: string) => void;
  onAddReview?: (placeId: string, review: Omit<PlaceReview, 'id' | 'date'>) => void;
  onViewOnMap?: (place: Place) => void;
  onOpenBooking?: (place: Place, preselectedRoom?: string) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onAddReview,
  onViewOnMap,
  onOpenBooking
}) => {
  const [activeImage, setActiveImage] = useState<string>('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const roomsRef = useRef<HTMLDivElement | null>(null);

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    services: true,
    rooms: true,
    menu: true,
    accessories: false,
    brands: false,
    gallery: false,
    contact: false,
    location: false,
    reviews: false
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Reset active image when place changes
  useEffect(() => {
    if (place) {
      setActiveImage('');
    }
  }, [place?.id]);

  useEffect(() => {
    if (isOpen && place) {
      if (place.category === 'hotels') {
        trackEvent('hotel_viewed', { entityId: place.id, entityTitle: place.name, category: place.category });
      } else if (place.category === 'tourist_spots') {
        trackEvent('attraction_viewed', { entityId: place.id, entityTitle: place.name, category: place.category });
      } else {
        trackEvent('business_viewed', { entityId: place.id, entityTitle: place.name, category: place.category });
      }
    }
  }, [isOpen, place]);

  if (!isOpen || !place) return null;

  // Real photos only
  const validGallery = (place.gallery && Array.isArray(place.gallery) ? place.gallery : []).filter(
    (img) => Boolean(img && typeof img === 'string' && img.trim())
  );
  const gallery = validGallery.length > 0 ? validGallery : (place.image && place.image.trim() ? [place.image] : []);
  const currentCover = activeImage || (gallery.length > 0 ? gallery[0] : (place.image && place.image.trim() ? place.image : ''));

  // Collect actual services / capabilities / amenities
  const allServices: string[] = [];
  if (Array.isArray(place.services)) {
    place.services.forEach((s) => s && typeof s === 'string' && s.trim() && allServices.push(s.trim()));
  }
  if (Array.isArray(place.amenities)) {
    place.amenities.forEach((a) => {
      if (a && typeof a === 'string' && a.trim() && a !== 'No details available yet.' && !allServices.includes(a.trim())) {
        allServices.push(a.trim());
      }
    });
  }
  if (Array.isArray(place.additionalServices)) {
    place.additionalServices.forEach((as) => {
      if (as && typeof as === 'string' && as.trim() && !allServices.includes(as.trim())) {
        allServices.push(as.trim());
      }
    });
  }

  // Collect actual accessories or products
  const allAccessories: string[] = [];
  if (Array.isArray(place.accessories)) {
    place.accessories.forEach((acc) => acc && typeof acc === 'string' && acc.trim() && allAccessories.push(acc.trim()));
  }
  if (Array.isArray(place.products)) {
    place.products.forEach((prod) => prod && typeof prod === 'string' && prod.trim() && !allAccessories.includes(prod.trim()) && allAccessories.push(prod.trim()));
  }

  // Collect supported brands / devices
  const allSupportedBrands = Array.isArray(place.supportedBrands)
    ? place.supportedBrands.filter((b) => Boolean(b && typeof b === 'string' && b.trim()))
    : [];

  // Real reviews only from database
  const realReviews: PlaceReview[] = Array.isArray(place.reviews) ? place.reviews : [];
  const hasRealReviews = realReviews.length > 0;
  const computedRating = hasRealReviews && place.rating && place.rating > 0 ? place.rating : null;
  const computedReviewCount = realReviews.length;

  const isHotel = place.category === 'hotels' || Boolean(place.rooms && place.rooms.length > 0);
  const isRestaurant = place.category === 'restaurants' || Boolean(place.menuItems && place.menuItems.length > 0);
  const isServiceOrRepair = place.category === 'services' || place.category === 'businesses';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    const shareText = `${place.name} - ${place.address} | Shendam Connect`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('Link copied to clipboard!');
    }
  };

  const handleCall = () => {
    trackEvent('call_clicked', { entityId: place.id, entityTitle: place.name, category: place.category });
    if (place.phone && place.phone.trim()) {
      window.location.href = `tel:${place.phone.trim()}`;
    } else {
      showToast('No phone number available yet.');
    }
  };

  const handleGetDirections = () => {
    trackEvent('directions_clicked' as any, { entityId: place.id, entityTitle: place.name, category: place.category });
    onClose();

    if (place.directionsUrl || place.directions_url) {
      window.open(place.directionsUrl || place.directions_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (place.mapUrl || place.map_url) {
      window.open(place.mapUrl || place.map_url, '_blank', 'noopener,noreferrer');
      return;
    }

    const destLat = place.coordinates?.lat;
    const destLng = place.coordinates?.lng;
    const destination = (destLat && destLng && destLat !== 0) ? `${destLat},${destLng}` : `${place.name}, ${place.address}`;

    if (navigator.geolocation) {
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
        { timeout: 8000, maximumAge: 60000 }
      );
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWhatsApp = () => {
    trackEvent('whatsapp_clicked', { entityId: place.id, entityTitle: place.name, category: place.category });
    const isPaulGSM = place.id === 'place-paul-gsm' || place.name.toLowerCase().includes('paul gsm');
    const targetNum = place.whatsapp || (isPaulGSM ? '+234 706 728 7969' : place.phone);
    if (targetNum && targetNum.trim()) {
      let cleanNum = targetNum.replace(/[^0-9]/g, '');
      if (cleanNum.startsWith('0') && cleanNum.length === 11) {
        cleanNum = '234' + cleanNum.substring(1);
      }
      const defaultText = encodeURIComponent(`Hello! I found ${place.name} on Shendam Connect and would like to make an inquiry.`);
      window.open(`https://wa.me/${cleanNum}?text=${defaultText}`, '_blank', 'noopener,noreferrer');
    } else {
      showToast('No WhatsApp number available yet.');
    }
  };

  const handleBooking = (preselectedRoom?: string) => {
    trackEvent('booking_started', { entityId: place.id, entityTitle: place.name, category: place.category });
    if (onOpenBooking) {
      onOpenBooking(place, preselectedRoom);
    } else if (place.phone && place.phone.trim()) {
      window.location.href = `tel:${place.phone}`;
    } else if (place.whatsapp && place.whatsapp.trim()) {
      let cleanNum = place.whatsapp.replace(/[^0-9]/g, '');
      if (cleanNum.startsWith('0') && cleanNum.length === 11) {
        cleanNum = '234' + cleanNum.substring(1);
      }
      window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(`Hello, I would like to make a reservation enquiry for ${place.name}.`)}`, '_blank');
    } else {
      showToast('No reservation details available yet.');
    }
  };

  const handleScrollToRooms = () => {
    setExpandedSections((prev) => ({ ...prev, rooms: true }));
    if (roomsRef.current) {
      roomsRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleBooking();
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !author.trim()) return;

    setIsSubmittingReview(true);
    try {
      if (onAddReview) {
        await onAddReview(place.id, {
          author: author.trim(),
          rating,
          comment: comment.trim()
        });
      }
      setComment('');
      setAuthor('');
      setShowReviewForm(false);
      setExpandedSections((prev) => ({ ...prev, reviews: true }));
      showToast('Review submitted successfully!');
    } catch {
      showToast('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div
      id="place-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="place-detail-card"
        className="bg-[#0B2D5C] border border-white/16 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar"
      >
        {/* =================================================================== */}
        {/* 1. COVER PHOTO & TOP BAR */}
        {/* =================================================================== */}
        <div className="relative w-full h-60 sm:h-68 bg-[#08254D] shrink-0">
          <LazyImage
            src={currentCover}
            alt={place.name}
            widthParam={800}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C] via-black/20 to-black/60" />

          {/* Top Floating Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button
              id="btn-close-detail-modal"
              onClick={onClose}
              aria-label="Close modal"
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                id="btn-share-place"
                onClick={handleShare}
                aria-label="Share place"
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer border border-white/10"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                id="btn-save-place"
                onClick={() => onToggleSave(place.id)}
                aria-label="Save Place"
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-[#FFC928] flex items-center justify-center hover:bg-black/80 transition cursor-pointer border border-white/10"
              >
                <Bookmark
                  className={`w-5 h-5 ${isSaved ? 'fill-[#FFC928]' : 'stroke-[2]'}`}
                />
              </button>
            </div>
          </div>

          {/* Category & Verification Badges on Cover */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#FFC928] text-[#061B3A] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                {place.categoryLabel}
              </span>
              {place.priceRange && place.priceRange !== 'No details available yet.' && (
                <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                  {place.priceRange}
                </span>
              )}
            </div>

            {place.verified && (
              <span className="inline-flex items-center gap-1 bg-[#48BB78]/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20 shadow">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#FFC928] text-[#061B3A] font-extrabold text-xs px-4 py-2 rounded-full shadow-xl z-40 border border-white/20 animate-in fade-in slide-in-from-top-2 duration-150 whitespace-nowrap">
            {toastMessage}
          </div>
        )}

        {/* =================================================================== */}
        {/* CONTENT BODY */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 space-y-4">

          {/* 1. OVERVIEW CARD */}
          <div id="section-overview" className="bg-[#08254D] border border-white/16 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {place.logo && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#FFC928]/40 shrink-0 bg-[#04142F] p-0.5 shadow">
                    <img src={place.logo} alt={`${place.name} logo`} className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-xl sm:text-2xl text-white leading-tight font-brand-sans">
                    {place.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-[#9BAABD] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                    <span>{place.area || place.address || 'Shendam LGA, Plateau State'}</span>
                  </div>
                </div>
              </div>

              {/* Rating Pill */}
              <div className="flex items-center gap-1 bg-[#04142F] border border-white/16 px-2.5 py-1.5 rounded-xl shrink-0">
                <Star className="w-4 h-4 text-[#FFC928] fill-[#FFC928]" />
                {computedRating ? (
                  <>
                    <span className="font-bold text-sm text-white">{computedRating}</span>
                    <span className="text-[10px] text-[#9BAABD]">({computedReviewCount})</span>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-[#9BAABD]">No reviews yet</span>
                )}
              </div>
            </div>

            {/* Description */}
            {place.description && place.description !== 'No information available yet.' && (
              <p className="text-xs sm:text-sm text-[#D5DCE8] leading-relaxed pt-2 border-t border-white/10">
                {place.description}
              </p>
            )}

            {/* Quick Meta List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-[#D5DCE8]">
              {place.owner && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                  <span><strong className="text-white">Contact / Owner:</strong> {place.owner}</span>
                </div>
              )}
              {place.openingHours && place.openingHours !== 'No details available yet.' && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                  <span><strong className="text-white">Hours:</strong> {place.openingHours}</span>
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {isHotel ? (
                <>
                  <button
                    id="btn-view-rooms"
                    onClick={handleScrollToRooms}
                    className="py-3 bg-[#04142F] hover:bg-[#061E40] active:scale-98 text-[#FFC928] border border-[#FFC928]/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <BedDouble className="w-4 h-4 text-[#FFC928]" />
                    <span>VIEW ROOMS</span>
                  </button>

                  <button
                    id="btn-request-booking"
                    onClick={() => handleBooking()}
                    className="py-3 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] font-black text-xs rounded-xl shadow-[0_4px_16px_rgba(255,201,40,0.25)] flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CalendarCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>BOOK / INQUIRE</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="btn-call-primary"
                    onClick={handleCall}
                    className="py-3 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] font-black text-xs rounded-xl shadow-[0_4px_16px_rgba(255,201,40,0.25)] flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Phone className="w-4 h-4 stroke-[2.5]" />
                    <span>CALL NOW</span>
                  </button>

                  <button
                    id="btn-whatsapp-primary"
                    onClick={handleWhatsApp}
                    className="py-3 bg-[#04142F] hover:bg-[#061E40] active:scale-98 text-[#48BB78] border border-[#48BB78]/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-[#48BB78]" />
                    <span>WHATSAPP</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. SERVICES & REPAIRS / AMENITIES (Expandable) */}
          {/* ================================================================= */}
          {allServices.length > 0 && (
            <div id="section-services" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
              <button
                type="button"
                id="btn-toggle-services"
                onClick={() => toggleSection('services')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                    {isServiceOrRepair ? <Wrench className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {isServiceOrRepair ? 'Services & Repairs' : isHotel ? 'Facilities & Amenities' : 'Services & Features'}
                    </h3>
                    <p className="text-[11px] text-[#9BAABD]">{allServices.length} listed capabilities</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#FFC928] tracking-wider hidden sm:inline">
                    {expandedSections.services ? 'Collapse' : 'Tap to view'}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.services ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {expandedSections.services && (
                <div className="p-3.5 pt-1 border-t border-white/10 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {allServices.map((service, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs bg-[#04142F] border border-white/10 text-[#D5DCE8] px-3 py-2 rounded-xl"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                        <span className="leading-snug">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. ACCESSORIES / PRODUCTS (Expandable, Real data only) */}
          {/* ================================================================= */}
          {allAccessories.length > 0 && (
            <div id="section-accessories" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
              <button
                type="button"
                id="btn-toggle-accessories"
                onClick={() => toggleSection('accessories')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#48BB78]/15 border border-[#48BB78]/30 flex items-center justify-center text-[#48BB78]">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Accessories & Products</h3>
                    <p className="text-[11px] text-[#9BAABD]">{allAccessories.length} available items</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#48BB78] tracking-wider hidden sm:inline">
                    {expandedSections.accessories ? 'Collapse' : 'Tap to view'}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.accessories ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {expandedSections.accessories && (
                <div className="p-3.5 pt-1 border-t border-white/10 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {allAccessories.map((acc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs bg-[#04142F] border border-white/10 text-[#D5DCE8] px-3 py-2 rounded-xl"
                      >
                        <Check className="w-3.5 h-3.5 text-[#48BB78] shrink-0" />
                        <span className="leading-snug">{acc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. SUPPORTED BRANDS / DEVICES (Expandable, Real data only) */}
          {/* ================================================================= */}
          {allSupportedBrands.length > 0 && (
            <div id="section-supported-brands" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
              <button
                type="button"
                id="btn-toggle-brands"
                onClick={() => toggleSection('brands')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Supported Smartphone Brands</h3>
                    <p className="text-[11px] text-[#9BAABD]">{allSupportedBrands.length} brands serviced</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#FFC928] tracking-wider hidden sm:inline">
                    {expandedSections.brands ? 'Collapse' : 'Tap to view'}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.brands ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {expandedSections.brands && (
                <div className="p-3.5 pt-1 border-t border-white/10 animate-in fade-in duration-200">
                  <div className="flex flex-wrap gap-1.5">
                    {allSupportedBrands.map((brand, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-[#04142F] border border-white/10 text-[#D5DCE8] px-2.5 py-1.5 rounded-xl font-medium"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. HOTEL ROOM OPTIONS & RATES (Real data only) */}
          {/* ================================================================= */}
          {place.rooms && place.rooms.length > 0 && (
            <div ref={roomsRef} id="section-hotel-rooms" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
              <button
                type="button"
                id="btn-toggle-rooms"
                onClick={() => toggleSection('rooms')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                    <BedDouble className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Room Options & Rates</h3>
                    <p className="text-[11px] text-[#9BAABD]">{place.rooms.length} room types available</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#FFC928] tracking-wider hidden sm:inline">
                    {expandedSections.rooms ? 'Collapse' : 'Tap to view'}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.rooms ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {expandedSections.rooms && (
                <div className="p-3.5 pt-1 border-t border-white/10 space-y-2.5 animate-in fade-in duration-200">
                  {place.rooms.map((room, idx) => (
                    <div
                      key={idx}
                      className="bg-[#04142F] border border-white/16 hover:border-[#FFC928]/50 rounded-2xl p-3.5 flex flex-col gap-2 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-white font-brand-sans">{room.name}</h4>
                          {room.description && (
                            <p className="text-[11px] text-[#9BAABD] mt-0.5 leading-relaxed">
                              {room.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="inline-block bg-[#FFC928]/15 border border-[#FFC928]/30 text-[#FFC928] font-bold text-xs px-2.5 py-1 rounded-xl">
                            {room.price}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/8 flex items-center justify-between">
                        <span className="text-[10px] text-[#9BAABD]">Per night • Pay at check-in</span>
                        <button
                          onClick={() => handleBooking(room.name)}
                          className="px-3 py-1.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold text-[11px] rounded-xl transition cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          <span>Request Room</span>
                          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 bg-[#04142F]/80 rounded-xl border border-white/10 flex items-start gap-2 text-[11px] text-[#9BAABD] leading-relaxed">
                    <Info className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
                    <span>
                      <strong>Booking Notice:</strong> "Request Room" submits your reservation request directly to {place.name}.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 6. PHOTO GALLERY (Expandable, Real Photos only) */}
          {/* ================================================================= */}
          {gallery.length > 0 && (
            <div id="section-photo-gallery" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
              <button
                type="button"
                id="btn-toggle-gallery"
                onClick={() => toggleSection('gallery')}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Photo Gallery</h3>
                    <p className="text-[11px] text-[#9BAABD]">{gallery.length} verified photos</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#FFC928] tracking-wider hidden sm:inline">
                    {expandedSections.gallery ? 'Collapse' : 'Tap to view'}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.gallery ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {expandedSections.gallery && (
                <div className="p-3.5 pt-1 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
                  <p className="text-[11px] text-[#9BAABD]">Tap a photo to preview in large format above:</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {gallery.map((imgUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(imgUrl)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer active:scale-95 ${
                          currentCover === imgUrl ? 'border-[#FFC928] shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <LazyImage src={imgUrl} alt={`${place.name} photo ${i + 1}`} widthParam={200} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 7. CONTACT & INQUIRIES (Expandable) */}
          {/* ================================================================= */}
          <div id="section-contact" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
            <button
              type="button"
              id="btn-toggle-contact"
              onClick={() => toggleSection('contact')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#48BB78]/15 border border-[#48BB78]/30 flex items-center justify-center text-[#48BB78]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Contact & Communication</h3>
                  <p className="text-[11px] text-[#9BAABD]">Direct call, WhatsApp & contact details</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#48BB78] tracking-wider hidden sm:inline">
                  {expandedSections.contact ? 'Collapse' : 'Tap to view'}
                </span>
                <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.contact ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {expandedSections.contact && (
              <div className="p-3.5 pt-1 border-t border-white/10 space-y-2.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Phone */}
                  <div className="p-3 bg-[#04142F] rounded-xl border border-white/10 flex flex-col justify-center items-start">
                    <span className="text-[10px] text-[#9BAABD] block uppercase font-bold mb-1.5">Phone Number</span>
                    {place.phone ? (
                      <button
                        onClick={handleCall}
                        className="px-4 py-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-bold text-xs rounded-lg transition flex items-center gap-2"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Call Business
                      </button>
                    ) : (
                      <span className="text-xs text-[#9BAABD] font-medium block">Not available</span>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div className="p-3 bg-[#04142F] rounded-xl border border-white/10 flex flex-col justify-center items-start">
                    <span className="text-[10px] text-[#9BAABD] block uppercase font-bold mb-1.5">WhatsApp Direct</span>
                    {(place.whatsapp || place.phone || place.id === 'place-paul-gsm' || place.name.toLowerCase().includes('paul gsm')) ? (
                      <button
                        onClick={handleWhatsApp}
                        className="px-4 py-2 bg-[#48BB78] hover:bg-[#38A169] text-white font-bold text-xs rounded-lg transition flex items-center gap-2"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Message on WhatsApp
                      </button>
                    ) : (
                      <span className="text-xs text-[#9BAABD] font-medium block">Not available</span>
                    )}
                  </div>
                </div>

                {place.owner && (
                  <div className="p-2.5 bg-[#04142F] rounded-xl border border-white/10 text-xs text-[#D5DCE8] flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                    <span><strong className="text-white">Business Owner / Manager:</strong> {place.owner}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 8. LOCATION & DIRECTIONS (Expandable) */}
          {/* ================================================================= */}
          <div id="section-location" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
            <button
              type="button"
              id="btn-toggle-location"
              onClick={() => toggleSection('location')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Location & Directions</h3>
                  <p className="text-[11px] text-[#9BAABD] truncate max-w-[220px]">{place.address || 'Shendam LGA'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#FFC928] tracking-wider hidden sm:inline">
                  {expandedSections.location ? 'Collapse' : 'Tap to view'}
                </span>
                <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.location ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {expandedSections.location && (
              <div className="p-3.5 pt-1 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
                <div className="p-3 bg-[#04142F] rounded-xl border border-white/10 space-y-2 text-xs text-[#D5DCE8]">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">{place.name}</span>
                      <span className="text-[#D5DCE8]">{place.address || 'No detailed address provided.'}</span>
                    </div>
                  </div>

                  {place.landmark && (
                    <div className="pt-1 border-t border-white/8 text-[11px] text-[#9BAABD]">
                      <span className="text-white font-bold">Landmark:</span> {place.landmark}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-[11px] text-[#9BAABD] pt-1 border-t border-white/8">
                    <span><strong>Area:</strong> {place.area || 'Shendam Central'}</span>
                    <span>•</span>
                    <span><strong>LGA:</strong> {place.lga || 'Shendam'}</span>
                    <span>•</span>
                    <span><strong>State:</strong> {place.state || 'Plateau State'}</span>
                  </div>

                  <div className="text-[11px] pt-1">
                    {place.coordinates && typeof place.coordinates.lat === 'number' && typeof place.coordinates.lng === 'number' && place.coordinates.lat !== 0 ? (
                      <span className="text-[#38BDF8] font-mono font-medium">
                        Coordinates: {place.coordinates.lat.toFixed(6)}, {place.coordinates.lng.toFixed(6)}
                      </span>
                    ) : (
                      <span className="text-[#FFC928] font-medium flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 inline" /> Location coordinates not available yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-get-directions-map"
                    onClick={handleGetDirections}
                    className="py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Navigation className="w-4 h-4 stroke-[2.5]" />
                    <span>OPEN IN GOOGLE MAPS</span>
                  </button>

                  {onViewOnMap && (
                    <button
                      id="btn-view-on-shendam-map"
                      onClick={() => {
                        onClose();
                        onViewOnMap(place);
                      }}
                      className="py-2.5 bg-[#04142F] hover:bg-[#061E40] text-[#FFC928] border border-[#FFC928]/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Compass className="w-4 h-4 text-[#FFC928]" />
                      <span>VIEW ON SHENDAM MAP</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* 9. REVIEWS (Expandable, Only Real Database Reviews) */}
          {/* ================================================================= */}
          <div id="section-reviews" className="border border-white/16 rounded-2xl bg-[#08254D] overflow-hidden transition">
            <button
              type="button"
              id="btn-toggle-reviews"
              onClick={() => toggleSection('reviews')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                  <Star className="w-4 h-4 fill-[#FFC928]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Genuine Reviews</h3>
                  <p className="text-[11px] text-[#9BAABD]">
                    {hasRealReviews ? `${realReviews.length} community review(s)` : 'No reviews yet'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#FFC928] tracking-wider hidden sm:inline">
                  {expandedSections.reviews ? 'Collapse' : 'Tap to view'}
                </span>
                <div className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-[#FFC928] transition-transform duration-200 ${expandedSections.reviews ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </button>

            {expandedSections.reviews && (
              <div className="p-3.5 pt-1 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9BAABD]">
                    {hasRealReviews ? `Showing ${realReviews.length} real review(s)` : 'Be the first to leave feedback'}
                  </span>
                  <button
                    id="btn-write-review-toggle"
                    type="button"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-[#FFC928] hover:underline text-xs font-bold cursor-pointer"
                  >
                    {showReviewForm ? 'Cancel' : '+ Write Review'}
                  </button>
                </div>

                {/* Write Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="bg-[#04142F] border border-white/16 rounded-2xl p-3.5 space-y-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Leave a Review</h4>
                    <input
                      type="text"
                      required
                      placeholder="Your Name (e.g. John Nanle)"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-[#08254D] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9BAABD]">Your Rating:</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRating(star)}
                            className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= rating ? 'text-[#FFC928] fill-[#FFC928]' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      required
                      placeholder="Share your genuine experience with this place..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-[#08254D] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928] resize-none"
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full py-2.5 bg-[#FFC928] hover:bg-[#F5B800] disabled:opacity-50 text-[#061B3A] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</span>
                    </button>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-2">
                  {hasRealReviews ? (
                    realReviews.map((rev) => (
                      <div key={rev.id} className="bg-[#04142F] p-3 rounded-xl border border-white/12 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{rev.author}</span>
                          <div className="flex items-center gap-1 text-[#FFC928]">
                            <Star className="w-3.5 h-3.5 fill-[#FFC928]" />
                            <span className="font-bold text-[11px]">{rev.rating}</span>
                          </div>
                        </div>
                        <p className="text-[#D5DCE8] text-[11px] mt-1.5 leading-relaxed">{rev.comment}</p>
                        <span className="text-[10px] text-[#9BAABD]/70 mt-1 block">{rev.date}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#04142F] p-4 rounded-xl border border-white/10 text-center space-y-1">
                      <p className="text-xs font-semibold text-[#D5DCE8]">No reviews yet.</p>
                      <p className="text-[11px] text-[#9BAABD]">Be the first to share your experience with {place.name}.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlaceDetailModal;
