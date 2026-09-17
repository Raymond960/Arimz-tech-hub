import React, { useState, useRef } from 'react';
import { CategoryId, PendingBusinessSubmission } from '../types';
import {
  X,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
  Package,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  Plus,
  Info,
  AlertCircle,
  Loader2,
  FileCheck
} from 'lucide-react';

interface ListBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmissionSuccess?: (submission: PendingBusinessSubmission) => void;
}

interface UploadedPhoto {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

interface ProductServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
}

type DayKey = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface DaySchedule {
  isOpen: boolean;
  is24Hours: boolean;
  openTime: string;
  closeTime: string;
}

const DAYS_OF_WEEK: DayKey[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const DEFAULT_SCHEDULE: Record<DayKey, DaySchedule> = {
  Monday: { isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  Tuesday: { isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  Wednesday: { isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  Thursday: { isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  Friday: { isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  Saturday: { isOpen: true, is24Hours: false, openTime: '09:00', closeTime: '17:00' },
  Sunday: { isOpen: false, is24Hours: false, openTime: '12:00', closeTime: '18:00' }
};

const POPULAR_AREAS = [
  'Shendam Main Town',
  'Pangyep',
  'Po-olat',
  'Kalong',
  'Kwolla District',
  'Shimankar District',
  'Shendam GRA',
  'Expressway Corridor',
  'Central Market Road',
  'Yelwa Road Axis',
  'Derteng Area',
  'Moekwo District',
  'Dokankaswa',
  'Angwan Rogo / Hausa Quarter',
  'Other Shendam Area'
];

export const ListBusinessModal: React.FC<ListBusinessModalProps> = ({
  isOpen,
  onClose,
  onSubmissionSuccess
}) => {
  // Navigation / Tabs within the listing form
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Section A — Business Information
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<CategoryId>('businesses');
  const [subcategory, setSubcategory] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [socialMedia, setSocialMedia] = useState('');

  // Section B — Location
  const [area, setArea] = useState('Shendam Main Town');
  const [customArea, setCustomArea] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city] = useState('Shendam');
  const [lga] = useState('Shendam LGA, Plateau State, Nigeria');
  const [lat, setLat] = useState('8.876');
  const [lng, setLng] = useState('9.504');

  // Section C — Business Hours
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(DEFAULT_SCHEDULE);

  // Section D — Products & Services
  const [products, setProducts] = useState<ProductServiceItem[]>([
    { id: 'item-1', name: '', description: '', price: '' }
  ]);

  // Section E — Business Details & Amenities
  const [priceRange, setPriceRange] = useState<'₦' | '₦₦' | '₦₦₦' | '₦₦₦₦' | 'Free'>('₦₦');
  const [paymentCash, setPaymentCash] = useState(true);
  const [paymentPOS, setPaymentPOS] = useState(true);
  const [paymentTransfer, setPaymentTransfer] = useState(true);
  const [paymentUSSD, setPaymentUSSD] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [reservationAvailable, setReservationAvailable] = useState(false);
  const [parkingAvailable, setParkingAvailable] = useState(true);
  const [wifiAvailable, setWifiAvailable] = useState(false);
  const [accessibilityInfo, setAccessibilityInfo] = useState('Ground Floor Access');
  const [additionalFacilities, setAdditionalFacilities] = useState('Standby Generator, Security, Restrooms');

  // Section F — Business Photos (Real Upload Only)
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section G — Verification (Optional)
  const [cacNumber, setCacNumber] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');

  // Terms & Submission
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<PendingBusinessSubmission | null>(null);

  if (!isOpen) return null;

  // Compress & read image to base64 Data URL
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1280;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedPhotos.length + files.length > 10) {
      setErrorMessage('You can upload up to 10 real photos for your business listing.');
      return;
    }

    setIsProcessingPhotos(true);
    setErrorMessage(null);

    const newPhotos: UploadedPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataUrl = await compressImage(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl,
          name: file.name,
          size: file.size
        });
      } catch (err) {
        console.error('Error processing photo:', err);
      }
    }

    setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    setIsProcessingPhotos(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Products & Services Handlers
  const handleAddProduct = () => {
    if (products.length >= 12) return;
    setProducts((prev) => [
      ...prev,
      { id: `item-${Date.now()}`, name: '', description: '', price: '' }
    ]);
  };

  const handleUpdateProduct = (id: string, field: keyof ProductServiceItem, value: string) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveProduct = (id: string) => {
    if (products.length === 1) {
      setProducts([{ id: 'item-1', name: '', description: '', price: '' }]);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Business Hours Schedule Helpers
  const handleToggleDay = (day: DayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen }
    }));
  };

  const handleToggle24Hours = (day: DayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], is24Hours: !prev[day].is24Hours }
    }));
  };

  const handleTimeChange = (day: DayKey, type: 'openTime' | 'closeTime', val: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: val }
    }));
  };

  const handleApplyToAllDays = (sourceDay: DayKey) => {
    const source = schedule[sourceDay];
    const updated: Record<DayKey, DaySchedule> = { ...schedule };
    DAYS_OF_WEEK.forEach((d) => {
      updated[d] = { ...source };
    });
    setSchedule(updated);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!businessName.trim()) {
      setErrorMessage('Please provide your Business / Place Name.');
      setActiveStep(1);
      return;
    }
    if (!contactName.trim()) {
      setErrorMessage('Please provide the Owner or Contact Person Name.');
      setActiveStep(1);
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please provide a valid Phone Number.');
      setActiveStep(1);
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please provide the Street Address.');
      setActiveStep(2);
      return;
    }
    if (uploadedPhotos.length === 0) {
      setErrorMessage('Please upload at least 1 real photo of your business (storefront, interior, or products).');
      setActiveStep(3);
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must confirm that the information and photos provided are accurate and belong to this business.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedArea = area === 'Other Shendam Area' && customArea.trim() ? customArea.trim() : area;

      // Compile Payment Methods
      const paymentMethods: string[] = [];
      if (paymentCash) paymentMethods.push('Cash');
      if (paymentPOS) paymentMethods.push('POS / Debit Card');
      if (paymentTransfer) paymentMethods.push('Bank Transfer');
      if (paymentUSSD) paymentUSSD && paymentMethods.push('USSD Mobile Banking');

      // Compile Facilities
      const facilitiesList = additionalFacilities
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      // Filter valid products
      const validProducts = products
        .filter((p) => p.name.trim().length > 0)
        .map((p) => ({
          name: p.name.trim(),
          description: p.description.trim() || undefined,
          price: p.price.trim() || undefined
        }));

      // Parse coordinates
      const latitudeNum = parseFloat(lat) || 8.876;
      const longitudeNum = parseFloat(lng) || 9.504;

      const payload = {
        businessName: businessName.trim(),
        category,
        subcategory: subcategory.trim() || undefined,
        shortDescription: shortDescription.trim() || undefined,
        fullDescription: fullDescription.trim() || undefined,
        description: (fullDescription || shortDescription || 'Verified enterprise serving Shendam.').trim(),
        contactName: contactName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || undefined,
        website: website.trim() || undefined,
        socialMedia: socialMedia.trim() || undefined,
        area: selectedArea,
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        lga: lga.trim(),
        coordinates: { lat: latitudeNum, lng: longitudeNum },
        operatingHours: schedule,
        productsServices: validProducts,
        details: {
          priceRange,
          paymentMethods,
          deliveryAvailable,
          pickupAvailable,
          reservationAvailable,
          parkingAvailable,
          wifiAvailable,
          accessibility: accessibilityInfo.trim() || undefined,
          facilities: facilitiesList
        },
        photos: uploadedPhotos.map((p) => p.dataUrl),
        submittedPhotos: uploadedPhotos.map((p) => p.dataUrl),
        verificationInfo: {
          registrationNumber: cacNumber.trim() || undefined,
          documentNotes: verificationNotes.trim() || undefined
        },
        termsAccepted: true,
        priceRange
      };

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit business listing.');
      }

      setSubmittedResult(data.submission);
      if (onSubmissionSuccess && data.submission) {
        onSubmissionSuccess(data.submission);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while submitting your listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedResult(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#08254D] border border-white/16 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#08254D]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC928] text-[#061B3A] flex items-center justify-center font-black shadow-md shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white font-brand-sans">
                List Your Business on Shendam Connect
              </h3>
              <p className="text-[11px] text-[#9BAABD]">
                Submit your official listing for verification and community publication
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Tabs Navigation */}
        {!submittedResult && (
          <div className="px-5 pt-3 pb-2 bg-[#04142F] border-b border-white/10 flex items-center justify-between text-xs sticky top-[73px] z-10">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeStep === 1
                  ? 'bg-[#FFC928] text-[#04142F]'
                  : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              <span>1. Information</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeStep === 2
                  ? 'bg-[#FFC928] text-[#04142F]'
                  : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              <span>2. Location & Hours</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeStep === 3
                  ? 'bg-[#FFC928] text-[#04142F]'
                  : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              <span>3. Photos & Details</span>
              {uploadedPhotos.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {uploadedPhotos.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl font-bold transition cursor-pointer ${
                activeStep === 4
                  ? 'bg-[#FFC928] text-[#04142F]'
                  : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              <span>4. Services & Review</span>
            </button>
          </div>
        )}

        {/* Success Confirmation View */}
        {submittedResult ? (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 text-amber-300 mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                Status: PENDING ADMIN APPROVAL
              </span>
              <h4 className="text-xl font-black text-white font-brand-sans">
                Listing Submitted for Review!
              </h4>
              <p className="text-xs sm:text-sm text-[#9BAABD] max-w-md mx-auto leading-relaxed">
                Thank you for listing <span className="text-white font-bold">&quot;{submittedResult.businessName}&quot;</span>. Your application and uploaded photos have been routed to the Shendam Connect administration desk.
              </p>
            </div>

            {/* Application Summary Card */}
            <div className="bg-[#04142F] border border-white/12 rounded-2xl p-4 text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between items-center text-[#9BAABD]">
                <span>Reference ID:</span>
                <span className="font-mono text-white font-bold">{submittedResult.id}</span>
              </div>
              <div className="flex justify-between items-center text-[#9BAABD]">
                <span>Category:</span>
                <span className="text-[#FFC928] font-semibold">{submittedResult.categoryLabel}</span>
              </div>
              <div className="flex justify-between items-center text-[#9BAABD]">
                <span>Location:</span>
                <span className="text-white">{submittedResult.address}, {submittedResult.area}</span>
              </div>
              <div className="flex justify-between items-center text-[#9BAABD]">
                <span>Real Photos Uploaded:</span>
                <span className="text-emerald-400 font-bold">
                  {submittedResult.submittedPhotos?.length || uploadedPhotos.length} photo(s)
                </span>
              </div>
              <div className="flex justify-between items-center text-[#9BAABD]">
                <span>Submitted By:</span>
                <span className="text-white">{submittedResult.contactName} ({submittedResult.phone})</span>
              </div>
            </div>

            <div className="bg-[#0B2D5C]/60 border border-white/10 rounded-2xl p-4 text-left text-xs text-[#D5DCE8] space-y-2 max-w-md mx-auto">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
                <p>
                  <strong>What happens next?</strong> Our local verification team will inspect your details and real storefront photos. Once approved, your business will be permanently published across the Shendam Connect interactive directory, map, and category indexes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full max-w-md mx-auto py-3 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Done & Return to Shendam Connect
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: SECTION A — BUSINESS INFORMATION */}
            {/* ========================================================================= */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-white/10 pb-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#FFC928]" />
                    <span>Section A — Business Information</span>
                  </h4>
                  <p className="text-[11px] text-[#9BAABD]">
                    Primary details about your enterprise and contact person.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                    Business / Place Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shendam Grand Suites, Royal Goemai Kitchen, Apex Tech Plaza..."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Business Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CategoryId)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white outline-none focus:border-[#FFC928]"
                    >
                      <option value="businesses">Business & Commercial</option>
                      <option value="hotels">Hotel & Lodging</option>
                      <option value="restaurants">Restaurant & Dining</option>
                      <option value="shopping">Shopping & Markets</option>
                      <option value="services">Professional & Artisan Services</option>
                      <option value="transport">Transport & Logistics</option>
                      <option value="health">Health & Medical Services</option>
                      <option value="tourist_spots">Tourist & Cultural Attraction</option>
                      <option value="emergency">Emergency & Safety</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Subcategory (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pharmacy, Bakery, Salon, Cyber Cafe, Electronics..."
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                    Short Description (1-2 sentences) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief highlight of what your business offers in Shendam..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                    Full Business Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide a comprehensive description of your products, specialities, customer experience, and history..."
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/8">
                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Owner / Contact Person Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Nanle, Grace Dapiya..."
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="business@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0803 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +234 803 123 4567"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Website URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Facebook / Instagram (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. @shendamkitchen or page link"
                      value={socialMedia}
                      onChange={(e) => setSocialMedia(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!businessName.trim() || !contactName.trim() || !phone.trim()) {
                        setErrorMessage('Please fill in Business Name, Owner Name, and Contact Phone.');
                        return;
                      }
                      setErrorMessage(null);
                      setActiveStep(2);
                    }}
                    className="px-6 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    Next: Location & Hours →
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: SECTION B (LOCATION) & SECTION C (BUSINESS HOURS) */}
            {/* ========================================================================= */}
            {activeStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Location Section */}
                <div className="space-y-3.5">
                  <div className="border-b border-white/10 pb-2">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#FFC928]" />
                      <span>Section B — Business Location in Shendam</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Precise geographic details to help customers find you easily.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        Area / District *
                      </label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white outline-none focus:border-[#FFC928]"
                      >
                        {POPULAR_AREAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    {area === 'Other Shendam Area' && (
                      <div>
                        <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                          Specify Custom Area *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Type neighborhood name..."
                          value={customArea}
                          onChange={(e) => setCustomArea(e.target.value)}
                          className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 14 Jos-Ibi Road, Plot 5 Market Layout"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        Landmark / Nearby Spot
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Opposite Central Mosque, Near First Bank"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        City / Town
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={city}
                        className="w-full bg-[#04142F]/50 border border-white/10 rounded-xl p-3 text-xs text-[#D5DCE8] cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        Local Government Area
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={lga}
                        className="w-full bg-[#04142F]/50 border border-white/10 rounded-xl p-3 text-xs text-[#D5DCE8] cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#04142F]/60 p-3 rounded-xl border border-white/8 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#9BAABD] mb-1">
                        Map Latitude (Shendam default 8.876)
                      </label>
                      <input
                        type="text"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/14 rounded-lg p-2 text-xs text-white outline-none focus:border-[#FFC928]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#9BAABD] mb-1">
                        Map Longitude (Shendam default 9.504)
                      </label>
                      <input
                        type="text"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/14 rounded-lg p-2 text-xs text-white outline-none focus:border-[#FFC928]"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Hours Section */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#FFC928]" />
                        <span>Section C — Business Operating Hours</span>
                      </h4>
                      <p className="text-[11px] text-[#9BAABD]">
                        Set operating schedule for all days of the week.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyToAllDays('Monday')}
                      className="text-[11px] text-[#FFC928] hover:underline font-semibold"
                    >
                      Copy Monday to All Days
                    </button>
                  </div>

                  <div className="space-y-2 bg-[#04142F] p-3 rounded-2xl border border-white/10">
                    {DAYS_OF_WEEK.map((day) => {
                      const d = schedule[day];
                      return (
                        <div
                          key={day}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white/4 hover:bg-white/6 transition text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <input
                              type="checkbox"
                              id={`day-${day}`}
                              checked={d.isOpen}
                              onChange={() => handleToggleDay(day)}
                              className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                            />
                            <label
                              htmlFor={`day-${day}`}
                              className={`font-semibold cursor-pointer ${
                                d.isOpen ? 'text-white' : 'text-[#9BAABD] line-through'
                              }`}
                            >
                              {day}
                            </label>
                          </div>

                          {d.isOpen ? (
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 text-[11px] text-[#9BAABD]">
                                <input
                                  type="checkbox"
                                  checked={d.is24Hours}
                                  onChange={() => handleToggle24Hours(day)}
                                  className="w-3.5 h-3.5 accent-[#FFC928] rounded cursor-pointer"
                                />
                                <span>24 Hours</span>
                              </label>

                              {!d.is24Hours && (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="time"
                                    value={d.openTime}
                                    onChange={(e) => handleTimeChange(day, 'openTime', e.target.value)}
                                    className="bg-[#08254D] border border-white/16 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                  />
                                  <span className="text-[#9BAABD]">to</span>
                                  <input
                                    type="time"
                                    value={d.closeTime}
                                    onChange={(e) => handleTimeChange(day, 'closeTime', e.target.value)}
                                    className="bg-[#08254D] border border-white/16 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-rose-300/80 text-[11px] font-semibold">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    ← Back: Info
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!address.trim()) {
                        setErrorMessage('Please provide the Street Address.');
                        return;
                      }
                      setErrorMessage(null);
                      setActiveStep(3);
                    }}
                    className="px-6 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    Next: Photos & Details →
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: SECTION F (BUSINESS PHOTOS) & SECTION E (BUSINESS DETAILS) */}
            {/* ========================================================================= */}
            {activeStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Photos Section */}
                <div className="space-y-3">
                  <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#FFC928]" />
                        <span>Section F — Real Business Photos *</span>
                      </h4>
                      <p className="text-[11px] text-[#9BAABD]">
                        Upload real photographs of your storefront, signpost, interior, or products (Max 10).
                      </p>
                    </div>

                    <span className="text-xs font-bold text-[#FFC928]">
                      {uploadedPhotos.length} / 10 Photos
                    </span>
                  </div>

                  {/* Upload Trigger Area */}
                  <div className="bg-[#04142F] border-2 border-dashed border-white/20 hover:border-[#FFC928]/60 rounded-2xl p-5 text-center transition">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="business-photos-upload-input"
                    />

                    <label
                      htmlFor="business-photos-upload-input"
                      className="flex flex-col items-center justify-center cursor-pointer space-y-2.5"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#FFC928] text-[#061B3A] flex items-center justify-center shadow-lg">
                        {isProcessingPhotos ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          Click to Browse & Upload Business Photos
                        </p>
                        <p className="text-[11px] text-[#9BAABD]">
                          Supports JPG, PNG, WEBP. Photos will be verified by administrators.
                        </p>
                      </div>
                      <span className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition">
                        + Select Local Photos
                      </span>
                    </label>
                  </div>

                  {/* Photos Grid Previews */}
                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {uploadedPhotos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="relative rounded-2xl overflow-hidden border border-white/16 bg-[#04142F] group aspect-square flex items-center justify-center"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Primary Badge */}
                          {index === 0 && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#FFC928] text-[#061B3A] text-[9px] font-black uppercase shadow">
                              Cover Photo
                            </span>
                          )}

                          {/* Delete Photo Button */}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-600 transition shadow cursor-pointer opacity-90 group-hover:opacity-100"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section E: Business Details & Facilities */}
                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="border-b border-white/10 pb-2">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#FFC928]" />
                      <span>Section E — Business Details & Amenities</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Pricing, payment methods, delivery, and customer conveniences.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        Price Range Tier
                      </label>
                      <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value as any)}
                        className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white outline-none focus:border-[#FFC928]"
                      >
                        <option value="₦">₦ - Budget / Low Cost</option>
                        <option value="₦₦">₦₦ - Moderate / Standard</option>
                        <option value="₦₦₦">₦₦₦ - Premium / Executive</option>
                        <option value="₦₦₦₦">₦₦₦₦ - Luxury</option>
                        <option value="Free">Free / Community Access</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        Accessibility Information
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ground Floor, Wheelchair ramp available"
                        value={accessibilityInfo}
                        onChange={(e) => setAccessibilityInfo(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>
                  </div>

                  {/* Payment Methods Checkboxes */}
                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-2">
                      Accepted Payment Methods
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentCash}
                          onChange={(e) => setPaymentCash(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>Cash</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentTransfer}
                          onChange={(e) => setPaymentTransfer(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>Bank Transfer</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentPOS}
                          onChange={(e) => setPaymentPOS(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>POS / Cards</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentUSSD}
                          onChange={(e) => setPaymentUSSD(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>USSD Mobile</span>
                      </label>
                    </div>
                  </div>

                  {/* Service Features Checkboxes */}
                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-2">
                      Customer Service Options
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deliveryAvailable}
                          onChange={(e) => setDeliveryAvailable(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>Delivery Available</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pickupAvailable}
                          onChange={(e) => setPickupAvailable(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>Pickup / Takeaway</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reservationAvailable}
                          onChange={(e) => setReservationAvailable(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>Reservations</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={parkingAvailable}
                          onChange={(e) => setParkingAvailable(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>Free Parking Space</span>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 bg-[#04142F] border border-white/10 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wifiAvailable}
                          onChange={(e) => setWifiAvailable(e.target.checked)}
                          className="w-4 h-4 accent-[#FFC928] rounded cursor-pointer"
                        />
                        <span>Customer Wi-Fi</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                      Facilities & Amenities (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 24/7 Solar Power, Restrooms, Air Conditioning, POS Cashpoint, Cold Drinks"
                      value={additionalFacilities}
                      onChange={(e) => setAdditionalFacilities(e.target.value)}
                      className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    ← Back: Location
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (uploadedPhotos.length === 0) {
                        setErrorMessage('Please upload at least 1 real business photo before proceeding.');
                        return;
                      }
                      setErrorMessage(null);
                      setActiveStep(4);
                    }}
                    className="px-6 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    Next: Products & Review →
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: SECTION D (PRODUCTS/SERVICES), SECTION G (VERIFICATION) & SUBMIT */}
            {/* ========================================================================= */}
            {activeStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Section D: Products & Services */}
                <div className="space-y-3">
                  <div className="border-b border-white/10 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#FFC928]" />
                        <span>Section D — Products & Services</span>
                      </h4>
                      <p className="text-[11px] text-[#9BAABD]">
                        List your key offerings, menu specialties, room rates, or services.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="flex items-center gap-1 text-xs text-[#FFC928] font-bold hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {products.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-[#04142F] border border-white/10 rounded-2xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#FFC928]">
                            Item #{idx + 1}
                          </span>
                          {products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.id)}
                              className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Product / Service Name (e.g. Executive Suite, Pounded Yam & Egusi)"
                            value={item.name}
                            onChange={(e) => handleUpdateProduct(item.id, 'name', e.target.value)}
                            className="bg-[#08254D] border border-white/14 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                          />

                          <input
                            type="text"
                            placeholder="Price (Optional, e.g. ₦12,000 / night, ₦2,500)"
                            value={item.price}
                            onChange={(e) => handleUpdateProduct(item.id, 'price', e.target.value)}
                            className="bg-[#08254D] border border-white/14 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Brief description of this product / service..."
                          value={item.description}
                          onChange={(e) => handleUpdateProduct(item.id, 'description', e.target.value)}
                          className="w-full bg-[#08254D] border border-white/14 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section G: Verification (Optional) */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="border-b border-white/10 pb-2">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#FFC928]" />
                      <span>Section G — Business Verification (Optional)</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Provide CAC registration details or proof notes to accelerate admin approval.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        CAC Registration / BN Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RC 1234567 or BN 987654"
                        value={cacNumber}
                        onChange={(e) => setCacNumber(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                        Verification Notes for Admin (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Registered Goemai cooperative member, Licensed pharmacy..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Declaration */}
                <div className="p-4 bg-[#04142F] border border-white/14 rounded-2xl space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-5 h-5 accent-[#FFC928] rounded cursor-pointer shrink-0 mt-0.5"
                    />
                    <span className="text-xs text-[#D5DCE8] leading-relaxed">
                      I confirm that the information and photos provided are accurate, truthful, and belong to this business. I understand that this listing enters <strong>PENDING ADMIN APPROVAL</strong> and will be reviewed by Shendam LGA administrators before publication on Shendam Connect.
                    </span>
                  </label>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    ← Back: Photos
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !termsAccepted}
                    className="px-8 py-3.5 bg-[#FFC928] hover:bg-[#F5B800] disabled:opacity-50 text-[#061B3A] font-black text-sm rounded-xl shadow-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting for Admin Approval...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>SUBMIT BUSINESS FOR APPROVAL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ListBusinessModal;
