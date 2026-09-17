import React, { useState } from 'react';
import { Place, Booking } from '../types';
import { trackEvent } from '../utils/analytics';
import {
  X,
  Calendar,
  Users,
  CheckCircle2,
  Phone,
  User,
  Mail,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  Send,
  ExternalLink
} from 'lucide-react';

interface BookingModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: (booking: Booking) => void;
  initialRoomType?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  place,
  isOpen,
  onClose,
  onBookingSuccess,
  initialRoomType
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Default tomorrow and next day
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 2);

  const [checkInDate, setCheckInDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(nextDay.toISOString().split('T')[0]);
  const [guestsCount, setGuestsCount] = useState(1);
  const [roomType, setRoomType] = useState(() => {
    if (initialRoomType) return initialRoomType;
    if (place?.rooms && place.rooms.length > 0) {
      return `${place.rooms[0].name} (${place.rooms[0].price})`;
    }
    return 'Standard Executive Room';
  });
  const [specialRequests, setSpecialRequests] = useState('');
  
  React.useEffect(() => {
    if (initialRoomType) {
      setRoomType(initialRoomType);
    } else if (place?.rooms && place.rooms.length > 0) {
      setRoomType(`${place.rooms[0].name} (${place.rooms[0].price})`);
    }
  }, [initialRoomType, place]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment proof submission state
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofSubmittedSuccess, setProofSubmittedSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !place) return null;

  // Calculate nights
  const calculateNights = () => {
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();

  // Find matching room price
  const selectedRoomObj = place.rooms?.find(
    (r) => roomType.startsWith(r.name) || r.name === roomType
  );
  const estimatedTotal = selectedRoomObj?.pricePerNight
    ? `₦${(selectedRoomObj.pricePerNight * nights).toLocaleString()}`
    : selectedRoomObj?.price || place.priceRange || 'Contact Hotel';

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !checkInDate) {
      setErrorMessage('Please fill in your name, contact phone, and check-in date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    trackEvent('booking_submitted', {
      entityId: place.id,
      entityTitle: place.name,
      category: place.category
    });

    try {
      const payload = {
        placeId: place.id,
        placeName: place.name,
        category: place.category,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        checkInDate,
        checkOutDate: place.category === 'hotels' ? checkOutDate : undefined,
        guestsCount,
        roomOrServiceType: roomType,
        specialRequests: specialRequests.trim(),
        amount: estimatedTotal
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit reservation.');
      }

      const data = await res.json();
      setConfirmedBooking(data.booking);
      setIsSuccess(true);
      if (onBookingSuccess) onBookingSuccess(data.booking);

      trackEvent('booking_completed', {
        entityId: place.id,
        entityTitle: place.name,
        category: place.category
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not connect to booking service. Please try calling directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedBooking) return;
    if (!paymentRefInput.trim()) {
      alert('Please enter your transaction reference, sender name, or bank narration.');
      return;
    }

    setIsSubmittingProof(true);
    try {
      const res = await fetch(`/api/bookings/${confirmedBooking.id}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentReference: paymentRefInput.trim(),
          paymentProofNotes: paymentNotesInput.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit payment details');
      }

      const data = await res.json();
      setConfirmedBooking(data.booking);
      setProofSubmittedSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Could not submit payment reference. Please contact hotel directly.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setConfirmedBooking(null);
    setErrorMessage(null);
    setPaymentRefInput('');
    setPaymentNotesInput('');
    setProofSubmittedSuccess(false);
    onClose();
  };

  // Payment details source (from booking snapshot or place)
  const hotelPayment = confirmedBooking?.hotelPaymentDetails || (place.paymentDetails?.status === 'VERIFIED' ? place.paymentDetails : null);
  const cleanPhone = place.phone?.replace(/[^0-9+]/g, '') || '';
  const cleanWhatsapp = place.whatsapp?.replace(/[^0-9]/g, '') || cleanPhone.replace(/[^0-9]/g, '');

  const whatsappMessage = confirmedBooking
    ? encodeURIComponent(
        `Hello ${place.name}, I have created a booking reservation on Shendam Connect.\n\nBooking ID: ${confirmedBooking.id}\nGuest: ${confirmedBooking.customerName}\nRoom: ${confirmedBooking.roomOrServiceType}\nCheck-in: ${confirmedBooking.checkInDate}\nAmount: ${confirmedBooking.amount}\n\nI am making direct bank payment to your account.`
      )
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#08254D] border border-white/16 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#08254D]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-brand-sans">
                {isSuccess ? 'Pay Directly to Hotel' : `Reserve at ${place.name}`}
              </h3>
              <p className="text-xs text-[#9BAABD]">
                {isSuccess ? 'Verified Direct Bank Payment' : `${place.area} • Direct Booking Request`}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {isSuccess && confirmedBooking ? (
            <div className="space-y-4 text-left py-1 animate-in zoom-in-95 duration-200">
              {/* Header Status */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-[#FFC928]/15 text-[#FFC928] px-3 py-1 rounded-full border border-[#FFC928]/30 text-xs font-mono font-bold">
                    <span>Booking Ref: {confirmedBooking.id}</span>
                    <button
                      onClick={() => handleCopy(confirmedBooking.id, 'ref')}
                      className="hover:text-white transition cursor-pointer ml-1"
                      title="Copy Reference"
                    >
                      {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h4 className="font-bold text-lg text-white mt-2 font-brand-sans">
                    Booking Request Placed!
                  </h4>
                  <p className="text-xs text-[#D5DCE8] leading-relaxed">
                    Thank you, <strong className="text-white">{confirmedBooking.customerName}</strong>. Please transfer directly to the hotel&apos;s approved bank account below to finalize your reservation.
                  </p>
                </div>
              </div>

              {/* Direct Hotel Payment Box */}
              {hotelPayment ? (
                <div className="bg-gradient-to-br from-[#04142F] to-[#0A2652] border-2 border-[#FFC928]/40 rounded-2xl p-4.5 shadow-xl space-y-3.5 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#FFC928]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FFC928]">
                        Hotel Payment Details
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Verified Account
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-white/8">
                      <span className="text-[#9BAABD]">Bank Name:</span>
                      <span className="font-bold text-white text-sm">{hotelPayment.bankName}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-white/8">
                      <span className="text-[#9BAABD]">Account Name:</span>
                      <span className="font-bold text-white text-right">{hotelPayment.accountName}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 bg-black/30 px-3 rounded-xl border border-white/10">
                      <div>
                        <span className="text-[10px] text-[#9BAABD] uppercase block">Account Number</span>
                        <span className="font-mono text-base font-black text-[#FFC928] tracking-widest">
                          {hotelPayment.accountNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(hotelPayment.accountNumber, 'accNum')}
                        className="flex items-center gap-1.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer active:scale-95"
                      >
                        {copiedField === 'accNum' ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-white/8">
                      <span className="text-[#9BAABD]">Expected Amount:</span>
                      <span className="font-black text-[#FFC928] text-sm">{confirmedBooking.amount}</span>
                    </div>

                    {hotelPayment.paymentInstructions && (
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/8 text-[11px] text-[#D5DCE8] leading-relaxed">
                        <span className="font-bold text-white block mb-0.5">Payment Instructions:</span>
                        {hotelPayment.paymentInstructions}
                      </div>
                    )}
                  </div>

                  {/* Verification Notice Banner */}
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-300">Verify account details before making payment.</p>
                      <p className="text-[10px] text-amber-200/80 mt-0.5">
                        Shendam Connect does not hold customer booking funds. All payments go directly to the verified hotel account.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#04142F] border border-white/12 rounded-2xl text-xs space-y-2 text-[#D5DCE8]">
                  <p className="font-bold text-white">Direct Hotel Payment Instructions</p>
                  <p>
                    Bank account details for <strong>{place.name}</strong> are currently provided on direct request. Please call the front desk at <strong className="text-[#FFC928]">{place.phone || 'the venue'}</strong> to complete your transfer.
                  </p>
                </div>
              )}

              {/* Payment Proof / Reference Submission */}
              <div className="bg-[#04142F] border border-white/12 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FFC928]" />
                    <span>Confirm Your Direct Transfer</span>
                  </h5>
                  {proofSubmittedSuccess || confirmedBooking.paymentStatus === 'payment_submitted' ? (
                    <span className="text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                      Proof Submitted
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Awaiting Payment
                    </span>
                  )}
                </div>

                {proofSubmittedSuccess || confirmedBooking.paymentStatus === 'payment_submitted' ? (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment Reference Recorded!</span>
                    </div>
                    <p className="text-[11px] text-[#D5DCE8] leading-relaxed">
                      Reference: <strong className="text-white">{confirmedBooking.paymentReference}</strong>
                    </p>
                    <p className="text-[10px] text-[#9BAABD]">
                      The hotel front desk has been notified and will verify your transfer and confirm your booking.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPaymentProof} className="space-y-2.5">
                    <p className="text-[11px] text-[#9BAABD]">
                      After making the bank transfer, enter your transaction reference, sender name, or session ID below:
                    </p>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sender Name: Danjuma Lar / Ref: 1029384756"
                        value={paymentRefInput}
                        onChange={(e) => setPaymentRefInput(e.target.value)}
                        className="w-full bg-[#08254D] border border-white/16 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. Bank used, time of transfer)"
                        value={paymentNotesInput}
                        onChange={(e) => setPaymentNotesInput(e.target.value)}
                        className="w-full bg-[#08254D] border border-white/16 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingProof}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingProof ? (
                        <span>Submitting Details...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Payment Proof / Reference</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Direct Contact Actions */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] text-[#9BAABD] font-bold uppercase tracking-wider block">
                  Contact Hotel Directly:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {cleanWhatsapp ? (
                    <a
                      href={`https://wa.me/${cleanWhatsapp}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Hotel</span>
                    </a>
                  ) : null}

                  {cleanPhone ? (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/15 border border-white/14 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-[#FFC928]" />
                      <span>Call Front Desk</span>
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleResetAndClose}
                className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/14 text-white font-bold text-xs rounded-xl transition cursor-pointer mt-2"
              >
                Done / Return to Directory
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Direct Payment Notice */}
              <div className="p-3 bg-[#04142F] rounded-2xl border border-white/10 flex items-start gap-2.5 text-xs text-[#D5DCE8]">
                <ShieldCheck className="w-4.5 h-4.5 text-[#FFC928] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Direct Hotel Settlement</p>
                  <p className="text-[11px] text-[#9BAABD] mt-0.5 leading-relaxed">
                    Shendam Connect does not process card fees. You will pay directly to the verified hotel bank account upon submitting this request.
                  </p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Primary Guest Details</span>
                </label>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Danjuma Lar)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number (e.g. 0803 123 4567)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Service Details */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-[#FFC928] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Stay & Schedule Information</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] text-[#9BAABD] mb-1 block">Check-in Date:</span>
                    <input
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-[#9BAABD] mb-1 block">Check-out Date:</span>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] text-[#9BAABD] mb-1 block">Number of Guests:</span>
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                    >
                      {[1, 2, 3, 4, 5, 6, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#9BAABD] mb-1 block">Room / Service Option:</span>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                    >
                      {place.rooms && place.rooms.length > 0 ? (
                        place.rooms.map((r, idx) => (
                          <option key={idx} value={`${r.name} (${r.price})`}>
                            {r.name} — {r.price}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Standard Room">Standard Room</option>
                          <option value="Super Deluxe">Super Deluxe</option>
                          <option value="Executive Suite">Executive Suite</option>
                          <option value="General Reservation">General Reservation</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[#9BAABD] mb-1 block">Special Requests (Optional):</span>
                  <textarea
                    rows={2}
                    placeholder="e.g., Early arrival, airport pickup, quiet high-floor room..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928] resize-none"
                  />
                </div>
              </div>

              {/* Price rate summary notice */}
              <div className="p-3 bg-[#04142F] rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#9BAABD] block text-[11px]">
                    {nights} {nights === 1 ? 'Night' : 'Nights'} Stay Total:
                  </span>
                  <span className="font-bold text-[#FFC928] text-sm">
                    {estimatedTotal}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25 font-semibold flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  <span>Direct Transfer</span>
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] font-black text-sm rounded-2xl shadow-[0_4px_16px_rgba(255,201,40,0.35)] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Request...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Proceed to Direct Hotel Payment Details</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

