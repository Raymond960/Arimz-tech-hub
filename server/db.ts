import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  HERO_SLIDES,
  NOTIFICATIONS,
  SHENDAM_EVENTS,
  POPULAR_PLACES,
  INITIAL_PENDING_SUBMISSIONS,
  INITIAL_BOOKINGS,
  INITIAL_ADMIN_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FEEDBACK_QUEUE,
  INITIAL_REVENUE_DATA,
  INITIAL_OPPORTUNITIES
} from '../src/data/mockData';
import {
  Place,
  HeroSlide,
  NotificationItem,
  ShendamEvent,
  PendingBusinessSubmission,
  Booking,
  AdminSettings,
  AuditLogRecord,
  AnalyticsEventRecord,
  UserSessionRecord,
  AdminNotification,
  FeedbackItem,
  RevenueSummary,
  Opportunity,
  BrandingConfig,
  SeasonalConfig,
  SeasonalThemeType,
  Advertisement,
  AdvertisementPackage,
  AdvertisementPayment,
  AdvertisementSettings,
  AdvertisementPlacement,
  AdvertisementStatus,
  AdvertisementApprovalStatus,
  AdvertisementPaymentStatus,
  AdminUser,
  AdminRole,
  RegisteredUser,
  UserVerificationRecord,
  UserAuthSession
} from '../src/types';

export interface DatabaseSchema {
  places: Place[];
  events: ShendamEvent[];
  heroSlides: HeroSlide[];
  advertisements?: Advertisement[];
  advertisementPackages?: AdvertisementPackage[];
  advertisementPayments?: AdvertisementPayment[];
  advertisementSettings?: AdvertisementSettings;
  notifications: NotificationItem[];
  pendingSubmissions: PendingBusinessSubmission[];
  feedbackQueue: FeedbackItem[];
  bookings: Booking[];
  opportunities: Opportunity[];
  revenue: RevenueSummary;
  settings: AdminSettings;
  branding?: BrandingConfig;
  auditLogs: AuditLogRecord[];
  adminNotifications: AdminNotification[];
  analyticsEvents: AnalyticsEventRecord[];
  sessions: Record<string, UserSessionRecord>;
  adminSessions?: Record<string, any>;
  admins?: AdminUser[];
  users?: RegisteredUser[];
  userVerifications?: Record<string, UserVerificationRecord>;
  userSessions?: Record<string, UserAuthSession>;
  uploadedImages?: Record<string, { mimeType: string; base64Data: string }>;
  deletedPlaceIds?: string[];
  deletedEventIds?: string[];
  deletedAdIds?: string[];
}

