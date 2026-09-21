import { Place, HeroSlide, NotificationItem, ShendamEvent, Opportunity, RevenueSummary } from '../types';

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    tagline: 'Discover',
    title: 'SHENDAM CONNECT',
    description: 'The official verified directory of local businesses, hotels, services, and opportunities in Shendam LGA.',
    image: ''
  },
  {
    id: 'hero-2',
    tagline: 'Stay',
    title: 'DREAMS HOTEL',
    description: 'Experience high standard hospitality, standby power, and comfortable luxury along Kalong Road, Dungpit.',
    image: '',
    categoryTarget: 'hotels'
  },
  {
    id: 'hero-3',
    tagline: 'Repair & Accessories',
    title: 'PAUL GSM SERVICES',
    description: 'Professional mobile phone repair, genuine parts, and quality accessories managed by Raymond Paul at Lu\'uriemdet Plaza.',
    image: '',
    categoryTarget: 'services'
  }
];

export const POPULAR_PLACES: Place[] = [
  {
    id: 'place-dreams-hotel',
    name: 'Dreams Hotel',
    category: 'hotels',
    categoryLabel: 'Hotel',
    rating: 0,
    reviewsCount: 0,
    image: '',
    gallery: [],
    address: 'KM 2, Kalong Road, Dungpit, Shendam LGA, Plateau State, Nigeria',
    area: 'KM 2, Kalong Road, Dungpit',
    description: 'Welcome to Dreams Hotel, located along Kalong Road in Dungpit, Shendam. Experience high standard hospitality with modern, comfortable rooms, private balconies, standby power, and comprehensive guest services tailored for travelers, tourists, and business visitors in Shendam.',
    phone: '+234 803 456 7890',
    whatsapp: '+234 803 456 7890',
    priceRange: 'From ₦15,000 / night',
    priceDetails: 'Standard Room: ₦15,000/night • Super Deluxe: ₦25,000/night • Presidential Suite: ₦35,000/night',
    openingHours: 'Open 24/7 (Customer Care & Front Desk)',
    featured: true,
    popular: true,
    amenities: [
      'Wi-Fi',
      'Air Conditioning',
      'Towels',
      'Microwave',
      'Coffee Maker',
      'Mini Bar',
      'Parking Space',
      'Private Balcony'
    ],
    additionalServices: [
      'Airport Pickup',
      'Messaging',
      'Customer Care'
    ],
    rooms: [
      {
        name: 'Standard Room',
        price: '₦15,000 / night',
        pricePerNight: 15000,
        description: 'Comfortable air-conditioned room featuring high-speed Wi-Fi, fresh towels, ensuite bathroom, and work desk.'
      },
      {
        name: 'Super Deluxe',
        price: '₦25,000 / night',
        pricePerNight: 25000,
        description: 'Spacious deluxe room with mini bar, coffee maker, microwave, private balcony, and upgraded bedding.'
      },
      {
        name: 'Presidential Suite',
        price: '₦35,000 / night',
        pricePerNight: 35000,
        description: 'VIP executive suite offering an expansive living area, mini bar, private balcony with scenic views, and dedicated care.'
      }
    ],
    coordinates: { lat: 8.8625, lng: 9.5070 },
    reviews: [],
    paymentDetails: {
      accountName: 'Dreams Hotel Shendam Ltd',
      accountNumber: '1012345678',
      bankName: 'First Bank of Nigeria',
      paymentInstructions: 'Transfer exact amount to the hotel bank account. Include your Booking Reference in the transfer narration/remarks.',
      paymentReferenceFormat: 'SHD-DREAMS-[REF]',
      status: 'VERIFIED',
      verifiedAt: '2026-01-15T10:00:00.000Z',
      verifiedBy: 'Executive Super Admin'
    }
  },
  {
    id: 'place-pedano-hotel',
    name: 'Pedano Hotel',
    category: 'hotels',
    categoryLabel: 'Hotel',
    rating: 0,
    reviewsCount: 0,
    image: '',
    gallery: [],
    address: 'No details available yet.',
    area: 'Shendam Town',
    description: 'No information available yet.',
    phone: '',
    whatsapp: '',
    priceRange: 'No details available yet.',
    priceDetails: 'No details available yet.',
    openingHours: 'No details available yet.',
    featured: true,
    popular: true,
    amenities: ['No details available yet.'],
    coordinates: { lat: 8.873, lng: 9.502 },
    reviews: []
  },
  {
    id: 'place-paul-gsm',
    name: 'Paul GSM Repair Services',
    category: 'services',
    categoryLabel: 'Phone Repair & Mobile Accessories',
    rating: 0,
    reviewsCount: 0,
    image: '',
    gallery: [],
    address: "No. 10 Shop, Lu'uriemdet Plaza, Along Kalong Road, Texas, Shendam LGA, Plateau State, Nigeria.",
    area: "No. 10 Shop, Lu'uriemdet Plaza, Along Kalong Road, Texas, Shendam LGA",
    description: "Conveniently located at Lu'uriemdet Plaza, Shop No. 10 along Kalong Road, Texas, Shendam LGA. Managed by Raymond Paul. Customers can visit the shop for professional mobile phone repairs, replacement parts, hardware diagnostics, and quality smartphone accessories.",
    phone: '+234 706 728 7969',
    whatsapp: '+234 706 728 7969',
    priceRange: '₦₦',
    priceDetails: 'Affordable Rates & Diagnostic Consultation',
    openingHours: '7:00 AM – 6:00 PM',
    featured: true,
    popular: true,
    owner: 'Raymond Paul',
    amenities: [
      'Mobile phone repair',
      'Screen replacement',
      'Touchscreen replacement',
      'LCD/display replacement',
      'Battery replacement',
      'Charging port replacement',
      'Charging jack repair',
      'Power button repair',
      'Volume button repair',
      'Speaker replacement/repair',
      'Microphone repair',
      'Camera replacement/repair',
      'Flashlight repair',
      'Water-damage assessment and repair',
      'General hardware troubleshooting',
      'Phone diagnostics',
      'Phone maintenance'
    ],
    supportedBrands: [
      'Apple iPhone',
      'Samsung',
      'Tecno',
      'Infinix',
      'itel',
      'Xiaomi/Redmi',
      'Oppo',
      'Vivo',
      'Nokia',
      'Huawei',
      'Google Pixel',
      'OnePlus',
      'Motorola',
      'Realme',
      'Honor',
      'ZTE',
      'Alcatel',
      'Other major Android phones'
    ],
    accessories: [
      'Phone cases',
      'Phone covers',
      'Screen protectors',
      'Tempered glass',
      'Replacement batteries',
      'Charging cables',
      'Wall chargers',
      'Fast chargers',
      'Car chargers',
      'USB cables',
      'Phone holders',
      'Mobile phone accessories'
    ],
    coordinates: {
      lat: 8.8768,
      lng: 9.5055
    },
    reviews: []
  }
];

