export type CategoryId = 
  | 'hotels'
  | 'restaurants'
  | 'businesses'
  | 'tourist_spots'
  | 'more'
  | 'transport'
  | 'events'
  | 'shopping'
  | 'services'
  | 'health'
  | 'emergency';

export interface PlaceReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface HotelRoom {
  name: string;
  price: string;
  pricePerNight?: number;
  description?: string;
}

export interface MenuItem {
  name: string;
  price: string;
  category?: string;
  description?: string;
}

export type PaymentDetailsStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'DISABLED';

export interface PlacePaymentDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  paymentInstructions?: string;
  paymentReferenceFormat?: string;
  status: PaymentDetailsStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  updatedAt?: string;
}

export interface Place {
  id: string;
  name: string;
  category: CategoryId;
  categoryLabel: string;
  rating: number;
  reviewsCount: number;
  image: string;
  logo?: string;
  gallery?: string[];
  address: string;
  area: string;
  description: string;
  phone?: string;
  whatsapp?: string;
  priceRange?: '₦' | '₦₦' | '₦₦₦' | '₦₦₦₦' | 'Free' | string;
  priceDetails?: string;
  openingHours?: string;
  featured?: boolean;
  popular?: boolean;
  verified?: boolean;
  status?: 'published' | 'draft';
  owner?: string;
  services?: string[];
  products?: string[];
  amenities?: string[];
  additionalServices?: string[];
  supportedBrands?: string[];
  accessories?: string[];
  rooms?: HotelRoom[];
  menuItems?: MenuItem[];
  culturalSignificance?: string;
  entryFee?: string;
  guideAvailable?: boolean;
  organizer?: string;
  dineInAvailable?: boolean;
  takeawayAvailable?: boolean;
  deliveryAvailable?: boolean;
  routesServed?: string[];
  vehicleTypes?: string[];
  emergencyHotline?: string;
  ambulanceAvailable?: boolean;
  createdAt?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  directionsUrl?: string;
  mapPosition?: {
    x: number; // percentage on map
    y: number; // percentage on map
  };
  reviews?: PlaceReview[];
  paymentDetails?: PlacePaymentDetails;
}

export interface HeroSlide {
  id: string;
  tagline: string;
  title: string;
  description: string;
  image: string;
  categoryTarget?: CategoryId;
}

export interface NotificationItem {
  id: string;
  title: string;
  category: string;
  time: string;
  content: string;
  read: boolean;
}

export interface ShendamEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  image: string;
  attendeesCount?: number;
  description: string;
  tag?: string;
  organizer?: string;
  featured?: boolean;
  status?: 'published' | 'draft';
}

export interface BusinessProductService {
  name: string;
  description?: string;
  price?: string;
  image?: string;
}

export interface BusinessOperatingDay {
  open?: string;
  close?: string;
  closed?: boolean;
  is24Hours?: boolean;
}

export type BusinessOperatingHours = Record<string, BusinessOperatingDay>;

export interface BusinessFeatureDetails {
  priceRange?: '₦' | '₦₦' | '₦₦₦' | '₦₦₦₦' | 'Free' | string;
  paymentMethods?: string[];
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  reservationAvailable?: boolean;
  parkingAvailable?: boolean;
  wifiAvailable?: boolean;
  accessibility?: string;
  facilities?: string[];
}

export interface BusinessVerificationInfo {
  registrationNumber?: string;
  documentNotes?: string;
  documentUrl?: string;
}

export interface PotentialDuplicateWarning {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  matchReason: string;
}

export interface PendingBusinessSubmission {
  id: string;
  businessName: string;
  category: CategoryId;
  categoryLabel: string;
  subcategory?: string;
  shortDescription?: string;
  fullDescription?: string;
  description: string;
  contactName: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  socialMedia?: string;
  area: string;
  address: string;
  landmark?: string;
  city?: string;
  lga?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  operatingHours?: BusinessOperatingHours | string;
  productsServices?: BusinessProductService[];
  details?: BusinessFeatureDetails;
  submittedPhotos?: string[];
  imageUrl?: string;
  gallery?: string[];
  verificationInfo?: BusinessVerificationInfo;
  termsAccepted?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'draft';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  priceRange?: '₦' | '₦₦' | '₦₦₦' | '₦₦₦₦' | 'Free' | string;
  potentialDuplicateOf?: PotentialDuplicateWarning | null;
}

export type TabId = 'home' | 'explore' | 'map' | 'saved' | 'profile' | 'admin' | 'jobs';