// Serverless & Read-only Filesystem Safe Directory Initializer
function getWritableDataDir(): string {
  const defaultDir = path.join(process.cwd(), 'server-data');
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    const testFile = path.join(defaultDir, `.test_write_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return defaultDir;
  } catch {
    // If running in serverless / read-only filesystem (e.g., Vercel), fallback to /tmp/server-data
    const tmpDir = path.join('/tmp', 'shendam-server-data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return '/tmp';
    }
  }
}

const DATA_DIR = getWritableDataDir();
const DB_FILE_PATH = path.join(DATA_DIR, 'shendam_db.json');
const DB_BACKUP_PATH = path.join(DATA_DIR, 'shendam_db.json.bak');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const DIST_UPLOADS_DIR = path.join(process.cwd(), 'dist', 'uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Non-fatal on read-only serverless filesystem
}

// Default initial Super Admin
export const INITIAL_SUPER_ADMIN: AdminUser = {
  id: 'admin-super-primary',
  email: 'domnanraymond9@gmail.com',
  name: 'Super Admin & Platform Director',
  role: 'SUPER_ADMIN',
  title: 'Executive Platform Director',
  status: 'active',
  createdAt: new Date().toISOString()
};

// Initial Advertisements
export const INITIAL_ADVERTISEMENTS: Advertisement[] = [
  {
    id: 'ad-shendam-resort-startup',
    title: 'Experience Shendam Holiday Suites & Banquet Centre',
    businessName: 'Shendam Holiday Resort & Suites',
    description: 'Premier executive accommodation with 24/7 solar backup, sparkling gardens, chilled refreshments, and authentic Plateau delicacies.',
    imageUrl: '',
    bannerImageUrl: '',
    linkUrl: 'https://wa.me/2348034567890?text=Hello%20Shendam%20Holiday%20Resort,%20I%20saw%20your%20promo%20on%20Shendam%20Connect',
    destinationType: 'whatsapp',
    destinationWhatsApp: '+2348034567890',
    destinationUrl: 'https://wa.me/2348034567890',
    placement: 'startup_popup',
    priority: 10,
    status: 'active',
    approvalStatus: 'approved',
    paymentStatus: 'PAID',
    clicksCount: 19,
    viewsCount: 342,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-shendam-suites',
    title: 'Weekend Getaway & Luxury Stays',
    businessName: 'Dreams Hotel Shendam',
    description: 'Book executive suites with standby 24/7 power, complimentary breakfast and high-speed Wi-Fi.',
    imageUrl: '',
    bannerImageUrl: '',
    linkUrl: 'https://wa.me/2348034567890',
    destinationType: 'whatsapp',
    destinationWhatsApp: '+2348034567890',
    destinationUrl: 'https://wa.me/2348034567890',
    placement: 'homepage_banner',
    priority: 5,
    status: 'active',
    approvalStatus: 'approved',
    paymentStatus: 'PAID',
    clicksCount: 42,
    viewsCount: 890,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-shendam-tech',
    title: 'Paul GSM Services - Quality Phone Repairs',
    businessName: 'Paul GSM Services',
    description: 'Fast screen replacements, original accessories & hardware diagnostics at Lu\'uriemdet Plaza.',
    imageUrl: '',
    bannerImageUrl: '',
    linkUrl: 'https://wa.me/2348031234567',
    destinationType: 'phone',
    destinationPhone: '+2348031234567',
    destinationUrl: 'tel:+2348031234567',
    placement: 'explore_top',
    priority: 4,
    status: 'active',
    approvalStatus: 'approved',
    paymentStatus: 'PAID',
    clicksCount: 28,
    viewsCount: 512,
    createdAt: new Date().toISOString()
  }
];

// Initial Advertisement Packages (Super Admin customizable, not hardcoded in UI)
export const INITIAL_ADVERTISEMENT_PACKAGES: AdvertisementPackage[] = [
  {
    id: 'pkg-basic-7d',
    name: 'Basic Spotlight',
    description: 'Single prominent placement for local Shendam shops, technicians, and community services.',
    durationDays: 7,
    price: 15000,
    placements: ['home', 'banner'],
    features: [
      '7 Days Active Run',
      'Homepage / Category Banner Placement',
      'Direct WhatsApp or Call Dialing',
      'Basic Performance Analytics'
    ],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'pkg-featured-30d',
    name: 'Featured Merchant Showcase',
    description: 'High-visibility multi-screen promotion across Shendam tourism, hotels, and dining feeds.',
    durationDays: 30,
    price: 45000,
    placements: ['home', 'discover', 'hotels', 'businesses', 'events'],
    features: [
      '30 Days Guaranteed Visibility',
      'Cross-Category Placements (Home, Discover, Hotels)',
      'Direct Listing Integration & Verified Badge',
      'Detailed Real-time Click & Impression Tracking',
      'Priority Delivery in Search & Feeds'
    ],
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'pkg-premium-town-takeover-30d',
    name: 'Premium Town Takeover & Startup Popup',
    description: 'Maximum reach and brand awareness including the exclusive App Startup Welcome Card.',
    durationDays: 30,
    price: 95000,
    placements: ['startup_popup', 'home', 'discover', 'hotels', 'businesses', 'events', 'search', 'listing_details', 'banner'],
    features: [
      '30 Days All-Placements Access',
      'Exclusive App Startup Promotional Modal',
      'Top Priority in Feeds & Search Results',
      'Banner & High-Resolution Creative Hosting',
      'Comprehensive Executive ROI Analytics Report',
      'Dedicated Admin Campaign Optimization'
    ],
    active: true,
    createdAt: new Date().toISOString()
  }
];

// Initial Advertisement Settings
export const INITIAL_ADVERTISEMENT_SETTINGS: AdvertisementSettings = {
  localAdsEnabled: true,
  startupAdsEnabled: true,
  startupFrequencyHours: 12,
  allowedPlacements: [
    'startup_popup',
    'home',
    'discover',
    'hotels',
    'businesses',
    'events',
    'search',
    'listing_details',
    'banner'
  ],
  approvalRequired: false,
  googleAds: {
    enabled: process.env.GOOGLE_ADS_ENABLED === 'true',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    slotId: process.env.GOOGLE_ADS_SLOT_ID || '',
    testMode: true,
    placements: {
      home: true,
      discover: true,
      hotels: true,
      businesses: true,
      events: true,
      search: true,
      listing_details: true
    }
  },
  paystack: {
    publicKey: process.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    configured: Boolean(process.env.PAYSTACK_SECRET_KEY)
  }
};

// In-Memory Master Database instance (Initialized with persistent storage, seeded with baseline directory)
let db: DatabaseSchema = {
  places: POPULAR_PLACES,
  events: SHENDAM_EVENTS,
  heroSlides: HERO_SLIDES,
  advertisements: INITIAL_ADVERTISEMENTS,
  advertisementPackages: INITIAL_ADVERTISEMENT_PACKAGES,
  advertisementPayments: [],
  advertisementSettings: INITIAL_ADVERTISEMENT_SETTINGS,
  notifications: NOTIFICATIONS,
  pendingSubmissions: INITIAL_PENDING_SUBMISSIONS,
  feedbackQueue: INITIAL_FEEDBACK_QUEUE,
  bookings: INITIAL_BOOKINGS,
  opportunities: INITIAL_OPPORTUNITIES,
  revenue: INITIAL_REVENUE_DATA,
  settings: INITIAL_ADMIN_SETTINGS,
  branding: {
    splashLogo: null,
    homepageLogo: null,
    favicon: null,
    homepageBackground: null,
    heroBackground: null,
    heroVideoUrl: null,
    seasonal: {
      activeTheme: 'none',
      customTitle: '',
      customGreeting: '',
      customBannerUrl: null,
      accentColor: '#FFC928',
      showCelebrationBadge: false
    }
  },
  auditLogs: INITIAL_AUDIT_LOGS,
  adminNotifications: [],
  analyticsEvents: [],
  sessions: {},
  admins: [INITIAL_SUPER_ADMIN],
  uploadedImages: {},
  deletedPlaceIds: [],
  deletedEventIds: [],
  deletedAdIds: []
};

/**
 * Determine MIME type from file extension
 */
/**
 * Determine MIME type from file extension
 */
function getMimeTypeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'avif': return 'image/avif';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

// ============================================================================
// UPLOAD RATE LIMITING & SECURITY VALIDATION
// ============================================================================

export const UPLOAD_RATE_LIMIT_WINDOW_MS = parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '', 10) || 15 * 60 * 1000; // 15 minutes
export const UPLOAD_RATE_LIMIT_MAX = parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '', 10) || 30; // 30 uploads per window
export const MAX_IMAGE_SIZE_BYTES = parseInt(process.env.MAX_IMAGE_SIZE_BYTES || '', 10) || 5 * 1024 * 1024; // 5 MB

const uploadRateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if the caller has exceeded the upload rate limit.
 */
export function checkUploadRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const current = uploadRateLimits.get(identifier);

  if (!current || now > current.resetTime) {
    uploadRateLimits.set(identifier, { count: 1, resetTime: now + UPLOAD_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= UPLOAD_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetTime - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  current.count++;
  return { allowed: true };
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  mimeType: string;
  extension: string;
  safeFilename: string;
}

/**
 * Strict image validation:
 * 1. Checks buffer size against 5MB maximum.
 * 2. Checks and verifies magic bytes (JPEG, PNG, GIF, WebP, AVIF).
 * 3. Strictly rejects executable files, scripts, SVG containing scripts, HTML, PHP.
 * 4. Generates a collision-resistant, cryptographic safe unique filename.
 */
export function validateUploadedImageBuffer(
  buffer: Buffer,
  declaredMimeType?: string,
  originalFilename?: string,
  prefix = 'biz'
): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: 'Uploaded image file is empty or corrupted.',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      safeFilename: ''
    };
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    const maxMb = Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024));
    return {
      valid: false,
      error: `Image is too large. Maximum size allowed is ${maxMb}MB.`,
      mimeType: 'image/jpeg',
      extension: 'jpg',
      safeFilename: ''
    };
  }

  // Detect image type from Magic Bytes (Buffer header)
  let detectedMime = '';
  let extension = 'jpg';

  // 1. JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    detectedMime = 'image/jpeg';
    extension = 'jpg';
  }
  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  else if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    detectedMime = 'image/png';
    extension = 'png';
  }
  // 3. GIF: 47 49 46 38
  else if (buffer.length >= 4 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    detectedMime = 'image/gif';
    extension = 'gif';
  }
  // 4. WebP: RIFF .... WEBP
  else if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    detectedMime = 'image/webp';
    extension = 'webp';
  }
  // 5. AVIF: .... ftypavif or ftypavis
  else if (buffer.length >= 12 && (buffer.subarray(4, 12).toString('ascii') === 'ftypavif' || buffer.subarray(4, 12).toString('ascii') === 'ftypavis')) {
    detectedMime = 'image/avif';
    extension = 'avif';
  }

  // If magic bytes were not matched, inspect declared mime type or original filename for safe fallback
  if (!detectedMime) {
    const rawMime = (declaredMimeType || '').toLowerCase().trim();
    if (rawMime === 'image/jpeg' || rawMime === 'image/jpg') {
      detectedMime = 'image/jpeg';
      extension = 'jpg';
    } else if (rawMime === 'image/png') {
      detectedMime = 'image/png';
      extension = 'png';
    } else if (rawMime === 'image/webp') {
      detectedMime = 'image/webp';
      extension = 'webp';
    } else if (rawMime === 'image/gif') {
      detectedMime = 'image/gif';
      extension = 'gif';
    } else if (rawMime === 'image/avif') {
      detectedMime = 'image/avif';
      extension = 'avif';
    } else {
      return {
        valid: false,
        error: 'Unsupported image type. Please upload a valid JPG, PNG, WebP, or GIF image.',
        mimeType: 'image/jpeg',
        extension: 'jpg',
        safeFilename: ''
      };
    }
  }

  // Sanitize prefix to prevent directory traversal
  const safePrefix = path.basename(prefix).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'img';
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const safeFilename = `${safePrefix}_${Date.now()}_${randomSuffix}.${extension}`;

  return {
    valid: true,
    mimeType: detectedMime,
    extension,
    safeFilename
  };
}

/**
 * Permanently stores an image buffer on disk (both public/uploads and dist/uploads)
 * and in the persistent database schema (uploadedImages base64).
 * Works reliably across Docker, Cloud Run, and Serverless (Vercel) environments.
 */
export function storeImageBuffer(filename: string, mimeType: string, buffer: Buffer): string {
  const safeName = path.basename(filename);

  // 1. Attempt writing to public/uploads
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const publicFilePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(publicFilePath, buffer);
  } catch {
    // Non-fatal on read-only serverless filesystem
  }

  // 2. Attempt writing to dist/uploads if production bundle directory exists
  try {
    const distDir = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      if (!fs.existsSync(DIST_UPLOADS_DIR)) {
        fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
      }
      const distFilePath = path.join(DIST_UPLOADS_DIR, safeName);
      fs.writeFileSync(distFilePath, buffer);
    }
  } catch {
    // Non-fatal
  }

  // 3. Attempt writing to /tmp/uploads for fast ephemeral access on serverless
  try {
    const tmpUploadDir = path.join('/tmp', 'uploads');
    if (!fs.existsSync(tmpUploadDir)) {
      fs.mkdirSync(tmpUploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tmpUploadDir, safeName), buffer);
  } catch {
    // Non-fatal
  }

  // 4. Always persist in-memory and database uploadedImages map (guarantees durability across cold starts)
  if (!db.uploadedImages) {
    db.uploadedImages = {};
  }
  db.uploadedImages[safeName] = {
    mimeType: mimeType || getMimeTypeFromFilename(safeName),
    base64Data: buffer.toString('base64')
  };

  saveDatabase(true);
  return `/uploads/${safeName}`;
}

/**
 * Convert a base64 data URI (e.g. data:image/png;base64,...) into a permanent file on disk & database.
 * Returns the permanent /uploads/filename URL or null if invalid.
 */
export function persistDataUriImage(dataUri: string, prefix = 'biz'): string | null {
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
    return null;
  }
  try {
    const semicolonIdx = dataUri.indexOf(';');
    const base64Idx = dataUri.indexOf('base64,');
    if (base64Idx === -1) return null;

    const declaredMime = dataUri.substring(5, semicolonIdx !== -1 ? semicolonIdx : base64Idx).trim();
    const base64Data = dataUri.substring(base64Idx + 7).trim();
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0) return null;

    const validation = validateUploadedImageBuffer(buffer, declaredMime, undefined, prefix);
    if (!validation.valid || !validation.safeFilename) {
      console.warn('[Storage] Image validation failed for data URI:', validation.error);
      return null;
    }

    return storeImageBuffer(validation.safeFilename, validation.mimeType, buffer);
  } catch (err) {
    console.error('[Database] Failed to persist data URI image:', err);
    return null;
  }
}

// Load persistent DB from file if exists
export function initDatabase() {
  try {
    // Legacy migration check: move root shendam_db.json to server-data/ if found
    const legacyDbPath = path.join(process.cwd(), 'shendam_db.json');
    const legacyBakPath = path.join(process.cwd(), 'shendam_db.json.bak');
    if (fs.existsSync(legacyDbPath)) {
      try {
        if (!fs.existsSync(DB_FILE_PATH)) {
          fs.copyFileSync(legacyDbPath, DB_FILE_PATH);
          console.log('[Database] Migrated legacy root shendam_db.json to server-data/shendam_db.json');
        }
        fs.unlinkSync(legacyDbPath);
      } catch (migErr) {
        console.warn('[Database] Error migrating legacy database file:', migErr);
      }
    }
    if (fs.existsSync(legacyBakPath)) {
      try {
        if (!fs.existsSync(DB_BACKUP_PATH)) {
          fs.copyFileSync(legacyBakPath, DB_BACKUP_PATH);
        }
        fs.unlinkSync(legacyBakPath);
      } catch {}
    }

    // 0. Serverless bootstrap: If writable DB file does not exist yet (e.g. in /tmp on Vercel),
    // copy bundled server-data/shendam_db.json into the writable location
    const bundledDbPath = path.join(process.cwd(), 'server-data', 'shendam_db.json');
    if (!fs.existsSync(DB_FILE_PATH) && fs.existsSync(bundledDbPath)) {
      try {
        const bundledContent = fs.readFileSync(bundledDbPath, 'utf-8');
        fs.writeFileSync(DB_FILE_PATH, bundledContent, 'utf-8');
        console.log('[Database] Bootstrapped writable database from bundled server-data/shendam_db.json');
      } catch (seedErr) {
        console.warn('[Database] Read-only environment, will read bundled DB directly:', seedErr);
      }
    }

    let parsed: any = null;

    // 1. Try reading primary database file
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const fileData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        parsed = JSON.parse(fileData);
      } catch (readErr) {
        console.warn('[Database] Primary shendam_db.json corrupted or unreadable, attempting backup recovery...', readErr);
      }
    }

    // 2. Fallback to backup if primary failed or was missing
    if (!parsed && fs.existsSync(DB_BACKUP_PATH)) {
      try {
        const backupData = fs.readFileSync(DB_BACKUP_PATH, 'utf-8');
        parsed = JSON.parse(backupData);
        console.log('[Database] Successfully restored database from shendam_db.json.bak');
      } catch (bakErr) {
        console.warn('[Database] Backup shendam_db.json.bak also unreadable:', bakErr);
      }
    }

    // 3. Fallback to bundled repository database if /tmp or primary was empty
    if (!parsed && fs.existsSync(bundledDbPath)) {
      try {
        const bundledData = fs.readFileSync(bundledDbPath, 'utf-8');
        parsed = JSON.parse(bundledData);
        console.log('[Database] Loaded database directly from bundled repository server-data/shendam_db.json');
      } catch (bundleErr) {
        console.warn('[Database] Bundled repository database also unreadable:', bundleErr);
      }
    }

    if (parsed) {
      const deletedPlaceIds: string[] = Array.isArray(parsed.deletedPlaceIds) ? parsed.deletedPlaceIds : [];
      const deletedEventIds: string[] = Array.isArray(parsed.deletedEventIds) ? parsed.deletedEventIds : [];
      const deletedAdIds: string[] = Array.isArray(parsed.deletedAdIds) ? parsed.deletedAdIds : [];

      // Load saved data directly from persistent disk state and filter out any tombstone deleted items
      const rawPlaces: Place[] = Array.isArray(parsed.places) && parsed.places.length > 0 ? parsed.places : POPULAR_PLACES;
      const loadedPlaces: Place[] = rawPlaces
        .filter((p) => !deletedPlaceIds.includes(p.id))
        .map((p) => {
          const cleanImage = p.image && (p.image.includes('unsplash.com') || p.image.includes('paul_gsm')) ? '' : (p.image || '');
          const cleanGallery = Array.isArray(p.gallery)
            ? p.gallery.filter((g) => g && !g.includes('unsplash.com') && !g.includes('paul_gsm'))
            : [];
          let updated = { ...p, image: cleanImage, gallery: cleanGallery };

          // If Dreams Hotel or other hotel has no payment details yet, seed with baseline verified details
          if (updated.id === 'place-dreams-hotel' && !updated.paymentDetails) {
            const baseline = POPULAR_PLACES.find((bp) => bp.id === 'place-dreams-hotel');
            if (baseline?.paymentDetails) {
              updated = { ...updated, paymentDetails: baseline.paymentDetails };
            }
          }
          if ((updated as any).mapPosition) {
            delete (updated as any).mapPosition;
          }
          return updated;
        });

      const rawEvents: ShendamEvent[] = Array.isArray(parsed.events) ? parsed.events : SHENDAM_EVENTS;
      const loadedEvents: ShendamEvent[] = rawEvents
        .filter((e) => !deletedEventIds.includes(e.id))
        .map((e) => ({
          ...e,
          image: e.image && e.image.includes('unsplash.com') ? '' : (e.image || '')
        }));

      const rawHeroSlides: HeroSlide[] = Array.isArray(parsed.heroSlides) ? parsed.heroSlides : HERO_SLIDES;
      const loadedHeroSlides: HeroSlide[] = rawHeroSlides.map((s) => ({
        ...s,
        image: s.image && s.image.includes('unsplash.com') ? '' : (s.image || '')
      }));

      const rawAds: Advertisement[] = Array.isArray(parsed.advertisements) ? parsed.advertisements : INITIAL_ADVERTISEMENTS;
      let loadedAds: Advertisement[] = rawAds
        .filter((a) => !deletedAdIds.includes(a.id))
        .map((a) => ({
          ...a,
          imageUrl: a.imageUrl && a.imageUrl.includes('unsplash.com') ? '' : (a.imageUrl || ''),
          bannerImageUrl: a.bannerImageUrl && a.bannerImageUrl.includes('unsplash.com') ? '' : (a.bannerImageUrl || '')
        }));
      // Ensure at least one active startup popup ad exists if not previously deleted
      const hasStartup = loadedAds.some((a) => a.placement === 'startup_popup' || a.placement === 'popup_interstitial');
      if (!hasStartup && !deletedAdIds.includes(INITIAL_ADVERTISEMENTS[0].id)) {
        loadedAds = [INITIAL_ADVERTISEMENTS[0], ...loadedAds];
      }

      const rawAdmins: AdminUser[] = Array.isArray(parsed.admins) ? parsed.admins : [INITIAL_SUPER_ADMIN];
      // Ensure primary super admin always exists
      const hasSuper = rawAdmins.some((a) => a.email.toLowerCase() === INITIAL_SUPER_ADMIN.email.toLowerCase());
      if (!hasSuper) {
        rawAdmins.unshift(INITIAL_SUPER_ADMIN);
      }

      const defaultSeasonal: SeasonalConfig = {
        activeTheme: 'none',
        customTitle: '',
        customGreeting: '',
        customBannerUrl: null,
        accentColor: '#FFC928',
        showCelebrationBadge: false
      };

      db = {
        places: loadedPlaces,
        events: loadedEvents,
        heroSlides: loadedHeroSlides,
        advertisements: loadedAds,
        advertisementPackages: Array.isArray(parsed.advertisementPackages) && parsed.advertisementPackages.length > 0
          ? parsed.advertisementPackages
          : INITIAL_ADVERTISEMENT_PACKAGES,
        advertisementPayments: Array.isArray(parsed.advertisementPayments)
          ? parsed.advertisementPayments
          : [],
        advertisementSettings: parsed.advertisementSettings
          ? {
              ...INITIAL_ADVERTISEMENT_SETTINGS,
              ...parsed.advertisementSettings,
              googleAds: {
                ...INITIAL_ADVERTISEMENT_SETTINGS.googleAds,
                ...(parsed.advertisementSettings.googleAds || {}),
                placements: {
                  ...INITIAL_ADVERTISEMENT_SETTINGS.googleAds.placements,
                  ...((parsed.advertisementSettings.googleAds && parsed.advertisementSettings.googleAds.placements) || {})
                }
              }
            }
          : INITIAL_ADVERTISEMENT_SETTINGS,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : NOTIFICATIONS,
        pendingSubmissions: Array.isArray(parsed.pendingSubmissions) ? parsed.pendingSubmissions : INITIAL_PENDING_SUBMISSIONS,
        feedbackQueue: Array.isArray(parsed.feedbackQueue) ? parsed.feedbackQueue : INITIAL_FEEDBACK_QUEUE,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : INITIAL_BOOKINGS,
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : INITIAL_OPPORTUNITIES,
        revenue: parsed.revenue ? { ...INITIAL_REVENUE_DATA, ...parsed.revenue } : INITIAL_REVENUE_DATA,
        settings: parsed.settings ? { ...INITIAL_ADMIN_SETTINGS, ...parsed.settings } : INITIAL_ADMIN_SETTINGS,
        branding: parsed.branding ? {
          splashLogo: parsed.branding.splashLogo ?? null,
          homepageLogo: parsed.branding.homepageLogo ?? null,
          favicon: parsed.branding.favicon ?? null,
          homepageBackground: parsed.branding.homepageBackground ?? null,
          heroBackground: parsed.branding.heroBackground ?? null,
          heroVideoUrl: parsed.branding.heroVideoUrl ?? null,
          seasonal: parsed.branding.seasonal ? { ...defaultSeasonal, ...parsed.branding.seasonal } : defaultSeasonal
        } : {
          splashLogo: null,
          homepageLogo: null,
          favicon: null,
          homepageBackground: null,
          heroBackground: null,
          heroVideoUrl: null,
          seasonal: defaultSeasonal
        },
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : INITIAL_AUDIT_LOGS,
        adminNotifications: Array.isArray(parsed.adminNotifications) ? parsed.adminNotifications : (db.adminNotifications || []),
        analyticsEvents: Array.isArray(parsed.analyticsEvents) ? parsed.analyticsEvents : [],
        sessions: parsed.sessions || {},
        adminSessions: parsed.adminSessions || {},
        admins: rawAdmins,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        userVerifications: parsed.userVerifications || {},
        userSessions: parsed.userSessions || {},
        uploadedImages: parsed.uploadedImages || {},
        deletedPlaceIds,
        deletedEventIds,
        deletedAdIds
      };

      // Ensure all bookings have crypto-secure tokens
      if (Array.isArray(db.bookings)) {
        db.bookings.forEach((b: any) => {
          if (!b.publicToken) {
            b.publicToken = 'bk_tok_' + crypto.randomBytes(12).toString('hex');
          }
          if (!b.accessToken) {
            b.accessToken = 'bk_sec_' + crypto.randomBytes(24).toString('hex');
          }
        });
      }

      try {
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
      } catch {
        // Non-fatal on read-only serverless filesystem
      }

      // 3. Two-way synchronization: Recreate missing files on disk from db.uploadedImages
      if (db.uploadedImages) {
        for (const [filename, info] of Object.entries(db.uploadedImages)) {
          if (!info || !info.base64Data) continue;
          const publicPath = path.join(UPLOADS_DIR, filename);
          if (!fs.existsSync(publicPath)) {
            try {
              fs.writeFileSync(publicPath, Buffer.from(info.base64Data, 'base64'));
              console.log(`[Database] Recreated missing uploaded file on disk: ${filename}`);
            } catch (err) {
              console.warn(`[Database] Failed to recreate file ${filename} on disk:`, err);
            }
          }

          // Also mirror to dist/uploads if dist exists
          const distDir = path.join(process.cwd(), 'dist');
          if (fs.existsSync(distDir)) {
            try {
              if (!fs.existsSync(DIST_UPLOADS_DIR)) {
                fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
              }
              const distPath = path.join(DIST_UPLOADS_DIR, filename);
              if (!fs.existsSync(distPath)) {
                fs.writeFileSync(distPath, Buffer.from(info.base64Data, 'base64'));
              }
            } catch {
              // Non-fatal on read-only serverless
            }
          }
        }
      }

      // 4. Two-way synchronization: Ingest any existing files in public/uploads into db.uploadedImages
      try {
        if (fs.existsSync(UPLOADS_DIR)) {
          const diskFiles = fs.readdirSync(UPLOADS_DIR);
          for (const file of diskFiles) {
            if (!db.uploadedImages[file]) {
              const fullFilePath = path.join(UPLOADS_DIR, file);
              const stat = fs.statSync(fullFilePath);
              if (stat.isFile() && stat.size > 0 && stat.size < 50 * 1024 * 1024) {
                const buf = fs.readFileSync(fullFilePath);
                db.uploadedImages[file] = {
                  mimeType: getMimeTypeFromFilename(file),
                  base64Data: buf.toString('base64')
                };
                console.log(`[Database] Ingested disk upload into database backup: ${file}`);
              }
            }
          }
        }
      } catch (scanErr) {
        console.warn('[Database] Uploads folder scan warning:', scanErr);
      }

      // 5. Automatic Data URL Repair: If any place still has a data: URL, convert it to permanent file storage
      let hadRepairs = false;
      for (const p of db.places) {
        if (p.image && p.image.startsWith('data:')) {
          const perm = persistDataUriImage(p.image, `biz_${p.id}`);
          if (perm) {
            p.image = perm;
            hadRepairs = true;
          }
        }
        if (p.logo && p.logo.startsWith('data:')) {
          const perm = persistDataUriImage(p.logo, `logo_${p.id}`);
          if (perm) {
            p.logo = perm;
            hadRepairs = true;
          }
        }
        if (Array.isArray(p.gallery)) {
          p.gallery = p.gallery.map((gItem, idx) => {
            if (gItem && gItem.startsWith('data:')) {
              const perm = persistDataUriImage(gItem, `biz_gal_${p.id}_${idx}`);
              if (perm) {
                hadRepairs = true;
                return perm;
              }
            }
            return gItem;
          });
        }
      }

      saveDatabase(hadRepairs);
      console.log('[Database] Loaded and synchronized persistent state from shendam_db.json');
    } else {
      saveDatabase(true);
      console.log('[Database] Initialized default database and created shendam_db.json');
    }
  } catch (err) {
    console.warn('[Database] Failed to load disk DB, using memory defaults:', err);
  }
}

// Debounced or Immediate Disk Save with ATOMIC WRITE and AUTOMATIC BACKUP
let saveTimeout: NodeJS.Timeout | null = null;
export function saveDatabase(immediate = false) {
  const doWrite = () => {
    try {
      // Keep analytics events capped to last 5000 to prevent unbounded disk growth
      if (db.analyticsEvents && db.analyticsEvents.length > 5000) {
        db.analyticsEvents = db.analyticsEvents.slice(-5000);
      }

      const jsonStr = JSON.stringify(db, null, 2);
      const tempPath = `${DB_FILE_PATH}.tmp`;

      // 1. Write atomically to temporary file
      fs.writeFileSync(tempPath, jsonStr, 'utf-8');

      // 2. Atomically rename temporary file over target file
      fs.renameSync(tempPath, DB_FILE_PATH);

      // 3. Periodically or on immediate write, update safe backup
      try {
        fs.writeFileSync(DB_BACKUP_PATH, jsonStr, 'utf-8');
      } catch (bakErr) {
        // Non-fatal
      }
    } catch (e) {
      console.error('[Database] Error saving to disk atomically:', e);
    }
  };

  if (immediate) {
    if (saveTimeout) clearTimeout(saveTimeout);
    doWrite();
  } else {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(doWrite, 300);
  }
}

export function getDb(): DatabaseSchema {
  return db;
}

// Helper methods
export function addAuditLog(action: string, resource: string, details: string, adminEmail: string, resourceId?: string) {
  const log: AuditLogRecord = {
    id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    action,
    resource,
    resourceId,
    details,
    adminEmail,
    timestamp: Date.now(),
    dateStr: new Date().toLocaleString()
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);
  saveDatabase();
  return log;
}

export function addAdminNotification(type: AdminNotification['type'], title: string, message: string, linkSection?: AdminNotification['linkSection']) {
  const notif: AdminNotification = {
    id: `anotif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    type,
    title,
    message,
    timestamp: Date.now(),
    read: false,
    linkSection
  };
  db.adminNotifications.unshift(notif);
  if (db.adminNotifications.length > 100) db.adminNotifications = db.adminNotifications.slice(0, 100);
  saveDatabase();
  return notif;
}

