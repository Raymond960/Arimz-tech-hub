import React from 'react';
import { X, Calendar, Clock, MapPin, Users, Share2, Bell, CheckCircle2 } from 'lucide-react';
import { ShendamEvent } from '../types';
import { LazyImage } from '../utils/imageOptimizer';

interface EventDetailModalProps {
  event: ShendamEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose
}) => {
  const [reminded, setReminded] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  if (!isOpen || !event) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Join us at ${event.title} in Shendam on ${event.date}!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const handleToggleReminder = () => {
    setReminded(!reminded);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm bg-[#0B2D5C] border border-white/16 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header Image */}
        <div className="relative w-full h-44 bg-[#08254D] shrink-0">
          <LazyImage
            src={event.image}
            alt={event.title}
            widthParam={600}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C] via-transparent to-black/50" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category Pill */}
          <span className="absolute top-3 left-3 text-[10px] font-bold bg-[#04142F]/90 text-[#38BDF8] border border-[#0878D1]/40 px-2.5 py-0.5 rounded-full">
            {event.category}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <span className="text-[11px] font-extrabold text-[#FFC928] tracking-wider uppercase">
              {event.date}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5 leading-snug">
              {event.title}
            </h3>
          </div>

          {/* Key Facts */}
          <div className="bg-[#08254D] border border-white/16 rounded-2xl p-3 space-y-2.5 text-xs text-[#D5DCE8]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FFC928]/15 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#FFC928]" />
              </div>
              <span className="text-white font-medium">{event.location}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0878D1]/20 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
              </div>
              <span>{event.time}</span>
            </div>

            {event.attendeesCount && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span>{event.attendeesCount} attendees registered</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
              About This Event
            </h4>
            <p className="text-xs text-[#D5DCE8] leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              onClick={handleToggleReminder}
              className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                reminded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A]'
              }`}
            >
              {reminded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reminder Set</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Set Event Reminder</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl border border-white/16 hover:border-[#FFC928]/50 bg-white/5 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{shared ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