export type AdminSectionId =
  | 'overview'
  | 'admin_management'
  | 'all_listings'
  | 'hotels'
  | 'restaurants'
  | 'businesses'
  | 'attractions'
  | 'events'
  | 'services'
  | 'transport'
  | 'shopping'
  | 'health'
  | 'emergency'
  | 'revenue'
  | 'live_users'
  | 'analytics'
  | 'opportunities'
  | 'bookings'
  | 'submissions'
  | 'feedback'
  | 'users'
  | 'activity_log'
  | 'branding'
  | 'ads'
  | 'settings';

export type AdminSection = AdminSectionId;

export type AdminRole = 
  | 'SUPER_ADMIN'
  | 'CONTENT_ADMIN'
  | 'BOOKING_ADMIN'
  | 'ADVERTISING_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'VIEWER';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  title: string;
  status: 'invited' | 'active' | 'disabled';
  passwordHash?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdBy?: string;
  invitationToken?: string;
  invitationSentAt?: string;
  invitationExpiresAt?: string;
  acceptedAt?: string;
}

export interface AdminSessionUser {
  id?: string;
  email: string;
  name?: string;
  role: AdminRole;
  title: string;
}

export type SeasonalThemeType = 
  | 'none'
  | 'christmas'
  | 'sallah'
  | 'easter'
  | 'new_year'
  | 'independence_day'
  | 'custom';