// ============================================================================
// ADMIN MANAGEMENT HELPERS (RBAC)
// ============================================================================

export function getAdmins(): AdminUser[] {
  if (!db.admins || db.admins.length === 0) {
    db.admins = [INITIAL_SUPER_ADMIN];
  }
  return db.admins;
}

export function findAdminById(id: string): AdminUser | undefined {
  return getAdmins().find((a) => a.id === id);
}

export function findAdminByEmail(email: string): AdminUser | undefined {
  const normalized = email.trim().toLowerCase();
  const direct = getAdmins().find((a) => a.email.toLowerCase() === normalized);
  if (direct) return direct;

  // Also recognize admin aliases for the super admin
  if (
    normalized === 'admin@shendamconnect.gov.ng' ||
    normalized === 'admin@shendamconnect.com' ||
    normalized === 'admin@shendam.gov.ng' ||
    normalized === 'admin'
  ) {
    return getAdmins().find((a) => a.email.toLowerCase() === 'domnanraymond9@gmail.com');
  }
  return undefined;
}

export function findAdminByInvitationToken(token: string): AdminUser | undefined {
  if (!token || typeof token !== 'string') return undefined;
  const clean = token.trim();
  const hashed = crypto.createHash('sha256').update(clean).digest('hex');
  return getAdmins().find((a) => a.invitationToken === hashed || a.invitationToken === clean);
}

