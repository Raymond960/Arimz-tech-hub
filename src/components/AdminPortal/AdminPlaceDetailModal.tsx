import React, { useState } from 'react';
import { Place } from '../../types';
import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Star,
  ShieldCheck,
  Building2,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  DollarSign,
  User,
  Wrench,
  ShoppingBag,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Compass,
  HeartHandshake
} from 'lucide-react';

interface AdminPlaceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
  onEdit: (place: Place) => void;
  onDelete: (placeId: string, placeName: string) => void;
  onToggleStatus?: (place: Place) => void;
  onToggleFeatured?: (place: Place) => void;
  onDeleteReview?: (placeId: string, reviewId: string) => Promise<void> | void;
}

export const AdminPlaceDetailModal: React.FC<AdminPlaceDetailModalProps> = ({
  isOpen,
  onClose,
  place,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onDeleteReview
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!isOpen || !place) return null;

  const gallery = Array.isArray(place.gallery) && place.gallery.length > 0
    ? place.gallery
    : [place.image];

  const currentPhoto = gallery[activePhotoIdx] || place.image;
  const isDraft = place.status === 'draft';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto font-brand-sans">
      <div className="bg-[#051C3D] border border-white/14 rounded-3xl max-w-3xl w-full my-auto text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#08254D] border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {place.logo ? (
              <img
                src={place.logo}
                alt={place.name}
                className="w-10 h-10 rounded-2xl object-cover border border-[#FFC928]"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#FFC928]/20 border border-[#FFC928]/40 flex items-center justify-center text-[#FFC928]">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{place.name}</h3>
                {place.verified && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9BAABD]">
                {place.categoryLabel || place.category.toUpperCase()} • {place.area}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(place);
              }}
              className="flex items-center gap-1.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-[#9BAABD] hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 no-scrollbar">
          {/* Photo Gallery Viewer */}
          <div className="space-y-2">
            <div className="relative rounded-3xl overflow-hidden border border-white/14 h-56 sm:h-72 bg-black/40">
              <img
                src={currentPhoto}
                alt={place.name}
                className="w-full h-full object-cover"
              />

              {/* Status & Featured Pills */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl backdrop-blur-md border ${
                    isDraft
                      ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                      : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                  }`}
                >
                  {isDraft ? '○ Inactive / Draft' : '● Active / Published'}
                </span>

                {place.featured && (
                  <span className="bg-[#FFC928]/30 text-[#FFC928] border border-[#FFC928]/50 text-[10px] font-black px-2.5 py-1 rounded-xl backdrop-blur-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured</span>
                  </span>
                )}
              </div>

              {/* Gallery Controls */}
              {gallery.length > 1 && (
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))}
                    className="p-2 rounded-2xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-[11px] font-bold text-white bg-black/70 px-3 py-1 rounded-xl backdrop-blur-md">
                    Photo {activePhotoIdx + 1} of {gallery.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))}
                    className="p-2 rounded-2xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative rounded-xl overflow-hidden h-14 w-20 shrink-0 border-2 transition cursor-pointer ${
                      activePhotoIdx === idx ? 'border-[#FFC928] scale-102' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#9BAABD] uppercase tracking-wider block">
                Address & Area
              </span>
              <p className="text-xs text-white flex items-start gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0 mt-0.5" />
                <span>{place.address}</span>
              </p>
            </div>

            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#9BAABD] uppercase tracking-wider block">
                Contact Phone & WhatsApp
              </span>
              <div className="flex items-center gap-3 text-xs">
                {place.phone ? (
                  <a
                    href={`tel:${place.phone}`}
                    className="text-white hover:text-[#FFC928] flex items-center gap-1 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{place.phone}</span>
                  </a>
                ) : (
                  <span className="text-[#9BAABD] text-[11px]">No phone</span>
                )}

                {place.whatsapp && (
                  <a
                    href={`https://wa.me/${place.whatsapp.replace(/[^0-9]/g, '').replace(/^0/, '234')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#9BAABD] uppercase tracking-wider block">
                Opening Hours
              </span>
              <p className="text-xs text-white flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>{place.openingHours || '8:00 AM - 6:00 PM'}</span>
              </p>
            </div>

            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#9BAABD] uppercase tracking-wider block">
                Price / Affordability
              </span>
              <p className="text-xs text-white flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-[#FFC928]">{place.priceRange || '₦₦'}</span>
                {place.priceDetails && <span className="text-[11px] text-[#9BAABD]">({place.priceDetails})</span>}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-1.5">
            <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider">
              About / Business Description
            </h4>
            <p className="text-xs text-[#D5DCE8] leading-relaxed whitespace-pre-line">
              {place.description || 'No description provided.'}
            </p>
          </div>

          {/* Hotel Rooms Section */}
          {place.category === 'hotels' && Array.isArray(place.rooms) && place.rooms.length > 0 && (
            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>Room Types & Nightly Rates ({place.rooms.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {place.rooms.map((room, idx) => (
                  <div key={idx} className="bg-[#051C3D] border border-white/10 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-bold text-white">{room.name}</p>
                    <p className="text-xs font-black text-[#FFC928]">{room.price}</p>
                    {room.description && (
                      <p className="text-[10px] text-[#9BAABD]">{room.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restaurant Menu Section */}
          {place.category === 'restaurants' && Array.isArray(place.menuItems) && place.menuItems.length > 0 && (
            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>Menu Specialties & Prices ({place.menuItems.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {place.menuItems.map((item, idx) => (
                  <div key={idx} className="bg-[#051C3D] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      {item.description && <p className="text-[10px] text-[#9BAABD]">{item.description}</p>}
                    </div>
                    <span className="text-xs font-black text-[#FFC928] shrink-0 ml-2">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services & Offerings */}
          {Array.isArray(place.services) && place.services.length > 0 && (
            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-2">
              <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                <span>Services Provided ({place.services.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {place.services.map((srv, idx) => (
                  <span key={idx} className="text-xs bg-[#051C3D] border border-white/10 text-[#D5DCE8] px-2.5 py-1 rounded-xl">
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Products & Parts */}
          {Array.isArray(place.products) && place.products.length > 0 && (
            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-2">
              <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Products & Inventory ({place.products.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {place.products.map((prod, idx) => (
                  <span key={idx} className="text-xs bg-[#051C3D] border border-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-xl">
                    {prod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Amenities & Additional Services */}
          {Array.isArray(place.amenities) && place.amenities.length > 0 && (
            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-2">
              <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>Amenities & Features</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {place.amenities.map((am, idx) => (
                  <span key={idx} className="text-xs bg-[#051C3D] border border-white/10 text-white px-2.5 py-1 rounded-xl">
                    ✓ {am}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Supported Brands & Accessories for Tech/Repair */}
          {Array.isArray(place.supportedBrands) && place.supportedBrands.length > 0 && (
            <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-2">
              <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider">
                Supported Device Brands
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {place.supportedBrands.map((brand, idx) => (
                  <span key={idx} className="text-xs bg-black/40 border border-white/10 text-white px-2.5 py-1 rounded-xl">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews & Feedback Section */}
          <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>Customer Reviews ({Array.isArray(place.reviews) ? place.reviews.length : 0})</span>
              </h4>
              <span className="text-xs text-[#9BAABD]">
                Rating: <strong className="text-white">{place.rating ? place.rating.toFixed(1) : 'New'} / 5.0</strong>
              </span>
            </div>

            {Array.isArray(place.reviews) && place.reviews.length > 0 ? (
              <div className="space-y-2.5">
                {place.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-[#051C3D] border border-white/8 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.author}</span>
                        <div className="flex items-center text-amber-400 text-[10px]">
                          {'★'.repeat(Math.min(5, Math.max(1, rev.rating)))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#9BAABD]">{rev.date}</span>
                        {onDeleteReview && (
                          <button
                            type="button"
                            onClick={() => onDeleteReview(place.id, rev.id)}
                            className="p-1 text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 rounded-lg transition cursor-pointer"
                            title="Delete this customer review"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#9BAABD] leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9BAABD] italic">No customer reviews recorded yet.</p>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 bg-[#08254D] border-t border-white/10 flex items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="flex items-center gap-2">
            {onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(place)}
                className={`text-xs font-bold px-3.5 py-2 rounded-2xl border transition cursor-pointer ${
                  isDraft
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                }`}
              >
                {isDraft ? '● Publish / Activate' : '○ Disable (Draft)'}
              </button>
            )}

            {onToggleFeatured && (
              <button
                type="button"
                onClick={() => onToggleFeatured(place)}
                className={`text-xs font-bold px-3.5 py-2 rounded-2xl border transition cursor-pointer ${
                  place.featured
                    ? 'bg-[#FFC928]/20 text-[#FFC928] border-[#FFC928]/40'
                    : 'bg-white/10 text-[#9BAABD] border-white/14 hover:text-white'
                }`}
              >
                {place.featured ? '★ Featured (On)' : '☆ Mark Featured'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(place.id, place.name);
              }}
              className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