export interface SeasonalConfig {
  activeTheme: SeasonalThemeType;
  customTitle?: string;
  customGreeting?: string;
  customBannerUrl?: string | null;
  accentColor?: string;
  showCelebrationBadge?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface BrandingConfig {
  splashLogo: string | null;
  homepageLogo: string | null;
  favicon?: string | null;
  homepageBackground?: string | null;
  heroBackground?: string | null;
  heroVideoUrl?: string | null;
  seasonal?: SeasonalConfig;
}

export type AdvertisementPlacement =
  | 'startup_popup'
  | 'home'
  | 'discover'
  | 'hotels'
  | 'businesses'
  | 'events'
  | 'search'
  | 'listing_details'
  | 'banner'
  | 'homepage_banner'
  | 'explore_top'
  | 'jobs_banner'
  | 'popup_interstitial';

export type AdvertisementStatus =
  | 'active'
  | 'inactive'
  | 'paused'
  | 'expired'
  | 'scheduled'
  | 'pending_approval'
  | 'draft'
  | 'rejected';

export type AdvertisementApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export type AdvertisementPaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'EXPIRED';

export type DestinationType = 'url' | 'whatsapp' | 'phone' | 'listing';

export interface Advertisement {
  id: string;
  title: string;
  businessName: string;
  description: string;
  imageUrl: string;
  bannerImageUrl?: string;
  linkUrl: string;
  destinationType?: DestinationType;
  destinationUrl?: string;
  destinationWhatsApp?: string;
  destinationPhone?: string;
  destinationListingId?: string;
  linkedPlaceId?: string;
  placement: AdvertisementPlacement;
  priority?: number;
  startDate?: string;
  endDate?: string;
  status: AdvertisementStatus;
  approvalStatus?: AdvertisementApprovalStatus;
  packageId?: string;
  paymentId?: string;
  paymentStatus?: AdvertisementPaymentStatus;
  clicksCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdvertisementPackage {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  price: number; // in NGN (₦)
  placements: AdvertisementPlacement[];
  features: string[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdvertisementPayment {
  id: string;
  advertisementId: string;
  packageId?: string;
  amount: number;
  currency: 'NGN';
  paymentStatus: AdvertisementPaymentStatus;
  paymentReference: string;
  advertiserName: string;
  advertiserEmail?: string;
  advertiserPhone?: string;
  paymentProvider: 'paystack' | 'bank_transfer' | 'manual';
  transactionData?: Record<string, any>;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GoogleAdsConfig {
  enabled: boolean;
  clientId?: string;
  slotId?: string;
  testMode?: boolean;
  placements: {
    home?: boolean;
    discover?: boolean;
    hotels?: boolean;
    businesses?: boolean;
    events?: boolean;
    search?: boolean;
    listing_details?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface AdvertisementSettings {
  localAdsEnabled: boolean;
  startupAdsEnabled: boolean;
  startupFrequencyHours: number;
  allowedPlacements: AdvertisementPlacement[];
  approvalRequired: boolean;
  googleAds: GoogleAdsConfig;
  paystack?: {
    publicKey?: string;
    configured: boolean;
  };
}

// ============================================================================
// JOBS & OPPORTUNITIES TYPES
// ============================================================================
export type OpportunityCategory =
  | 'jobs'
  | 'remote'
  | 'surveys'
  | 'data_annotation'
  | 'research'
  | 'internship'
  | 'freelance'
  | 'ngo_community'
  | 'training'
  | 'other';

export type OpportunityRemoteStatus = 'remote' | 'hybrid' | 'on_site';
export type OpportunityPaidStatus = 'paid' | 'unpaid';
export type OpportunityVerificationStatus = 'verified' | 'unverified';
export type OpportunityUrgencyStatus = 'active' | 'expiring_soon' | 'expired';
export type OpportunityMonetizationStatus = 'no_referral' | 'referral_link' | 'sponsored' | 'other';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  description: string;
  requirements: string[];
  location: string;
  remoteStatus: OpportunityRemoteStatus;
  paidStatus: OpportunityPaidStatus;
  compensation?: string;
  deadline: string; // ISO or YYYY-MM-DD
  applicationUrl: string; // Official application URL
  officialUrl?: string; // Optional alias for official URL
  referralUrl?: string; // My Referral/Affiliate URL
  monetizationStatus?: OpportunityMonetizationStatus;
  applicationInstructions?: string;
  contactInfo?: string;
  verificationStatus: OpportunityVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  featured: boolean;
  published: boolean;
  viewsCount: number;
  applyClicks: number;
  referralClicks?: number;
  confirmedCommissions?: number;
  conversionCount?: number;
  conversionNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OpportunityStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  featured: number;
  verified: number;
  totalViews: number;
  totalApplyClicks: number;
  totalReferralClicks: number;
  confirmedReferralRevenue: number;
  totalMonetized: number;
}

export interface RevenueTransaction {
  id: string;
  source: 'booking_commission' | 'advertising' | 'sponsored_listing' | 'premium_account' | 'referral_commission';
  title: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  payer: string;
  reference: string;
}

export interface RevenueSummary {
  todaysRevenue: number;
  thisMonth: number;
  bookingCommission: number;
  advertising: number;
  sponsoredListings: number;
  premiumAccounts: number;
  referralCommission?: number;
  totalReferralClicks?: number;
  confirmedReferralRevenue?: number;
  pendingReferralCommission?: number;
  confirmedConversions?: number;
  pendingRevenue: number;
  currencySymbol: string;
  recentTransactions?: RevenueTransaction[];
}

export type FeedbackType = 'feature_request' | 'issue_report' | 'general_feedback';
export type FeedbackStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  category: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  deviceInfo?: string;
  submittedAt: string;
  status: FeedbackStatus;
  adminNotes?: string;
}

export type BookingStatus =
  | 'pending'
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type BookingPaymentStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'waived';

export interface Booking {
  id: string;
  placeId: string;
  placeName: string;
  category: CategoryId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  checkInDate: string;
  checkOutDate?: string;
  guestsCount: number;
  roomOrServiceType?: string;
  specialRequests?: string;
  amount?: number | string;
  status: BookingStatus;
  paymentMethod?: string;
  paymentStatus?: BookingPaymentStatus;
  paymentReference?: string;
  paymentProofNotes?: string;
  paymentSubmittedAt?: string;
  paymentConfirmedAt?: string;
  hotelPaymentDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    paymentInstructions?: string;
    paymentReferenceFormat?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export type AnalyticsEventType =
  | 'app_opened'
  | 'page_viewed'
  | 'hotel_viewed'
  | 'business_viewed'
  | 'attraction_viewed'
  | 'opportunity_viewed'
  | 'opportunity_search'
  | 'opportunity_apply_clicked'
  | 'opportunity_referral_clicked'
  | 'opportunity_featured_viewed'
  | 'search_performed'
  | 'call_clicked'
  | 'whatsapp_clicked'
  | 'directions_clicked'
  | 'booking_started'
  | 'booking_submitted'
  | 'booking_completed'
  | 'booking_cancelled';

export interface AnalyticsEventRecord {
  id: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  entityId?: string;
  entityTitle?: string;
  category?: CategoryId;
  page: string;
  deviceCategory: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  timestamp: number;
  dateStr: string;
}

export interface UserSessionRecord {
  sessionId: string;
  firstSeen: number;
  lastSeen: number;
  currentPage: string;
  deviceCategory: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  eventCount: number;
  pageViewsCount: number;
  isActive: boolean;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  adminEmail: string;
  timestamp: number;
  dateStr: string;
}

export interface AdminSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  lgaOfficeAddress: string;
  activeHeartbeatTimeoutSec: number;
  currencySymbol: string;
  allowDirectBookings: boolean;
  autoApproveReviews: boolean;
  notificationEmailAlerts: boolean;
}

export interface AdminNotification {
  id: string;
  type: 'booking' | 'business' | 'cancellation' | 'alert' | 'review';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  linkSection?: AdminSection;
}