export function createAdminUser(data: {
  email: string;
  name: string;
  role: AdminRole;
  title: string;
  passwordHash?: string;
  status?: 'invited' | 'active' | 'disabled';
  createdBy?: string;
  invitationToken?: string;
  invitationSentAt?: string;
  invitationExpiresAt?: string;
}): AdminUser {
  const now = new Date().toISOString();
  const newAdmin: AdminUser = {
    id: `admin-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    email: data.email.trim().toLowerCase(),
    name: data.name.trim(),
    role: data.role,
    title: data.title.trim() || 'Shendam Connect Staff Admin',
    status: data.status || 'invited',
    passwordHash: data.passwordHash || '',
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy || 'SUPER_ADMIN',
    invitationToken: data.invitationToken,
    invitationSentAt: data.invitationSentAt,
    invitationExpiresAt: data.invitationExpiresAt
  };

  if (!db.admins) db.admins = [];
  db.admins.push(newAdmin);
  saveDatabase(true);

  addAuditLog(
    'ADMIN_CREATED',
    'Admin Management',
    `Created new administrator "${newAdmin.name}" (${newAdmin.email}) with role ${newAdmin.role} (Status: ${newAdmin.status})`,
    data.createdBy || 'SUPER_ADMIN',
    newAdmin.id
  );

  return newAdmin;
}

export function updateAdminUser(
  id: string,
  updates: Partial<Pick<AdminUser, 'name' | 'role' | 'title' | 'status' | 'passwordHash' | 'invitationToken' | 'invitationSentAt' | 'invitationExpiresAt' | 'acceptedAt'>>,
  modifiedBy?: string
): AdminUser | null {
  const admins = getAdmins();
  const index = admins.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const current = admins[index];
  const now = new Date().toISOString();

  // Protect against demoting or disabling the last active SUPER_ADMIN
  if (current.role === 'SUPER_ADMIN') {
    const isDemotion = updates.role && updates.role !== 'SUPER_ADMIN';
    const isDisabled = updates.status && updates.status === 'disabled';

    if (isDemotion || isDisabled) {
      if (current.email.toLowerCase() === INITIAL_SUPER_ADMIN.email.toLowerCase()) {
        if (isDemotion) throw new Error('The primary platform super administrator cannot be demoted.');
        if (isDisabled) throw new Error('The primary platform super administrator cannot be disabled.');
      }

      const activeSuperAdminsExcludingTarget = admins.filter(
        (a) => a.role === 'SUPER_ADMIN' && a.id !== id && a.status === 'active'
      ).length;

      if (activeSuperAdminsExcludingTarget === 0) {
        if (isDemotion) throw new Error('Cannot demote the last remaining active Super Admin.');
        if (isDisabled) throw new Error('Cannot disable the last remaining active Super Admin.');
      }
    }
  }

  const updated: AdminUser = {
    ...current,
    ...updates,
    updatedAt: now
  };

  admins[index] = updated;
  saveDatabase(true);

  const changedFields: string[] = [];
  if (updates.name && updates.name !== current.name) changedFields.push(`name: ${updates.name}`);
  if (updates.role && updates.role !== current.role) changedFields.push(`role: ${current.role} -> ${updates.role}`);
  if (updates.title && updates.title !== current.title) changedFields.push(`title: ${updates.title}`);
  if (updates.status && updates.status !== current.status) changedFields.push(`status: ${updates.status}`);
  if (updates.passwordHash) changedFields.push('password reset');

  addAuditLog(
    'ADMIN_UPDATED',
    'Admin Management',
    `Updated admin "${updated.name}" (${updated.email}): ${changedFields.join(', ') || 'details updated'}`,
    modifiedBy || 'SUPER_ADMIN',
    updated.id
  );

  return updated;
}

export function deleteAdminUser(id: string, deletedBy?: string): boolean {
  const admins = getAdmins();
  const target = admins.find((a) => a.id === id);
  if (!target) return false;

  if (target.email.toLowerCase() === INITIAL_SUPER_ADMIN.email.toLowerCase()) {
    throw new Error('The primary platform super administrator account cannot be deleted.');
  }

  const superAdminCount = admins.filter((a) => a.role === 'SUPER_ADMIN' && a.id !== id && a.status === 'active').length;
  if (target.role === 'SUPER_ADMIN' && superAdminCount === 0) {
    throw new Error('Cannot delete the last remaining active Super Admin.');
  }

  db.admins = admins.filter((a) => a.id !== id);
  saveDatabase(true);

  addAuditLog(
    'ADMIN_DELETED',
    'Admin Management',
    `Permanently removed administrator "${target.name}" (${target.email}, role: ${target.role})`,
    deletedBy || 'SUPER_ADMIN',
    id
  );

  return true;
}

export function setAdminStatus(id: string, status: 'active' | 'disabled', modifiedBy?: string): AdminUser | null {
  return updateAdminUser(id, { status }, modifiedBy);
}

/**
 * Checks whether an image URL / filename is referenced anywhere else in the database.
 * Used to enforce referential integrity before deleting physical storage objects.
 */
export function isImageReferencedElsewhere(
  imageUrl: string,
  excludePlaceId?: string,
  excludeEventId?: string,
  excludeAdId?: string
): boolean {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  const filename = path.basename(imageUrl.split('?')[0]);
  if (!filename) return false;

  // 1. Check all places (except excludePlaceId)
  for (const place of db.places) {
    if (excludePlaceId && place.id === excludePlaceId) continue;
    if (place.image && path.basename(place.image.split('?')[0]) === filename) return true;
    if (place.logo && path.basename(place.logo.split('?')[0]) === filename) return true;
    if (Array.isArray(place.gallery)) {
      for (const g of place.gallery) {
        if (g && path.basename(g.split('?')[0]) === filename) return true;
      }
    }
  }

  // 2. Check events (except excludeEventId)
  for (const event of db.events) {
    if (excludeEventId && event.id === excludeEventId) continue;
    if (event.image && path.basename(event.image.split('?')[0]) === filename) return true;
  }

  // 3. Check heroSlides
  for (const slide of db.heroSlides) {
    if (slide.image && path.basename(slide.image.split('?')[0]) === filename) return true;
  }

  // 4. Check branding
  if (db.branding) {
    if (db.branding.splashLogo && path.basename(db.branding.splashLogo.split('?')[0]) === filename) return true;
    if (db.branding.homepageLogo && path.basename(db.branding.homepageLogo.split('?')[0]) === filename) return true;
  }

  // 5. Check pending submissions
  for (const sub of db.pendingSubmissions) {
    if (sub.imageUrl && path.basename(sub.imageUrl.split('?')[0]) === filename) return true;
  }

  // 6. Check advertisements (except excludeAdId)
  if (Array.isArray(db.advertisements)) {
    for (const ad of db.advertisements) {
      if (excludeAdId && ad.id === excludeAdId) continue;
      if (ad.imageUrl && path.basename(ad.imageUrl.split('?')[0]) === filename) return true;
      if (ad.bannerImageUrl && path.basename(ad.bannerImageUrl.split('?')[0]) === filename) return true;
    }
  }

  // 7. Check LGA profile image in settings
  if (db.settings?.lgaProfileImage && path.basename(db.settings.lgaProfileImage.split('?')[0]) === filename) {
    return true;
  }

  return false;
}

/**
 * Removes an image file from storage if and only if no other entity references it.
 * Deletes from public/uploads, dist/uploads, and db.uploadedImages.
 */
export function deleteImageFileIfUnreferenced(
  imageUrl: string,
  options?: { excludePlaceId?: string; excludeEventId?: string; excludeAdId?: string }
): { deleted: boolean; filename: string; reason?: string } {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { deleted: false, filename: '', reason: 'Empty or invalid URL' };
  }

  // Only delete managed local upload assets
  if (!imageUrl.includes('/uploads/')) {
    return { deleted: false, filename: imageUrl, reason: 'External or non-upload URL, skipped file removal' };
  }

  const filename = path.basename(imageUrl.split('?')[0]);
  if (!filename) {
    return { deleted: false, filename: '', reason: 'Could not extract filename' };
  }

  // Enforce referential integrity
  if (isImageReferencedElsewhere(imageUrl, options?.excludePlaceId, options?.excludeEventId, options?.excludeAdId)) {
    console.log(`[Storage] Retaining image ${filename}: still referenced by another listing or asset.`);
    return { deleted: false, filename, reason: 'Referenced by another listing' };
  }

  let physicallyDeleted = false;

  // 1. Remove from public/uploads
  const publicPath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(publicPath)) {
    try {
      fs.unlinkSync(publicPath);
      physicallyDeleted = true;
      console.log(`[Storage] Deleted file from public/uploads: ${filename}`);
    } catch (err) {
      console.warn(`[Storage] Failed to unlink ${publicPath}:`, err);
    }
  }

  // 2. Remove from dist/uploads
  const distPath = path.join(DIST_UPLOADS_DIR, filename);
  if (fs.existsSync(distPath)) {
    try {
      fs.unlinkSync(distPath);
      physicallyDeleted = true;
      console.log(`[Storage] Deleted file from dist/uploads: ${filename}`);
    } catch (err) {
      console.warn(`[Storage] Failed to unlink ${distPath}:`, err);
    }
  }

  // 3. Remove from database uploadedImages
  if (db.uploadedImages && db.uploadedImages[filename]) {
    delete db.uploadedImages[filename];
    physicallyDeleted = true;
    console.log(`[Storage] Removed ${filename} from database uploadedImages registry`);
  }

  return { deleted: physicallyDeleted, filename };
}

/**
 * Permanently deletes a place listing, marks its ID as deleted tombstone,
 * cleans up all exclusively associated media, and persists to disk immediately.
 */
export function deletePlacePermanently(
  placeId: string,
  adminEmail: string
): { success: boolean; removedPlace: Place; deletedMedia: string[] } {
  const index = db.places.findIndex((p) => p.id === placeId);
  if (index === -1) {
    throw new Error('Listing not found');
  }

  const removed = db.places.splice(index, 1)[0];

  // Track tombstone so hardcoded mock data or cached state cannot reintroduce it
  if (!db.deletedPlaceIds) db.deletedPlaceIds = [];
  if (!db.deletedPlaceIds.includes(placeId)) {
    db.deletedPlaceIds.push(placeId);
  }

  // Collect all media associated with this place
  const mediaToCheck: string[] = [];
  if (removed.image) mediaToCheck.push(removed.image);
  if (removed.logo) mediaToCheck.push(removed.logo);
  if (Array.isArray(removed.gallery)) {
    for (const g of removed.gallery) {
      if (g && !mediaToCheck.includes(g)) mediaToCheck.push(g);
    }
  }

  const deletedMedia: string[] = [];
  for (const mediaUrl of mediaToCheck) {
    const res = deleteImageFileIfUnreferenced(mediaUrl, { excludePlaceId: placeId });
    if (res.deleted) {
      deletedMedia.push(res.filename);
    }
  }

  addAuditLog(
    'PLACE_DELETED',
    `Place: ${removed.name}`,
    `Permanently deleted ${removed.name} (ID: ${placeId}) and purged ${deletedMedia.length} unreferenced media files from persistent storage.`,
    adminEmail,
    placeId
  );

  saveDatabase(true);
  return { success: true, removedPlace: removed, deletedMedia };
}

/**
 * Permanently deletes an individual photo from a place listing.
 * Cleans up physical file if unreferenced, updates the listing, and saves to database.
 */
export function deletePlacePhotoPermanently(
  placeId: string,
  photoUrl: string,
  adminEmail: string
): { success: boolean; updatedPlace: Place; fileDeleted: boolean } {
  const place = db.places.find((p) => p.id === placeId);
  if (!place) {
    throw new Error('Listing not found');
  }

  if (!photoUrl) {
    throw new Error('Photo URL is required');
  }

  // Remove from gallery
  if (Array.isArray(place.gallery)) {
    place.gallery = place.gallery.filter((g) => g !== photoUrl);
  }

  // If this was the main cover image, update to next available gallery photo or empty string
  if (place.image === photoUrl) {
    place.image = place.gallery && place.gallery.length > 0 ? place.gallery[0] : '';
  }

  // Check referential integrity and delete physical file if unreferenced
  const deleteRes = deleteImageFileIfUnreferenced(photoUrl, { excludePlaceId: placeId });

  addAuditLog(
    'PHOTO_DELETED',
    `Place: ${place.name}`,
    `Permanently deleted photo ${path.basename(photoUrl.split('?')[0])} from ${place.name}. Physical file deleted: ${deleteRes.deleted}`,
    adminEmail,
    placeId
  );

  saveDatabase(true);
  return { success: true, updatedPlace: place, fileDeleted: deleteRes.deleted };
}

/**
 * Permanently deletes a customer review from a place listing.
 * Recalculates the place rating and review count, saves immediately to database, and records an audit log.
 */
export function deletePlaceReviewPermanently(
  placeId: string,
  reviewId: string,
  adminEmail: string
): { success: boolean; updatedPlace: Place } {
  const place = db.places.find((p) => p.id === placeId);
  if (!place) {
    throw new Error('Listing not found');
  }

  if (!Array.isArray(place.reviews)) {
    throw new Error('No reviews found for this listing');
  }

  const reviewIndex = place.reviews.findIndex((r) => r.id === reviewId);
  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }

  const removedReview = place.reviews.splice(reviewIndex, 1)[0];
  place.reviewsCount = place.reviews.length;
  if (place.reviews.length > 0) {
    const total = place.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    place.rating = Number((total / place.reviews.length).toFixed(1));
  } else {
    place.rating = 0;
  }

  addAuditLog(
    'REVIEW_DELETED',
    `Place: ${place.name}`,
    `Permanently deleted review by ${removedReview.author} (Rating: ${removedReview.rating}★) from ${place.name}.`,
    adminEmail,
    placeId
  );

  saveDatabase(true);
  return { success: true, updatedPlace: place };
}

/**
 * Permanently deletes an event, marks its ID as deleted tombstone,
 * cleans up any unreferenced image, and persists to disk.
 */
export function deleteEventPermanently(
  eventId: string,
  adminEmail: string
): { success: boolean; removedEvent: ShendamEvent; deletedMedia: string[] } {
  const index = db.events.findIndex((e) => e.id === eventId);
  if (index === -1) {
    throw new Error('Event not found');
  }

  const removed = db.events.splice(index, 1)[0];

  if (!db.deletedEventIds) db.deletedEventIds = [];
  if (!db.deletedEventIds.includes(eventId)) {
    db.deletedEventIds.push(eventId);
  }

  const deletedMedia: string[] = [];
  if (removed.image) {
    const res = deleteImageFileIfUnreferenced(removed.image, { excludeEventId: eventId });
    if (res.deleted) {
      deletedMedia.push(res.filename);
    }
  }

  addAuditLog(
    'EVENT_DELETED',
    `Event: ${removed.title}`,
    `Permanently deleted event "${removed.title}" (ID: ${eventId}).`,
    adminEmail,
    eventId
  );

  saveDatabase(true);
  return { success: true, removedEvent: removed, deletedMedia };
}

// ============================================================================
// ADVERTISEMENTS & SPONSORSHIP CAMPAIGNS HELPERS
// ============================================================================

export function getAdvertisements(): Advertisement[] {
  return db.advertisements || [];
}

export function getPublicAdvertisements(requestedPlacement?: string): Advertisement[] {
  const settings = getAdvertisementSettings();
  if (settings.localAdsEnabled === false) {
    return [];
  }

  const ads = db.advertisements || [];
  const now = new Date();

  return ads
    .filter((ad) => {
      // Must be active status
      if (ad.status !== 'active') return false;

      // If approval is required, must be approved
      if (settings.approvalRequired && ad.approvalStatus && ad.approvalStatus !== 'approved') {
        return false;
      }

      // If ad was linked to a paid package/campaign, require PAID status
      if (ad.paymentStatus && ad.paymentStatus !== 'PAID') {
        return false;
      }

      // Check placement matching
      if (requestedPlacement) {
        const matches =
          ad.placement === requestedPlacement ||
          (requestedPlacement === 'startup_popup' && (ad.placement === 'startup_popup' || ad.placement === 'popup_interstitial')) ||
          (requestedPlacement === 'home' && (ad.placement === 'home' || ad.placement === 'homepage_banner' || ad.placement === 'banner')) ||
          (requestedPlacement === 'discover' && (ad.placement === 'discover' || ad.placement === 'explore_top')) ||
          (requestedPlacement === 'banner' && (ad.placement === 'banner' || ad.placement === 'homepage_banner' || ad.placement === 'home')) ||
          (requestedPlacement === 'homepage_banner' && (ad.placement === 'homepage_banner' || ad.placement === 'home' || ad.placement === 'banner'));

        if (!matches) return false;
      }

      // Check start date validity
      if (ad.startDate) {
        const start = new Date(ad.startDate);
        if (!isNaN(start.getTime()) && start > now) return false;
      }

      // Check end date validity
      if (ad.endDate) {
        const end = new Date(ad.endDate);
        if (!isNaN(end.getTime()) && end < now) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by priority descending (highest first), then by creation date
      const pA = typeof a.priority === 'number' ? a.priority : 0;
      const pB = typeof b.priority === 'number' ? b.priority : 0;
      if (pB !== pA) return pB - pA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function createAdvertisement(
  adData: Partial<Advertisement>,
  adminEmail: string
): Advertisement {
  const settings = getAdvertisementSettings();
  const initialApproval: AdvertisementApprovalStatus =
    adData.approvalStatus || (settings.approvalRequired ? 'pending_approval' : 'approved');

  const newAd: Advertisement = {
    id: adData.id || `ad-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    title: (adData.title || 'Special Promotion').trim(),
    businessName: (adData.businessName || 'Shendam Merchant').trim(),
    description: (adData.description || '').trim(),
    imageUrl: adData.imageUrl || '',
    bannerImageUrl: adData.bannerImageUrl || undefined,
    linkUrl: adData.linkUrl || 'https://wa.me/2348000000000',
    destinationType: adData.destinationType || 'whatsapp',
    destinationUrl: adData.destinationUrl || adData.linkUrl || '',
    destinationWhatsApp: adData.destinationWhatsApp,
    destinationPhone: adData.destinationPhone,
    destinationListingId: adData.destinationListingId || adData.linkedPlaceId,
    linkedPlaceId: adData.linkedPlaceId,
    placement: adData.placement || 'homepage_banner',
    priority: typeof adData.priority === 'number' ? adData.priority : 5,
    startDate: adData.startDate,
    endDate: adData.endDate,
    status: adData.status || (initialApproval === 'approved' ? 'active' : 'pending_approval'),
    approvalStatus: initialApproval,
    packageId: adData.packageId,
    paymentId: adData.paymentId,
    paymentStatus: adData.paymentStatus || 'PAID',
    clicksCount: 0,
    viewsCount: 0,
    createdAt: new Date().toISOString()
  };

  if (!db.advertisements) db.advertisements = [];
  db.advertisements.unshift(newAd);

  addAuditLog(
    'AD_CREATED',
    `Ad: ${newAd.title}`,
    `Created advertisement campaign for "${newAd.businessName}" (${newAd.placement}, priority: ${newAd.priority}).`,
    adminEmail,
    newAd.id
  );

  saveDatabase(true);
  return newAd;
}

