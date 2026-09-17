import React from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { ShendamEvent } from '../types';
import { LazyImage } from '../utils/imageOptimizer';

interface UpcomingEventsSectionProps {
  events: ShendamEvent[];
  onSelectEvent: (event: ShendamEvent) => void;
  onSeeAllEvents?: () => void;
}

export const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = ({
  events,
  onSelectEvent,
  onSeeAllEvents
}) => {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="w-full mt-7 z-10">
      {/* Header with Title & See All */}
      <div className="flex items-center justify-between px-4 sm:px-5 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0878D1] shadow-[0_0_8px_#0878D1]" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Upcoming Events
            </h3>
          </div>
          <p className="text-xs text-[#9BAABD] mt-0.5">
            Festivals, agricultural expos & local gatherings
          </p>
        </div>

        {onSeeAllEvents && (
          <button
            onClick={onSeeAllEvents}
            className="text-[#FFC928] hover:text-[#F5B800] text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ml-2"
          >
            See All
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Event Cards */}
      <div className="flex gap-3.5 px-4 sm:px-5 overflow-x-auto no-scrollbar pb-2 pt-1">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="w-60 sm:w-72 shrink-0 bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/70 rounded-2xl overflow-hidden cursor-pointer shadow-lg group transition-all duration-300 active:scale-98 flex flex-col"
          >
            {/* Event Image Banner */}
            <div className="relative w-full h-32 bg-[#08254D] overflow-hidden">
              <LazyImage
                src={event.image}
                alt={event.title}
                widthParam={500}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C] via-transparent to-black/40 z-10" />

              {/* Top Left: Category Badge */}
              <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-[#04142F]/90 text-[#38BDF8] border border-[#0878D1]/40 px-2 py-0.5 rounded-full backdrop-blur-md z-20">
                {event.category}
              </span>

              {/* Top Right: Tag / Featured */}
              {event.tag && (
                <span className="absolute top-2.5 right-2.5 text-[9px] font-black tracking-wider uppercase bg-[#FFC928] text-[#061B3A] px-1.5 py-0.5 rounded font-mono shadow-sm z-20">
                  {event.tag}
                </span>
              )}

              {/* Bottom Date Pill */}
              <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 bg-[#04142F]/90 border border-white/16 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#FFC928] backdrop-blur-md z-20">
                <Calendar className="w-3 h-3 text-[#FFC928]" />
                <span>{event.date}</span>
              </div>
            </div>

            {/* Event Info Details */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#FFC928] transition-colors">
                  {event.title}
                </h4>

                <div className="flex items-center gap-1.5 text-[11px] text-[#9BAABD] mt-1.5">
                  <MapPin className="w-3 h-3 text-[#FFC928] shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/10 text-[10px] text-[#9BAABD]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D5DCE8]" />
                  <span>{event.time}</span>
                </div>

                {event.attendeesCount && (
                  <div className="flex items-center gap-1 text-[#D5DCE8]">
                    <Users className="w-3 h-3 text-[#38BDF8]" />
                    <span>{event.attendeesCount}+ going</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
