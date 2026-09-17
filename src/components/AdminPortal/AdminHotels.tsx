import React, { useState } from 'react';
import { Place, Booking } from '../../types';
import {
  Building2,
  PlusCircle,
  Search,
  Star,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  MapPin,
  CalendarCheck,
  CreditCard
} from 'lucide-react';

interface AdminHotelsProps {
  places: Place[];
  bookings: Booking[];
  onAddHotel: () => void;
  onEditHotel: (place: Place) => void;
  onDeleteHotel: (placeId: string, placeName: string) => void;
  onToggleFeatured: (place: Place) => void;
}

export const AdminHotels: React.FC<AdminHotelsProps> = ({
  places,
  bookings,
  onAddHotel,
  onEditHotel,
  onDeleteHotel,
  onToggleFeatured
}) => {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');

  const hotels = places.filter((p) => p.category === 'hotels');

  const filteredHotels = hotels.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase()) ||
      h.area.toLowerCase().includes(search.toLowerCase());
    const matchesArea = areaFilter === 'all' || h.area === areaFilter;
    return matchesSearch && matchesArea;
  });

  const getHotelBookingsCount = (hotelId: string) => {
    return bookings.filter((b) => b.placeId === hotelId).length;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#FFC928]" />
            <span>Hotels & Accommodations ({hotels.length})</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Manage verified Shendam hotels, lodges, suites, room categories, and direct booking links.
          </p>
        </div>

        <button
          onClick={onAddHotel}
          className="flex items-center gap-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Hotel</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hotel by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
          />
        </div>

        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="bg-[#08254D] border border-white/14 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
        >
          <option value="all">All Locations</option>
          <option value="Shendam Central">Shendam Central</option>
          <option value="Commercial Road">Commercial Road</option>
          <option value="Kwolla District">Kwolla District</option>
          <option value="Kalong Area">Kalong Area</option>
          <option value="Dokan Tofa">Dokan Tofa</option>
        </select>
      </div>

      {/* Hotel Cards / Table */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-xl text-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#04142F] text-[#9BAABD] uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Hotel Profile</th>
                <th className="py-3.5 px-4">District / Area</th>
                <th className="py-3.5 px-4">Rate & Tier</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Bookings</th>
                <th className="py-3.5 px-4 text-center">Featured</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9BAABD]">
                    No hotels match the current search filter.
                  </td>
                </tr>
              ) : (
                filteredHotels.map((hotel) => {
                  const bCount = getHotelBookingsCount(hotel.id);
                  return (
                    <tr key={hotel.id} className="hover:bg-white/4 transition">
                      {/* Name & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/14 shrink-0 bg-[#04142F]"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <h4 className="font-bold text-white text-xs truncate">{hotel.name}</h4>
                            <p className="text-[11px] text-[#9BAABD] truncate max-w-xs">{hotel.address}</p>
                            {hotel.paymentDetails?.accountNumber ? (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                <CreditCard className="w-3 h-3" />
                                <span>{hotel.paymentDetails.bankName} • {hotel.paymentDetails.status || 'VERIFIED'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] text-amber-300/80 font-normal">
                                <CreditCard className="w-3 h-3 text-amber-400" />
                                <span>Direct Bank Info Not Set</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Area */}
                      <td className="py-3.5 px-4">
                        <span className="text-white font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#FFC928]" />
                          <span>{hotel.area}</span>
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#FFC928]">{hotel.priceRange || '₦₦'}</span>
                        <span className="block text-[10px] text-[#9BAABD]">{hotel.priceDetails || 'Standard'}</span>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[#FFC928] font-bold">
                          <Star className="w-3.5 h-3.5 fill-[#FFC928]" />
                          <span>{hotel.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-[#9BAABD]">({hotel.reviewsCount})</span>
                        </div>
                      </td>

                      {/* Bookings */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          <CalendarCheck className="w-3 h-3" />
                          <span>{bCount} reservations</span>
                        </span>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleFeatured(hotel)}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            hotel.featured
                              ? 'bg-[#FFC928]/20 border-[#FFC928] text-[#FFC928]'
                              : 'bg-white/6 border-white/12 text-[#9BAABD] hover:text-white'
                          }`}
                          title="Toggle homepage featured status"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEditHotel(hotel)}
                            className="p-1.5 rounded-xl bg-white/8 hover:bg-white/16 text-white transition cursor-pointer"
                            title="Edit Hotel Listing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteHotel(hotel.id, hotel.name)}
                            className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition cursor-pointer"
                            title="Delete Hotel Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