export function updateAdvertisement(
  id: string,
  updates: Partial<Advertisement>,
  adminEmail: string
): Advertisement {
  if (!db.advertisements) db.advertisements = [];
  const index = db.advertisements.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('Advertisement not found');
  }

  const existing = db.advertisements[index];

  // If replacing image, clean up old image if unreferenced
  if (updates.imageUrl && updates.imageUrl !== existing.imageUrl && existing.imageUrl) {
    deleteImageFileIfUnreferenced(existing.imageUrl, { excludeAdId: id });
  }
  if (updates.bannerImageUrl && updates.bannerImageUrl !== existing.bannerImageUrl && existing.bannerImageUrl) {
    deleteImageFileIfUnreferenced(existing.bannerImageUrl, { excludeAdId: id });
  }

  const updated: Advertisement = {
    ...existing,
    ...updates,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  db.advertisements[index] = updated;

  addAuditLog(
    'AD_UPDATED',
    `Ad: ${updated.title}`,
    `Updated advertisement "${updated.title}" for ${updated.businessName} (status: ${updated.status}).`,
    adminEmail,
    updated.id
  );

  saveDatabase(true);
  return updated;
}

export function setAdvertisementApproval(
  id: string,
  approvalStatus: AdvertisementApprovalStatus,
  adminEmail: string,
  notes?: string
): Advertisement {
  if (!db.advertisements) db.advertisements = [];
  const index = db.advertisements.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('Advertisement not found');
  }

  const existing = db.advertisements[index];
  const newStatus: AdvertisementStatus =
    approvalStatus === 'approved' ? 'active' : approvalStatus === 'rejected' ? 'rejected' : 'pending_approval';

  const updated: Advertisement = {
    ...existing,
    approvalStatus,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };

  db.advertisements[index] = updated;

  addAuditLog(
    'AD_APPROVAL_CHANGED',
    `Ad: ${updated.title}`,
    `Advertisement approval changed to "${approvalStatus}" by ${adminEmail}.${notes ? ` Notes: ${notes}` : ''}`,
    adminEmail,
    updated.id
  );

  saveDatabase(true);
  return updated;
}