export const SHENDAM_EVENTS: ShendamEvent[] = [];

export const EXPLORE_TOPICS = [
  {
    id: 'attractions',
    title: 'Tourist Attractions',
    subtitle: 'Waterfalls, hills & scenic trails',
    count: 'Scenic Spots',
    targetCategory: 'tourist_spots' as const,
    image: ''
  },
  {
    id: 'stay',
    title: 'Places to Stay',
    subtitle: 'Hotels, lodges & executive suites',
    count: 'Verified Lodges',
    targetCategory: 'hotels' as const,
    image: ''
  },
  {
    id: 'food',
    title: 'Local Food',
    subtitle: 'Goemai tuwo, suya & fresh grills',
    count: 'Local Dining',
    targetCategory: 'restaurants' as const,
    image: ''
  },
  {
    id: 'culture',
    title: 'Culture & Heritage',
    subtitle: 'Long Goemai palace & historic sites',
    count: 'Historic',
    targetCategory: 'tourist_spots' as const,
    image: ''
  }
];

export const NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_PENDING_SUBMISSIONS = [];

export const INITIAL_BOOKINGS = [];

export const INITIAL_ADMIN_SETTINGS = {
  platformName: 'Shendam Connect',
  supportEmail: 'admin@shendamconnect.gov.ng',
  supportPhone: '+234 803 000 7436',
  supportWhatsapp: '+234 803 000 7436',
  supportHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
  supportDescription: 'Need assistance with your business listing, bookings, or community inquiries? Reach our dedicated support team.',
  lgaOfficeAddress: 'Shendam LGA Secretariat, Commercial Road, Shendam, Plateau State',
  lgaOfficialWebsiteUrl: '',
  lgaOfficialWebsiteLabel: 'Official Local Government Website',
  lgaPublicInfoTitle: 'Shendam Local Government',
  lgaPublicInfoDescription: 'Official public and community information for Shendam Local Government Area, Plateau State. Shendam serves as the headquarters of Plateau South Senatorial District and the ancestral seat of Goemai heritage.',
  lgaStateRegion: 'Plateau State, Nigeria',
  lgaBadgeText: 'Public Info',
  lgaProfileImage: '/uploads/logo_1789610605536_d4d7bb92.webp',
  lgaCultureTitle: 'Goemai Heritage & Monarch',
  lgaCultureDescription: 'Shendam is the traditional seat of the Long Goemai, supreme ruler of the Goemai Kingdom. Renowned for rich agricultural produce (yam, rice, sesame) and vibrant traditional festivals including the famous Bit Goemai celebration.',
  emergencyHotlinesTitle: 'Emergency Hotlines',
  emergencyHotlinesBadge: '24/7 Response',
  emergencyPhone1Label: 'National Emergency',
  emergencyPhone1Number: '112',
  emergencyPhone1Display: 'Dial 112',
  emergencyPhone2Label: 'General Hospital',
  emergencyPhone2Number: '+2348039110000',
  emergencyPhone2Display: '+234 803 911 0000',
  activeHeartbeatTimeoutSec: 90,
  currencySymbol: '₦',
  allowDirectBookings: true,
  autoApproveReviews: false,
  notificationEmailAlerts: true
};

export const INITIAL_AUDIT_LOGS = [];

export const INITIAL_FEEDBACK_QUEUE = [];

export const INITIAL_REVENUE_DATA: RevenueSummary = {
  todaysRevenue: 0,
  thisMonth: 0,
  bookingCommission: 0,
  advertising: 0,
  sponsoredListings: 0,
  premiumAccounts: 0,
  referralCommission: 0,
  totalReferralClicks: 0,
  confirmedReferralRevenue: 0,
  pendingReferralCommission: 0,
  confirmedConversions: 0,
  pendingRevenue: 0,
  currencySymbol: '₦',
  recentTransactions: []
};

export const INITIAL_OPPORTUNITIES: Opportunity[] = [];
