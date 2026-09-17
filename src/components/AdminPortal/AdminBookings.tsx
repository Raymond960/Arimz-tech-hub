import React, { useState } from 'react';
import { Booking } from '../../types';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Phone,
  Mail,
  Download,
  Building,
  User,
  Check,
  X,
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface AdminBookingsProps {
  bookings: Booking[];
  onUpdateStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  onDeleteBooking: (bookingId: string) => Promise<void>;
}

export const AdminBookings: React.FC<AdminBookingsProps> = ({
  bookings,
  onUpdateStatus,
  onDeleteBooking
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.placeName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerPhone.includes(search);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(bookingId, newStatus);
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'BookingID,PlaceName,CustomerName,Phone,Email,CheckIn,CheckOut,Guests,RoomType,Amount,Status,CreatedAt\n' +
      filteredBookings
        .map(
          (b) =>
            `"${b.id}","${b.placeName}","${b.customerName}","${b.customerPhone}","${b.customerEmail || ''}","${b.checkInDate}","${b.checkOutDate || ''}",${b.guestsCount},"${b.roomOrServiceType}","${b.amount}","${b.status}","${b.createdAt}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shendam_bookings_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            <span>Bookings & Room Reservations ({bookings.length})</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Track, verify, confirm, and update visitor accommodation and service reservations in Shendam.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/14 px-3.5 py-2 rounded-2xl text-xs font-bold text-white transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-2xl border transition cursor-pointer shrink-0 ${
            statusFilter === 'all'
              ? 'bg-[#FFC928] text-[#04142F] border-[#FFC928] font-bold'
              : 'bg-[#08254D] text-[#D5DCE8] border-white/12 hover:bg-white/10'
          }`}
        >
          All ({bookings.length})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-2 rounded-2xl border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-[#04142F] border-amber-500 font-bold'
              : 'bg-[#08254D] text-amber-300 border-amber-500/30 hover:bg-white/10'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review ({pendingCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('confirmed')}
          className={`px-3.5 py-2 rounded-2xl border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
            statusFilter === 'confirmed'
              ? 'bg-emerald-500 text-[#04142F] border-emerald-500 font-bold'
              : 'bg-[#08254D] text-emerald-300 border-emerald-500/30 hover:bg-white/10'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Confirmed ({confirmedCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3.5 py-2 rounded-2xl border transition cursor-pointer shrink-0 ${
            statusFilter === 'completed'
              ? 'bg-sky-500 text-[#04142F] border-sky-500 font-bold'
              : 'bg-[#08254D] text-sky-300 border-sky-500/30 hover:bg-white/10'
          }`}
        >
          Completed ({completedCount})
        </button>

        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3.5 py-2 rounded-2xl border transition cursor-pointer shrink-0 ${
            statusFilter === 'cancelled'
              ? 'bg-rose-500 text-white border-rose-500 font-bold'
              : 'bg-[#08254D] text-rose-300 border-rose-500/30 hover:bg-white/10'
          }`}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by customer name, reference ID, phone, or hotel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
        />
      </div>

      {/* Bookings Table */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-xl text-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#04142F] text-[#9BAABD] uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Ref & Guest</th>
                <th className="py-3.5 px-4">Hotel / Venue</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Room & Guests</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9BAABD]">
                    No bookings found in this filter category.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/4 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono text-[10px] text-[#FFC928] block">{booking.id}</span>
                        <span className="font-bold text-white text-xs">{booking.customerName}</span>
                        <span className="block text-[11px] text-[#9BAABD]">{booking.customerPhone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white">{booking.placeName}</span>
                    </td>

                    <td className="py-3.5 px-4 text-[#D5DCE8]">
                      <div>
                        <span className="block font-medium text-white">{booking.checkInDate}</span>
                        {booking.checkOutDate && (
                          <span className="text-[10px] text-[#9BAABD]">to {booking.checkOutDate}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-white block">{booking.roomOrServiceType}</span>
                      <span className="text-[10px] text-[#9BAABD]">{booking.guestsCount} Guest(s)</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#FFC928]">{booking.amount}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border inline-block ${
                            booking.status === 'confirmed'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : booking.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : booking.status === 'completed'
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {booking.status}
                        </span>
                        {booking.paymentStatus && (
                          <div className="text-[9px] font-bold tracking-tight">
                            {booking.paymentStatus === 'payment_confirmed' && (
                              <span className="text-emerald-400 font-semibold">● Direct Paid</span>
                            )}
                            {booking.paymentStatus === 'payment_submitted' && (
                              <span className="text-amber-400 font-semibold animate-pulse">● Proof Sent</span>
                            )}
                            {booking.paymentStatus === 'pending_payment' && (
                              <span className="text-[#9BAABD]">● Transfer Pending</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-1.5 rounded-xl bg-white/8 hover:bg-white/16 text-white transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition cursor-pointer"
                            title="Confirm Booking"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}

                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition cursor-pointer"
                            title="Cancel Booking"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteBooking(booking.id)}
                          className="p-1.5 rounded-xl bg-white/6 hover:bg-rose-500/25 text-[#9BAABD] hover:text-rose-300 transition cursor-pointer"
                          title="Delete Booking Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#08254D] border border-white/16 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#08254D] z-10">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-[#FFC928]">
                  {selectedBooking.id}
                </span>
                <h3 className="font-bold text-base text-white font-brand-sans">
                  Reservation Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-[#04142F] border border-white/10 rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between py-1 border-b border-white/8">
                  <span className="text-[#9BAABD]">Guest Name:</span>
                  <span className="font-bold text-white">{selectedBooking.customerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/8">
                  <span className="text-[#9BAABD]">Phone Number:</span>
                  <a href={`tel:${selectedBooking.customerPhone}`} className="font-bold text-[#FFC928] hover:underline">
                    {selectedBooking.customerPhone}
                  </a>
                </div>
                {selectedBooking.customerEmail && (
                  <div className="flex justify-between py-1 border-b border-white/8">
                    <span className="text-[#9BAABD]">Email:</span>
                    <span className="font-medium text-white">{selectedBooking.customerEmail}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-white/8">
                  <span className="text-[#9BAABD]">Venue:</span>
                  <span className="font-bold text-white">{selectedBooking.placeName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/8">
                  <span className="text-[#9BAABD]">Check-in Date:</span>
                  <span className="font-bold text-white">{selectedBooking.checkInDate}</span>
                </div>
                {selectedBooking.checkOutDate && (
                  <div className="flex justify-between py-1 border-b border-white/8">
                    <span className="text-[#9BAABD]">Check-out Date:</span>
                    <span className="font-bold text-white">{selectedBooking.checkOutDate}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-white/8">
                  <span className="text-[#9BAABD]">Room / Unit Type:</span>
                  <span className="font-bold text-white">{selectedBooking.roomOrServiceType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/8">
                  <span className="text-[#9BAABD]">Total Guests:</span>
                  <span className="font-bold text-white">{selectedBooking.guestsCount}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#9BAABD]">Current Status:</span>
                  <span className="font-bold uppercase text-[#FFC928]">{selectedBooking.status}</span>
                </div>
              </div>

              {/* DIRECT HOTEL PAYMENT SECTION */}
              <div className="bg-[#04142F] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Direct Hotel Payment Settlement</span>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      selectedBooking.paymentStatus === 'payment_confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : selectedBooking.paymentStatus === 'payment_submitted'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                        : 'bg-white/10 text-[#9BAABD] border-white/14'
                    }`}
                  >
                    {selectedBooking.paymentStatus === 'payment_confirmed'
                      ? 'Payment Confirmed'
                      : selectedBooking.paymentStatus === 'payment_submitted'
                      ? 'Proof Submitted'
                      : 'Pending Payment'}
                  </span>
                </div>

                <div className="text-[11px] text-[#9BAABD] space-y-1.5">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-white">{selectedBooking.paymentMethod || 'Direct Hotel Transfer'}</span>
                  </div>
                  {selectedBooking.hotelPaymentDetails && (
                    <div className="p-2.5 bg-black/30 rounded-xl border border-white/8 space-y-1">
                      <div className="text-[10px] text-[#FFC928] font-bold uppercase tracking-wider">
                        Hotel Account Snapshot:
                      </div>
                      <div className="flex justify-between text-white font-medium">
                        <span>{selectedBooking.hotelPaymentDetails.bankName}:</span>
                        <span className="font-mono text-[#FFC928]">{selectedBooking.hotelPaymentDetails.accountNumber}</span>
                      </div>
                      <div className="text-white text-[10px]">
                        Name: {selectedBooking.hotelPaymentDetails.accountName}
                      </div>
                    </div>
                  )}

                  {selectedBooking.paymentReference && (
                    <div className="flex justify-between py-1 border-t border-white/8">
                      <span className="text-white font-semibold">Payment / Teller Ref:</span>
                      <span className="font-mono font-bold text-[#FFC928]">{selectedBooking.paymentReference}</span>
                    </div>
                  )}

                  {selectedBooking.paymentProofNotes && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-amber-300 block mb-0.5">
                        Guest Payment Proof Note:
                      </span>
                      <p className="text-amber-100 text-xs">{selectedBooking.paymentProofNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <div className="p-3.5 bg-[#04142F] border border-white/10 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase text-[#9BAABD] block mb-1">
                    Special Requests:
                  </span>
                  <p className="text-white text-xs leading-relaxed">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {/* Status Change Buttons */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#9BAABD] block">
                  Change Status:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                    className="py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl border border-emerald-500/40 text-xs transition cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                    className="py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold rounded-xl border border-sky-500/40 text-xs transition cursor-pointer"
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                    className="py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl border border-rose-500/40 text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