export function deleteAdvertisementPermanently(
  id: string,
  adminEmail: string
): { success: boolean; deletedAd: Advertisement; deletedMedia: string[] } {
  if (!db.advertisements) db.advertisements = [];
  const index = db.advertisements.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('Advertisement not found');
  }

  const removed = db.advertisements.splice(index, 1)[0];
  if (!db.deletedAdIds) db.deletedAdIds = [];
  if (!db.deletedAdIds.includes(id)) {
    db.deletedAdIds.push(id);
  }

  // Check referential integrity and safely purge unreferenced upload media
  const deletedMedia: string[] = [];
  const mediaToCheck: string[] = [];
  if (removed.imageUrl) mediaToCheck.push(removed.imageUrl);
  if (removed.bannerImageUrl) mediaToCheck.push(removed.bannerImageUrl);

  for (const mediaUrl of mediaToCheck) {
    const res = deleteImageFileIfUnreferenced(mediaUrl, { excludeAdId: id });
    if (res.deleted) {
      deletedMedia.push(res.filename);
    }
  }

  addAuditLog(
    'AD_DELETED',
    `Ad: ${removed.title}`,
    `Permanently deleted advertisement "${removed.title}" (ID: ${id}) and purged ${deletedMedia.length} unreferenced media files.`,
    adminEmail,
    id
  );

  saveDatabase(true);
  return { success: true, deletedAd: removed, deletedMedia };
}

