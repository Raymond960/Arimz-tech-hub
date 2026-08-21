import React, { useState } from 'react';
import { Place, PlaceReview } from '../types';
import { LazyImage } from '../utils/imageOptimizer';
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
  Info
} from 'lucide-react';

interface PlaceDetailModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (placeId: string) => void;
  onAddReview?: (placeId: string, review: Omit<PlaceReview, 'id' | 'date'>) => void;
  onViewOnMap?: (place: Place) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onAddReview,
  onViewOnMap
}) => {
  const [activeImage, setActiveImage] = useState<string>('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !place) return null;

  const currentCover = activeImage || place.image;
  const gallery = place.gallery && place.gallery.length > 0 ? place.gallery : [place.image];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${place.name} - ${place.address} | Shendam Connect`);
    showToast('Link copied to clipboard!');
  };

  const handleCall = () => {
    if (place.phone && place.phone.trim()) {
      window.location.href = `tel:${place.phone}`;
    } else {
      showToast('Contact hotel for details');
    }
  };

  const handleWhatsApp = () => {
    if (place.whatsapp && place.whatsapp.trim()) {
      const cleanNum = place.whatsapp.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNum}`, '_blank');
    } else {
      showToast('Contact hotel for details');
    }
  };

  const handleBooking = () => {
    if (place.phone && place.phone.trim()) {
      window.location.href = `tel:${place.phone}`;
    } else if (place.whatsapp && place.whatsapp.trim()) {
      const cleanNum = place.whatsapp.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(`Hello, I would like to make a reservation at ${place.name}.`)}`, '_blank');
    } else {
      showToast('Information coming soon');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !author.trim()) return;

    if (onAddReview) {
      onAddReview(place.id, {
        author: author.trim(),
        rating,
        comment: comment.trim()
      });
    }
    setComment('');
    setAuthor('');
    setShowReviewForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B2D5C] border border-white/16 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
        {/* Cover Photo */}
        <div className="relative w-full h-64 bg-[#08254D] shrink-0">
          <LazyImage
            src={currentCover}
            alt={place.name}
            widthParam={800}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C] via-transparent to-black/50" />

          {/* Top Floating Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => onToggleSave(place.id)}
                aria-label="Save Place"
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-[#FFC928] flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
              >
                <Bookmark
                  className={`w-5 h-5 ${isSaved ? 'fill-[#FFC928]' : 'stroke-[2]'}`}
                />
              </button>
            </div>
          </div>

          {/* Category Pill on Image */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className="bg-[#FFC928] text-[#061B3A] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              {place.categoryLabel}
            </span>
            {place.priceRange && (
              <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                {place.priceRange}
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

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Header Title & Rating */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-xl text-white leading-tight font-brand-sans">
                {place.name}
              </h3>
              <div className="flex items-center gap-1 bg-[#08254D] border border-white/16 px-2.5 py-1 rounded-xl shrink-0">
                <Star className="w-4 h-4 text-[#FFC928] fill-[#FFC928]" />
                {place.rating && place.rating > 0 ? (
                  <>
                    <span className="font-bold text-sm text-white">{place.rating}</span>
                    <span className="text-[10px] text-[#9BAABD]">({place.reviewsCount})</span>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-[#FFC928]">Contact hotel for details</span>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-2 text-xs text-[#9BAABD] mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
              <span>{place.address || 'Contact hotel for details'}</span>
            </div>

            {/* Hours */}
            {place.openingHours && (
              <div className="flex items-center gap-2 text-xs text-[#D5DCE8] mt-1">
                <Clock className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                <span>{place.openingHours}</span>
              </div>
            )}
          </div>

          {/* Booking Action Banner Button */}
          <button
            onClick={handleBooking}
            className="w-full py-3 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] font-black text-sm rounded-2xl shadow-[0_4px_16px_rgba(255,201,40,0.3)] flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Book Room / Reservation</span>
          </button>

          {/* Quick Action Contact Buttons */}
          <div className="grid grid-cols-3 gap-2 py-1">
            <button
              onClick={handleCall}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl text-xs font-semibold text-white transition cursor-pointer active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 text-[#FFC928]" />
              <span>Call</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl text-xs font-semibold text-[#48BB78] transition cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#48BB78]" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onViewOnMap?.(place);
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl text-xs font-semibold text-[#FFC928] transition cursor-pointer active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-[#FFC928]" />
              <span>Directions</span>
            </button>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
              About
            </h4>
            <p className="text-xs sm:text-sm text-[#D5DCE8] leading-relaxed">
              {place.description || 'Information coming soon'}
            </p>
          </div>

          {/* Photo Gallery thumbnails */}
          {gallery.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-2">
                Photo Gallery ({gallery.length})
              </h4>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {gallery.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                      currentCover === imgUrl ? 'border-[#FFC928]' : 'border-transparent opacity-70'
                    }`}
                  >
                    <LazyImage src={imgUrl} alt="" widthParam={200} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amenities & Highlights */}
          <div>
            <h4 className="text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-2">
              Available Amenities
            </h4>
            {place.amenities && place.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {place.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] bg-[#08254D] border border-white/16 text-[#D5DCE8] px-2.5 py-1 rounded-lg"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#FFC928]" />
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9BAABD] italic">Information coming soon</p>
            )}
          </div>

          {/* Reviews Section */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#9BAABD] uppercase tracking-wider">
                Community Reviews ({place.reviews?.length || 0})
              </h4>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-[#FFC928] hover:underline text-xs font-semibold cursor-pointer"
              >
                {showReviewForm ? 'Cancel' : '+ Write Review'}
              </button>
            </div>

            {/* Write Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="bg-[#08254D] border border-white/16 rounded-2xl p-3 mb-3 space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                />

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#9BAABD]">Your Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= rating ? 'text-[#FFC928] fill-[#FFC928]' : 'text-slate-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928] resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-2">
              {place.reviews && place.reviews.length > 0 ? (
                place.reviews.map((rev) => (
                  <div key={rev.id} className="bg-[#08254D] p-2.5 rounded-xl border border-white/16 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{rev.author}</span>
                      <div className="flex items-center gap-0.5 text-[#FFC928]">
                        <Star className="w-3 h-3 fill-[#FFC928]" />
                        <span className="font-semibold text-[11px]">{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-[#9BAABD] text-[11px] mt-1">{rev.comment}</p>
                    <span className="text-[10px] text-[#9BAABD]/60 mt-1 block">{rev.date}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#9BAABD] italic py-2">No reviews yet. Be the first to leave one!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