export function recordAdvertisementClick(id: string) {
  if (!db.advertisements) return;
  const ad = db.advertisements.find((a) => a.id === id);
  if (ad) {
    ad.clicksCount = (ad.clicksCount || 0) + 1;
    saveDatabase(false);
  }
}

export function recordAdvertisementView(id: string) {
  if (!db.advertisements) return;
  const ad = db.advertisements.find((a) => a.id === id);
  if (ad) {
    ad.viewsCount = (ad.viewsCount || 0) + 1;
    saveDatabase(false);
  }
}

// ============================================================================
// ADVERTISEMENT PACKAGES HELPERS
// ============================================================================

export function getAdvertisementPackages(): AdvertisementPackage[] {
  if (!db.advertisementPackages || db.advertisementPackages.length === 0) {
    db.advertisementPackages = [...INITIAL_ADVERTISEMENT_PACKAGES];
    saveDatabase(true);
  }
  return db.advertisementPackages;
}

export function createAdvertisementPackage(
  pkgData: Partial<AdvertisementPackage>,
  adminEmail: string
): AdvertisementPackage {
  if (!db.advertisementPackages) db.advertisementPackages = [];

  const newPkg: AdvertisementPackage = {
    id: pkgData.id || `pkg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: (pkgData.name || 'Custom Package').trim(),
    description: (pkgData.description || '').trim(),
    durationDays: typeof pkgData.durationDays === 'number' && pkgData.durationDays > 0 ? pkgData.durationDays : 30,
    price: typeof pkgData.price === 'number' && pkgData.price >= 0 ? pkgData.price : 25000,
    placements: Array.isArray(pkgData.placements) && pkgData.placements.length > 0 ? pkgData.placements : ['home'],
    features: Array.isArray(pkgData.features) ? pkgData.features : [],
    active: pkgData.active !== false,
    createdAt: new Date().toISOString()
  };

  db.advertisementPackages.push(newPkg);

  addAuditLog(
    'AD_PACKAGE_CREATED',
    `Package: ${newPkg.name}`,
    `Created advertisement package "${newPkg.name}" (₦${newPkg.price.toLocaleString()}, ${newPkg.durationDays} days).`,
    adminEmail,
    newPkg.id
  );

  saveDatabase(true);
  return newPkg;
}

export function updateAdvertisementPackage(
  id: string,
  updates: Partial<AdvertisementPackage>,
  adminEmail: string
): AdvertisementPackage {
  if (!db.advertisementPackages) db.advertisementPackages = [];
  const index = db.advertisementPackages.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error('Advertisement package not found');
  }

  const existing = db.advertisementPackages[index];
  const updated: AdvertisementPackage = {
    ...existing,
    ...updates,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  db.advertisementPackages[index] = updated;

  addAuditLog(
    'AD_PACKAGE_UPDATED',
    `Package: ${updated.name}`,
    `Updated advertisement package "${updated.name}" (₦${updated.price.toLocaleString()}, active: ${updated.active}).`,
    adminEmail,
    updated.id
  );

  saveDatabase(true);
  return updated;
}

export function deleteAdvertisementPackage(id: string, adminEmail: string): boolean {
  if (!db.advertisementPackages) return false;
  const index = db.advertisementPackages.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error('Advertisement package not found');
  }

  const removed = db.advertisementPackages.splice(index, 1)[0];

  addAuditLog(
    'AD_PACKAGE_DELETED',
    `Package: ${removed.name}`,
    `Deleted advertisement package "${removed.name}" (ID: ${id}).`,
    adminEmail,
    id
  );

  saveDatabase(true);
  return true;
}

// ============================================================================
// ADVERTISEMENT PAYMENTS HELPERS
// ============================================================================

export function getAdvertisementPayments(): AdvertisementPayment[] {
  return db.advertisementPayments || [];
}

export function createAdvertisementPayment(paymentData: Partial<AdvertisementPayment>): AdvertisementPayment {
  if (!db.advertisementPayments) db.advertisementPayments = [];

  const newPayment: AdvertisementPayment = {
    id: paymentData.id || `pay-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    advertisementId: paymentData.advertisementId || '',
    packageId: paymentData.packageId,
    amount: typeof paymentData.amount === 'number' ? paymentData.amount : 0,
    currency: 'NGN',
    paymentStatus: paymentData.paymentStatus || 'PENDING',
    paymentReference: paymentData.paymentReference || `SHD-AD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    advertiserName: paymentData.advertiserName || 'Shendam Merchant',
    advertiserEmail: paymentData.advertiserEmail,
    advertiserPhone: paymentData.advertiserPhone,
    paymentProvider: paymentData.paymentProvider || 'paystack',
    transactionData: paymentData.transactionData,
    createdAt: new Date().toISOString()
  };

  db.advertisementPayments.unshift(newPayment);
  saveDatabase(true);
  return newPayment;
}

export function verifyAdvertisementPayment(
  paymentReference: string,
  verificationResult: {
    status: string; // 'success' | 'failed'
    amount: number;
    transactionData?: any;
  },
  adminEmail?: string
): { success: boolean; payment: AdvertisementPayment; activatedAd?: Advertisement } {
  if (!db.advertisementPayments) db.advertisementPayments = [];

  const paymentIndex = db.advertisementPayments.findIndex((p) => p.paymentReference === paymentReference);
  if (paymentIndex === -1) {
    throw new Error(`Payment with reference ${paymentReference} not found.`);
  }

  const payment = db.advertisementPayments[paymentIndex];
  const isSuccess = verificationResult.status === 'success';
  const now = new Date().toISOString();

  payment.paymentStatus = isSuccess ? 'PAID' : 'FAILED';
  payment.transactionData = verificationResult.transactionData || payment.transactionData;
  if (isSuccess) {
    payment.paidAt = now;
  }
  payment.updatedAt = now;

  let activatedAd: Advertisement | undefined;

  // If verified successfully, activate the advertisement
  if (isSuccess && payment.advertisementId && db.advertisements) {
    const adIndex = db.advertisements.findIndex((a) => a.id === payment.advertisementId);
    if (adIndex !== -1) {
      const ad = db.advertisements[adIndex];
      ad.paymentStatus = 'PAID';
      ad.paymentId = payment.id;

      // Check start date: if in future, status is 'scheduled', else 'active'
      const start = ad.startDate ? new Date(ad.startDate) : null;
      if (start && start > new Date()) {
        ad.status = 'scheduled';
      } else {
        ad.status = 'active';
      }
      ad.approvalStatus = 'approved';
      ad.updatedAt = now;
      activatedAd = ad;
    }
  }

  addAuditLog(
    isSuccess ? 'AD_PAYMENT_VERIFIED' : 'AD_PAYMENT_FAILED',
    `Ref: ${paymentReference}`,
    `Advertisement payment ${isSuccess ? 'VERIFIED' : 'FAILED'} (₦${payment.amount.toLocaleString()} for ${payment.advertiserName}). Status: ${payment.paymentStatus}.`,
    adminEmail || 'SYSTEM_WEBHOOK',
    payment.id
  );

  saveDatabase(true);
  return { success: isSuccess, payment, activatedAd };
}

export function reconcileAdvertisementPaymentManually(
  paymentId: string,
  adminEmail: string,
  notes?: string
): { success: boolean; payment: AdvertisementPayment; activatedAd?: Advertisement } {
  if (!db.advertisementPayments) db.advertisementPayments = [];
  const payment = db.advertisementPayments.find((p) => p.id === paymentId);
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  return verifyAdvertisementPayment(
    payment.paymentReference,
    {
      status: 'success',
      amount: payment.amount,
      transactionData: { reconciledBy: adminEmail, notes: notes || 'Manual Super Admin reconciliation' }
    },
    adminEmail
  );
}

// ============================================================================
// ADVERTISEMENT SETTINGS HELPERS
// ============================================================================

export function getAdvertisementSettings(): AdvertisementSettings {
  if (!db.advertisementSettings) {
    db.advertisementSettings = { ...INITIAL_ADVERTISEMENT_SETTINGS };
    saveDatabase(true);
  }
  return db.advertisementSettings;
}

export function updateAdvertisementSettings(
  updates: Partial<AdvertisementSettings>,
  adminEmail: string
): AdvertisementSettings {
  const current = getAdvertisementSettings();
  const updated: AdvertisementSettings = {
    ...current,
    ...updates,
    googleAds: {
      ...current.googleAds,
      ...(updates.googleAds || {}),
      placements: {
        ...current.googleAds.placements,
        ...((updates.googleAds && updates.googleAds.placements) || {})
      }
    }
  };

  db.advertisementSettings = updated;

  addAuditLog(
    'AD_SETTINGS_UPDATED',
    'Advertising Settings',
    `Updated advertising configuration (Local Ads: ${updated.localAdsEnabled}, Startup: ${updated.startupAdsEnabled}, Google Ads: ${updated.googleAds.enabled}).`,
    adminEmail
  );

  saveDatabase(true);
  return updated;
}

// ============================================================================
// ADVERTISEMENT ANALYTICS HELPERS
// ============================================================================

export function getAdvertisementAnalytics(dateRange: string = '30d'): {
  totalAds: number;
  activeAds: number;
  scheduledAds: number;
  expiredAds: number;
  pausedAds: number;
  pendingApprovalAds: number;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  totalRevenue: number;
  paidCampaignsCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  byPlacement: Record<string, { count: number; impressions: number; clicks: number; ctr: number }>;
  byAdvertiser: Array<{ businessName: string; count: number; impressions: number; clicks: number; ctr: number }>;
  recentPayments: AdvertisementPayment[];
} {
  const ads = db.advertisements || [];
  const payments = db.advertisementPayments || [];
  const now = new Date();

  let activeAds = 0;
  let scheduledAds = 0;
  let expiredAds = 0;
  let pausedAds = 0;
  let pendingApprovalAds = 0;
  let totalImpressions = 0;
  let totalClicks = 0;

  const placementMap: Record<string, { count: number; impressions: number; clicks: number }> = {};
  const advertiserMap: Record<string, { count: number; impressions: number; clicks: number }> = {};

  for (const ad of ads) {
    const views = ad.viewsCount || 0;
    const clicks = ad.clicksCount || 0;

    totalImpressions += views;
    totalClicks += clicks;

    // Status classification
    const isExpired = ad.status === 'expired' || (ad.endDate && new Date(ad.endDate) < now);
    const isScheduled = ad.status === 'scheduled' || (ad.startDate && new Date(ad.startDate) > now);

    if (ad.status === 'pending_approval' || ad.approvalStatus === 'pending_approval') {
      pendingApprovalAds++;
    } else if (isExpired) {
      expiredAds++;
    } else if (isScheduled) {
      scheduledAds++;
    } else if (ad.status === 'active') {
      activeAds++;
    } else {
      pausedAds++;
    }

    // By placement
    const p = ad.placement || 'other';
    if (!placementMap[p]) {
      placementMap[p] = { count: 0, impressions: 0, clicks: 0 };
    }
    placementMap[p].count++;
    placementMap[p].impressions += views;
    placementMap[p].clicks += clicks;

    // By advertiser
    const bName = ad.businessName || 'Other';
    if (!advertiserMap[bName]) {
      advertiserMap[bName] = { count: 0, impressions: 0, clicks: 0 };
    }
    advertiserMap[bName].count++;
    advertiserMap[bName].impressions += views;
    advertiserMap[bName].clicks += clicks;
  }

  // Calculate CTR
  const ctr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

  // Payments & Revenue
  let totalRevenue = 0;
  let paidCampaignsCount = 0;
  let pendingPaymentsCount = 0;
  let failedPaymentsCount = 0;

  for (const pay of payments) {
    if (pay.paymentStatus === 'PAID') {
      totalRevenue += pay.amount || 0;
      paidCampaignsCount++;
    } else if (pay.paymentStatus === 'PENDING') {
      pendingPaymentsCount++;
    } else if (pay.paymentStatus === 'FAILED') {
      failedPaymentsCount++;
    }
  }

  // Format placement report
  const byPlacement: Record<string, { count: number; impressions: number; clicks: number; ctr: number }> = {};
  for (const [key, val] of Object.entries(placementMap)) {
    byPlacement[key] = {
      ...val,
      ctr: val.impressions > 0 ? Number(((val.clicks / val.impressions) * 100).toFixed(2)) : 0
    };
  }

  // Format advertiser report
  const byAdvertiser = Object.entries(advertiserMap)
    .map(([businessName, val]) => ({
      businessName,
      count: val.count,
      impressions: val.impressions,
      clicks: val.clicks,
      ctr: val.impressions > 0 ? Number(((val.clicks / val.impressions) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.impressions - a.impressions);

  return {
    totalAds: ads.length,
    activeAds,
    scheduledAds,
    expiredAds,
    pausedAds,
    pendingApprovalAds,
    totalImpressions,
    totalClicks,
    ctr,
    totalRevenue,
    paidCampaignsCount,
    pendingPaymentsCount,
    failedPaymentsCount,
    byPlacement,
    byAdvertiser,
    recentPayments: payments.slice(0, 15)
  };
}

// ============================================================================
// HERO SLIDES & HOMEPAGE BANNERS HELPERS
// ============================================================================

export function getHeroSlides(): HeroSlide[] {
  return db.heroSlides || [];
}

export function createHeroSlide(
  slideData: Partial<HeroSlide>,
  adminEmail: string
): HeroSlide {
  const newSlide: HeroSlide = {
    id: slideData.id || `hero-${Date.now()}`,
    tagline: (slideData.tagline || 'Explore').trim(),
    title: (slideData.title || 'SHENDAM CONNECT').trim(),
    description: (slideData.description || '').trim(),
    image: slideData.image || '',
    categoryTarget: slideData.categoryTarget
  };

  if (!db.heroSlides) db.heroSlides = [];
  db.heroSlides.push(newSlide);

  addAuditLog(
    'HERO_SLIDE_CREATED',
    `Hero: ${newSlide.title}`,
    `Added new hero slide "${newSlide.title}" with tagline "${newSlide.tagline}".`,
    adminEmail,
    newSlide.id
  );

  saveDatabase(true);
  return newSlide;
}

export function updateHeroSlide(
  id: string,
  updates: Partial<HeroSlide>,
  adminEmail: string
): HeroSlide {
  if (!db.heroSlides) db.heroSlides = [];
  const index = db.heroSlides.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error('Hero slide not found');
  }

  const existing = db.heroSlides[index];
  const updated: HeroSlide = {
    ...existing,
    ...updates,
    id: existing.id
  };

  db.heroSlides[index] = updated;

  addAuditLog(
    'HERO_SLIDE_UPDATED',
    `Hero: ${updated.title}`,
    `Updated hero slide "${updated.title}".`,
    adminEmail,
    updated.id
  );

  saveDatabase(true);
  return updated;
}

export function deleteHeroSlidePermanently(
  id: string,
  adminEmail: string
): { success: boolean; deletedSlide: HeroSlide } {
  if (!db.heroSlides) db.heroSlides = [];
  const index = db.heroSlides.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error('Hero slide not found');
  }

  const removed = db.heroSlides.splice(index, 1)[0];

  addAuditLog(
    'HERO_SLIDE_DELETED',
    `Hero: ${removed.title}`,
    `Deleted hero slide "${removed.title}".`,
    adminEmail,
    id
  );

  saveDatabase(true);
  return { success: true, deletedSlide: removed };
}

// ============================================================================
// BRANDING & SEASONAL THEMES HELPERS
// ============================================================================

export function getBrandingConfig(): BrandingConfig {
  const defaultSeasonal: SeasonalConfig = {
    activeTheme: 'none',
    customTitle: '',
    customGreeting: '',
    customBannerUrl: null,
    accentColor: '#FFC928',
    showCelebrationBadge: false
  };

  if (!db.branding) {
    db.branding = {
      splashLogo: null,
      homepageLogo: null,
      favicon: null,
      homepageBackground: null,
      heroBackground: null,
      heroVideoUrl: null,
      seasonal: defaultSeasonal
    };
  }

  return {
    splashLogo: db.branding.splashLogo ?? null,
    homepageLogo: db.branding.homepageLogo ?? null,
    favicon: db.branding.favicon ?? null,
    homepageBackground: db.branding.homepageBackground ?? null,
    heroBackground: db.branding.heroBackground ?? null,
    heroVideoUrl: db.branding.heroVideoUrl ?? null,
    seasonal: db.branding.seasonal ? { ...defaultSeasonal, ...db.branding.seasonal } : defaultSeasonal
  };
}

export function updateBrandingConfig(
  updates: Partial<BrandingConfig>,
  adminEmail: string
): BrandingConfig {
  const current = getBrandingConfig();
  db.branding = {
    ...current,
    ...updates,
    seasonal: updates.seasonal ? { ...current.seasonal!, ...updates.seasonal } : current.seasonal
  };

  addAuditLog(
    'BRANDING_UPDATED',
    'Application Branding',
    `Updated app branding parameters (Logos, Favicon, Backgrounds, Seasonal Theme: ${db.branding.seasonal?.activeTheme || 'none'}).`,
    adminEmail
  );

  saveDatabase(true);
  return getBrandingConfig();
}

// ============================================================================
// REGISTERED USERS & VERIFICATION PERSISTENCE
// ============================================================================

export function getRegisteredUsers(): RegisteredUser[] {
  if (!db.users) db.users = [];
  return db.users;
}

export function findUserByEmail(email: string): RegisteredUser | undefined {
  if (!email) return undefined;
  const clean = email.trim().toLowerCase();
  return (db.users || []).find((u) => u.email.trim().toLowerCase() === clean);
}

export function findUserById(id: string): RegisteredUser | undefined {
  if (!id) return undefined;
  return (db.users || []).find((u) => u.id === id);
}

export function saveRegisteredUser(user: RegisteredUser): RegisteredUser {
  if (!db.users) db.users = [];
  const index = db.users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) {
    db.users[index] = { ...db.users[index], ...user, updatedAt: new Date().toISOString() };
  } else {
    db.users.push(user);
  }
  saveDatabase(true);
  return user;
}

export function getUserVerification(email: string): UserVerificationRecord | undefined {
  if (!email || !db.userVerifications) return undefined;
  const clean = email.trim().toLowerCase();
  return db.userVerifications[clean];
}

export function saveUserVerification(record: UserVerificationRecord): void {
  if (!db.userVerifications) db.userVerifications = {};
  const clean = record.email.trim().toLowerCase();
  db.userVerifications[clean] = record;
  saveDatabase(true);
}

export function deleteUserVerification(email: string): void {
  if (!email || !db.userVerifications) return;
  const clean = email.trim().toLowerCase();
  delete db.userVerifications[clean];
  saveDatabase(true);
}

export function saveUserAuthSession(session: UserAuthSession): void {
  if (!db.userSessions) db.userSessions = {};
  db.userSessions[session.token] = session;
  saveDatabase(true);
}

export function getUserAuthSession(token: string): UserAuthSession | undefined {
  if (!token || !db.userSessions) return undefined;
  const session = db.userSessions[token];
  if (!session) return undefined;
  if (session.expiresAt && session.expiresAt < Date.now()) {
    delete db.userSessions[token];
    saveDatabase(true);
    return undefined;
  }
  return session;
}

export function deleteUserAuthSession(token: string): void {
  if (!token || !db.userSessions) return;
  delete db.userSessions[token];
  saveDatabase(true);
}



