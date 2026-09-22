import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Normalize typographical error in deployed environment variable (SMP.gmail.com -> smtp.gmail.com)
if (process.env.SMTP_HOST && /^smp\./i.test(process.env.SMTP_HOST.trim())) {
  console.warn(
    `[SMTP Config Warning] Deployed environment variable SMTP_HOST is misconfigured as '${process.env.SMTP_HOST}'. ` +
    `Correcting to 'smtp.gmail.com'. Please update your deployed environment variable to SMTP_HOST=smtp.gmail.com.`
  );
  process.env.SMTP_HOST = process.env.SMTP_HOST.trim().replace(/^smp\./i, 'smtp.');
}

if (!process.env.SMTP_HOST) process.env.SMTP_HOST = 'smtp.gmail.com';
if (!process.env.SMTP_PORT) process.env.SMTP_PORT = '587';
if (!process.env.SMTP_USER) process.env.SMTP_USER = 'domnanraymond9@gmail.com';
if (!process.env.EMAIL_FROM) process.env.EMAIL_FROM = 'domnanraymond9@gmail.com';

import {
  initDatabase,
  getDb,
  saveDatabase,
  addAuditLog,
  addAdminNotification,
  storeImageBuffer,
  persistDataUriImage,
  validateUploadedImageBuffer,
  checkUploadRateLimit,
  MAX_IMAGE_SIZE_BYTES,
  deletePlacePermanently,
  deletePlacePhotoPermanently,
  deletePlaceReviewPermanently,
  deleteEventPermanently,
  deleteImageFileIfUnreferenced,
  isImageReferencedElsewhere,
  getAdmins,
  findAdminByEmail,
  findAdminById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  setAdminStatus,
  getBrandingConfig,
  updateBrandingConfig,
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlidePermanently,
  getAdvertisements,
  getPublicAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  setAdvertisementApproval,
  deleteAdvertisementPermanently,
  recordAdvertisementClick,
  recordAdvertisementView,
  getAdvertisementPackages,
  createAdvertisementPackage,
  updateAdvertisementPackage,
  deleteAdvertisementPackage,
  getAdvertisementPayments,
  createAdvertisementPayment,
  verifyAdvertisementPayment,
  reconcileAdvertisementPaymentManually,
  getAdvertisementSettings,
  updateAdvertisementSettings,
  getAdvertisementAnalytics,
  findAdminByInvitationToken,
  getRegisteredUsers,
  findUserByEmail,
  findUserById,
  saveRegisteredUser,
  getUserVerification,
  saveUserVerification,
  deleteUserVerification,
  saveUserAuthSession,
  getUserAuthSession,
  deleteUserAuthSession
} from './server/db';
import {
  sendAdminInvitationEmail,
  sendUserVerificationEmail,
  getSmtpStatus,
  verifySmtpConnection,
  parseAdminInviteExpiryMs
} from './server/email';
import { verifyGoogleIdToken } from './server/googleAuth';
import adminInvitationRoutes from './backend/src/routes/adminInvitation.routes';
import {
  verifyAdminCredentials,
  createAdminSession,
  validateSessionToken,
  revokeAdminSession,
  revokeAllSessionsForAdmin,
  requireAdminAuth,
  requireRole,
  requireUserOrAdminAuth,
  canUserModifyPlace,
  UserOrAdminRequest,
  hashPassword,
  checkLoginLockout,
  recordFailedLogin,
  clearFailedLogins,
  parseCookies,
  timingSafeCompare,
  AuthenticatedRequest
} from './server/auth';
import {
  recordHeartbeat,
  recordEvent,
  getActiveUsersCount,
  getLiveUsersList,
  getAnalyticsSummary
} from './server/analytics';
import { Place, Booking, PlaceReview, ShendamEvent, FeedbackItem, RevenueSummary, RevenueTransaction, Opportunity, OpportunityStats, PendingBusinessSubmission } from './src/types';
import {
  sanitizeString,
  isValidId,
  isValidEmail,
  sanitizeNumber,
  isValidCoordinate
} from './server/validation';
import {
  SHENDAM_EVENTS,
  HERO_SLIDES,
  NOTIFICATIONS,
  INITIAL_PENDING_SUBMISSIONS,
  INITIAL_BOOKINGS,
  INITIAL_ADMIN_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FEEDBACK_QUEUE,
  INITIAL_REVENUE_DATA,
  INITIAL_OPPORTUNITIES
} from './src/data/mockData';

// Ensure persistent uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Non-fatal on read-only serverless filesystems (e.g. Vercel)
}

// Initialize persistent DB storage
initDatabase();

// Export shared references for modular backend routes
(globalThis as any).__shendam_auth = { validateSessionToken };
(globalThis as any).__shendam_db = { findAdminByEmail, createAdminUser, updateAdminUser };

const app = express();
const PORT = 3000;

// Global CORS & Header Configuration FIRST (Before Body Parsers and Static Handlers)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Block direct web access to server source files, server builds, database files, and source maps
app.use((req, res, next) => {
  const urlPath = req.path.toLowerCase();
  if (
    urlPath.startsWith('/server-dist') ||
    urlPath.startsWith('/server-data') ||
    urlPath.startsWith('/dist/server') ||
    urlPath.includes('shendam_db') ||
    urlPath.includes('database.json') ||
    urlPath === '/shendam_db.json' ||
    urlPath === '/shendam_db.json.bak' ||
    urlPath === '/server.cjs' ||
    urlPath === '/server.cjs.map' ||
    urlPath.endsWith('.bak') ||
    urlPath.endsWith('.tmp') ||
    urlPath.endsWith('.cjs') ||
    urlPath === '/server.ts' ||
    urlPath.startsWith('/server/') ||
    (urlPath.endsWith('.ts') && !urlPath.startsWith('/src/'))
  ) {
    return res.status(404).json({ error: 'Not Found' });
  }
  next();
});

// Normalize and securely persist place image inputs
function normalizeImageInput(inputUrl: any, prefix = 'biz'): string {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  let str = inputUrl.trim();
  if (str.startsWith('blob:')) {
    // Ephemeral browser blob URLs cannot be preserved on server; return empty to avoid saving broken link
    return '';
  }
  if (str.startsWith('data:image/')) {
    const permanentUrl = persistDataUriImage(str, prefix);
    if (permanentUrl) return permanentUrl;
  }
  // Strip origin if full localhost / cloud run URL was provided for uploads
  if (str.includes('/uploads/')) {
    const uploadsIdx = str.indexOf('/uploads/');
    return str.substring(uploadsIdx);
  }
  return str;
}

// Serve static upload images from persistent DB fallback or local directories
const handleServeUploadImage = (req: any, res: any) => {
  const rawFilename = req.params.filename;
  if (!rawFilename) return res.status(400).json({ error: 'Filename is required' });
  const filename = path.basename(decodeURIComponent(rawFilename)); // Prevent path traversal attacks
  const db = getDb();

  res.setHeader('Access-Control-Allow-Origin', '*');

  // 1. Check in-memory / JSON database backup
  if (db.uploadedImages && db.uploadedImages[filename]) {
    const { mimeType, base64Data } = db.uploadedImages[filename];
    const buffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.send(buffer);
  }

  // 2. Check public/uploads
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      // Auto-cache into database if not yet registered
      const buf = fs.readFileSync(filePath);
      if (buf.length > 0 && (!db.uploadedImages || !db.uploadedImages[filename])) {
        if (!db.uploadedImages) db.uploadedImages = {};
        db.uploadedImages[filename] = {
          mimeType: 'image/jpeg',
          base64Data: buf.toString('base64')
        };
        saveDatabase();
      }
    } catch {
      // Non-fatal caching attempt
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.sendFile(filePath);
  }

  // 3. Check dist/uploads (production bundle)
  const distFilePath = path.join(process.cwd(), 'dist', 'uploads', filename);
  if (fs.existsSync(distFilePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.sendFile(distFilePath);
  }

  // 4. Check /tmp/uploads (serverless ephemeral write path)
  const tmpFilePath = path.join('/tmp', 'uploads', filename);
  if (fs.existsSync(tmpFilePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.sendFile(tmpFilePath);
  }

  return res.status(404).json({ error: 'Image file not found' });
};

app.get('/uploads/:filename', handleServeUploadImage);
app.get('/api/uploads/:filename', handleServeUploadImage);

// Serve static upload images and assets directly
app.use('/uploads', express.static(UPLOADS_DIR));
const distUploadsPath = path.join(process.cwd(), 'dist', 'uploads');
if (fs.existsSync(distUploadsPath)) {
  app.use('/uploads', express.static(distUploadsPath));
}
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));

// Safe IP extractor for serverless (Vercel) and standard Node environments
function getClientIp(req: any): string {
  try {
    const xff = req.headers?.['x-forwarded-for'];
    if (xff) {
      return (typeof xff === 'string' ? xff : xff[0]).split(',')[0].trim();
    }
    if (req.socket?.remoteAddress) {
      return req.socket.remoteAddress;
    }
    if (req.connection?.remoteAddress) {
      return req.connection.remoteAddress;
    }
  } catch {}
  return '127.0.0.1';
}

// In-Memory Rate Limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 400;

app.use('/api', (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment before retrying.'
    });
  }

  record.count += 1;
  next();
});

// ============================================================================
// 1. HEALTH & WEATHER APIS
// ============================================================================
app.get('/api/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    app: 'Shendam Connect API & Admin Core',
    uptimeSeconds: Math.floor(process.uptime()),
    activeUsersNow: getActiveUsersCount(),
    memoryUsageMB: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  });
});

let weatherMemoryCache: { data: any; timestamp: number } | null = null;
const WEATHER_CACHE_TTL = 30 * 60 * 1000;

app.get('/api/weather', async (req, res) => {
  const now = Date.now();
  if (weatherMemoryCache && now - weatherMemoryCache.timestamp < WEATHER_CACHE_TTL) {
    return res.json({ ...weatherMemoryCache.data, cached: true });
  }

  try {
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=8.88&longitude=9.50&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Africa%2FLagos'
    );
    if (response.ok) {
      const data = await response.json();
      const current = data.current;
      
      let conditionText = 'Clear & Sunny';
      const code = current?.weather_code ?? 0;
      if (code === 0) conditionText = 'Clear & Sunny';
      else if (code === 1 || code === 2) conditionText = 'Partly Cloudy';
      else if (code === 3) conditionText = 'Overcast';
      else if (code >= 51 && code <= 67) conditionText = 'Scattered Showers';
      else if (code >= 80 && code <= 99) conditionText = 'Rain Storm';
      else if (code >= 45 && code <= 48) conditionText = 'Hazy / Harmattan';

      const weatherResult = {
        temp: Math.round(current?.temperature_2m ?? 31),
        condition: conditionText,
        humidity: Math.round(current?.relative_humidity_2m ?? 40),
        windSpeed: Math.round(current?.wind_speed_10m ?? 12),
        code,
        location: 'Shendam Central',
        updatedAt: new Date().toISOString()
      };

      weatherMemoryCache = { data: weatherResult, timestamp: now };
      return res.json({ ...weatherResult, cached: false });
    }
  } catch (e) {
    console.warn('[Server] OpenMeteo fetch error, using fallback:', e);
  }

  res.json({
    temp: 31,
    condition: 'Sunny & Warm',
    humidity: 38,
    windSpeed: 11,
    code: 0,
    location: 'Shendam Central',
    updatedAt: new Date().toISOString(),
    cached: false
  });
});

// ============================================================================
// 2. ADMIN AUTHENTICATION ENDPOINTS
// ============================================================================
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const clientIp = getClientIp(req);

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = sanitizeString(email, 120);

  // Check brute force lockout
  const lockoutCheck = checkLoginLockout(clientIp);
  if (lockoutCheck.isLocked) {
    return res.status(429).json({
      error: 'Account Temporarily Locked',
      message: `Too many failed login attempts. For security reasons, administrative access from this IP is temporarily suspended. Please wait ${lockoutCheck.waitMinutes} minute(s) before retrying.`
    });
  }

  const result = verifyAdminCredentials(cleanEmail, password);
  if (!result.success) {
    recordFailedLogin(clientIp, cleanEmail);
    return res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid login credentials.'
    });
  }

  // Clear failed attempts upon successful login
  clearFailedLogins(clientIp);

  const session = createAdminSession(cleanEmail, result.role, result.title);
  
  // Set HttpOnly, SameSite cookie
  res.setHeader('Set-Cookie', session.cookieHeader);

  res.json({
    success: true,
    token: session.token,
    expiresAt: session.expiresAt,
    admin: {
      email: session.email,
      role: session.role,
      title: session.title
    }
  });
});

app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers['x-admin-token'] as string);

  if (token) {
    revokeAdminSession(token);
  }

  // Clear session cookie
  res.setHeader('Set-Cookie', 'shendam_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.json({ success: true, message: 'Successfully logged out.' });
});

app.get('/api/admin/verify', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    valid: true,
    email: req.adminSession?.adminEmail,
    role: req.adminSession?.role || 'SUPER_ADMIN',
    title: req.adminSession?.title || 'Super Admin & Platform Director',
    name: req.adminSession?.name || 'Administrator',
    expiresAt: req.adminSession?.expiresAt
  });
});

// ============================================================================
// 2.4 USER / RESIDENT AUTHENTICATION & 4-DIGIT EMAIL OTP VERIFICATION APIS
// ============================================================================

// Register a new user account & dispatch 4-digit OTP
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name } = req.body || {};

    console.log('[AUTH] Registration request received');

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }

    const existingUser = findUserByEmail(cleanEmail);
    if (existingUser && existingUser.isEmailVerified && existingUser.authProvider === 'email') {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Generate secure 4-digit OTP code (between 1000 and 9999)
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('[AUTH] Verification code generated');

    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes expiry

    // Save verification record
    saveUserVerification({
      email: cleanEmail,
      code: verificationCode,
      createdAt: now,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      lastResendAt: now,
      status: 'pending'
    });

    const passwordHash = hashPassword(password);
    const cleanName = (name && typeof name === 'string' && name.trim().length > 0)
      ? name.trim()
      : cleanEmail.split('@')[0];

    if (existingUser) {
      existingUser.passwordHash = passwordHash;
      existingUser.name = cleanName;
      existingUser.updatedAt = new Date().toISOString();
      saveRegisteredUser(existingUser);
    } else {
      const newUser = {
        id: 'usr_' + crypto.randomBytes(12).toString('hex'),
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        authProvider: 'email' as const,
        isEmailVerified: false,
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };
      saveRegisteredUser(newUser);
    }

    // Call email delivery service
    const emailResult = await sendUserVerificationEmail({
      email: cleanEmail,
      code: verificationCode,
      name: cleanName,
      expiresMinutes: 10
    });

    if (!emailResult.success) {
      console.warn(`[AUTH] 🔑 OTP verification code for ${cleanEmail}: [ ${verificationCode} ] (Email delivery unavailable)`);
      return res.status(200).json({
        success: true,
        emailSent: false,
        requiresVerification: true,
        email: cleanEmail,
        message: 'Your account was created, but we could not send the verification email. ' + (emailResult.error || 'Please check email configuration or try resending.')
      });
    }

    return res.status(200).json({
      success: true,
      emailSent: true,
      requiresVerification: true,
      email: cleanEmail,
      message: 'A 4-digit verification code has been sent to your email.'
    });
  } catch (err: any) {
    console.error('[AUTH] Registration error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing registration.' });
  }
});

// Verify 4-digit OTP code
app.post('/api/auth/verify-code', (req, res) => {
  try {
    const { email, code } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code || '').trim();

    if (!/^\d{4}$/.test(cleanCode)) {
      return res.status(400).json({ success: false, error: 'Verification code must be exactly 4 digits.' });
    }

    const record = getUserVerification(cleanEmail);
    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'No active verification code found for this email. Please request a new code.'
      });
    }

    if (Date.now() > record.expiresAt) {
      record.status = 'expired';
      saveUserVerification(record);
      return res.status(400).json({
        success: false,
        expired: true,
        error: 'This verification code has expired (10 min limit). Please request a new code.'
      });
    }

    if (record.attempts >= record.maxAttempts) {
      return res.status(400).json({
        success: false,
        maxAttemptsReached: true,
        error: 'Maximum verification attempts exceeded. Please request a new code.'
      });
    }

    if (record.code !== cleanCode) {
      record.attempts += 1;
      saveUserVerification(record);
      const remaining = Math.max(0, record.maxAttempts - record.attempts);
      return res.status(400).json({
        success: false,
        remainingAttempts: remaining,
        error: `Invalid 4-digit code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    // Code matches successfully!
    record.status = 'verified';
    saveUserVerification(record);

    let user = findUserByEmail(cleanEmail);
    if (user) {
      user.isEmailVerified = true;
      user.status = 'active';
      user.updatedAt = new Date().toISOString();
      user.lastLoginAt = new Date().toISOString();
      saveRegisteredUser(user);
    } else {
      user = {
        id: 'usr_' + crypto.randomBytes(12).toString('hex'),
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        authProvider: 'email',
        isEmailVerified: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      saveRegisteredUser(user);
    }

    // Create session
    const sessionToken = 'usr_' + crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    saveUserAuthSession({
      token: sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: sessionExpiresAt,
      createdAt: Date.now()
    });

    res.setHeader('Set-Cookie', `shendam_user_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);

    const { passwordHash: _, ...safeUser } = user as any;
    return res.json({
      success: true,
      verified: true,
      token: sessionToken,
      user: safeUser,
      message: 'Account successfully verified.'
    });
  } catch (err: any) {
    console.error('[AUTH] Verify code error:', err);
    return res.status(500).json({ success: false, error: 'Server error verifying code.' });
  }
});

// Resend 4-digit OTP code with cooldown
app.post('/api/auth/resend-code', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = findUserByEmail(cleanEmail);

    if (user && user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        alreadyVerified: true,
        message: 'Account is already verified. Please sign in.'
      });
    }

    const existingRecord = getUserVerification(cleanEmail);
    const now = Date.now();

    // 60-second resend cooldown
    if (existingRecord && now - existingRecord.lastResendAt < 60000) {
      const remainingSec = Math.ceil((60000 - (now - existingRecord.lastResendAt)) / 1000);
      return res.status(429).json({
        success: false,
        cooldown: true,
        remainingSeconds: remainingSec,
        error: `Please wait ${remainingSec}s before requesting a new code.`
      });
    }

    // Generate new 4-digit code
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('[AUTH] New verification code generated for resend');

    saveUserVerification({
      email: cleanEmail,
      code: newCode,
      createdAt: now,
      expiresAt: now + 10 * 60 * 1000,
      attempts: 0,
      maxAttempts: 5,
      lastResendAt: now,
      status: 'pending'
    });

    const emailResult = await sendUserVerificationEmail({
      email: cleanEmail,
      code: newCode,
      name: user?.name,
      expiresMinutes: 10
    });

    if (!emailResult.success) {
      console.warn(`[AUTH] 🔑 Resent OTP verification code for ${cleanEmail}: [ ${newCode} ] (Email delivery unavailable)`);
      return res.status(200).json({
        success: false,
        emailSent: false,
        error: emailResult.error || 'Failed to deliver verification email. Please check SMTP settings.'
      });
    }

    return res.status(200).json({
      success: true,
      emailSent: true,
      message: 'A new 4-digit verification code has been sent to your email.'
    });
  } catch (err: any) {
    console.error('[AUTH] Resend code error:', err);
    return res.status(500).json({ success: false, error: 'Server error resending code.' });
  }
});

// User Login (Email + Password)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = findUserByEmail(cleanEmail);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const expectedHash = hashPassword(password);
    if (user.passwordHash !== expectedHash) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        message: 'Your email address is not verified yet. Please enter the verification code.'
      });
    }

    user.lastLoginAt = new Date().toISOString();
    saveRegisteredUser(user);

    const sessionToken = 'usr_' + crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    saveUserAuthSession({
      token: sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: sessionExpiresAt,
      createdAt: Date.now()
    });

    res.setHeader('Set-Cookie', `shendam_user_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);

    const { passwordHash: _, ...safeUser } = user as any;
    return res.json({
      success: true,
      token: sessionToken,
      user: safeUser,
      message: 'Signed in successfully.'
    });
  } catch (err: any) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing login.' });
  }
});

// Google Authentication (Verified via cryptographically signed Google ID Token)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken, credential } = req.body || {};
    const tokenToVerify = typeof idToken === 'string' && idToken.trim()
      ? idToken.trim()
      : typeof credential === 'string' && credential.trim()
        ? credential.trim()
        : '';

    // 1. Strictly reject requests with missing tokens or containing only an email address
    if (!tokenToVerify) {
      return res.status(401).json({
        success: false,
        error: 'Google ID token (idToken or credential) is required. Raw email authentication is strictly rejected.'
      });
    }

    // 2. Cryptographically verify the Google ID token
    let verifiedUser;
    try {
      const testCertsHeader = req.headers['x-test-google-certs'];
      let certsOverride: Record<string, string> | undefined = undefined;
      if (process.env.NODE_ENV !== 'production' && testCertsHeader && typeof testCertsHeader === 'string') {
        try {
          certsOverride = JSON.parse(Buffer.from(testCertsHeader, 'base64').toString('utf-8'));
        } catch {
          // ignore invalid header
        }
      }

      verifiedUser = await verifyGoogleIdToken(tokenToVerify, { certsOverride });
    } catch (verifyErr: any) {
      return res.status(401).json({
        success: false,
        error: `Google authentication failed: ${verifyErr?.message || 'Invalid or expired Google token.'}`
      });
    }

    if (!verifiedUser || !verifiedUser.email) {
      return res.status(401).json({
        success: false,
        error: 'Unable to extract verified identity from Google ID token.'
      });
    }

    // 3. Obtain user identity SOLELY from the verified token (ignore any req.body.email)
    const cleanEmail = verifiedUser.email.trim().toLowerCase();
    const cleanName = verifiedUser.name || cleanEmail.split('@')[0];
    const avatar = verifiedUser.avatar;

    let user = findUserByEmail(cleanEmail);

    if (user) {
      user.isEmailVerified = true;
      user.status = 'active';
      if (cleanName) user.name = cleanName;
      if (avatar) user.avatar = avatar;
      user.lastLoginAt = new Date().toISOString();
      saveRegisteredUser(user);
    } else {
      user = {
        id: 'usr_' + crypto.randomBytes(12).toString('hex'),
        email: cleanEmail,
        name: cleanName,
        authProvider: 'google',
        isEmailVerified: true,
        status: 'active',
        avatar: avatar || undefined,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      saveRegisteredUser(user);
    }

    const sessionToken = 'usr_' + crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    saveUserAuthSession({
      token: sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: sessionExpiresAt,
      createdAt: Date.now()
    });

    res.setHeader('Set-Cookie', `shendam_user_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);

    const { passwordHash: _, ...safeUser } = user as any;
    return res.json({
      success: true,
      token: sessionToken,
      user: safeUser,
      message: 'Signed in with Google successfully.'
    });
  } catch (err: any) {
    console.error('[AUTH] Google auth error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing Google authentication.' });
  }
});

// Current Logged In User
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieHeader = req.headers.cookie;

    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    if (!token && cookieHeader) {
      const match = cookieHeader.match(/shendam_user_token=([^;]+)/);
      if (match) token = match[1].trim();
    }

    if (!token) {
      return res.json({ authenticated: false, user: null });
    }

    const session = getUserAuthSession(token);
    if (!session) {
      return res.json({ authenticated: false, user: null });
    }

    const user = findUserById(session.userId) || findUserByEmail(session.email);
    if (!user) {
      return res.json({ authenticated: false, user: null });
    }

    const { passwordHash: _, ...safeUser } = user as any;
    return res.json({ authenticated: true, user: safeUser, token });
  } catch (err: any) {
    return res.json({ authenticated: false, user: null });
  }
});

// User Logout
app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieHeader = req.headers.cookie;

    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    if (!token && cookieHeader) {
      const match = cookieHeader.match(/shendam_user_token=([^;]+)/);
      if (match) token = match[1].trim();
    }

    if (token) {
      deleteUserAuthSession(token);
    }

    res.setHeader('Set-Cookie', 'shendam_user_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err: any) {
    return res.json({ success: true });
  }
});


// ============================================================================
// 2.5 ADMIN MANAGEMENT & RBAC APIS
// ============================================================================
// Get list of administrators (SUPER_ADMIN) and active user sessions (all Admins)
app.get('/api/admin/users', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const sessions = Object.values(db.sessions || {}).sort((a, b) => b.lastSeen - a.lastSeen);
  const isSuperAdmin = req.adminSession?.role === 'SUPER_ADMIN';

  const safeAdmins = isSuperAdmin
    ? getAdmins().map((a) => {
        const { passwordHash, invitationToken, ...safeAdmin } = a;
        return safeAdmin;
      })
    : [];

  res.json({
    success: true,
    admins: safeAdmins,
    total: safeAdmins.length,
    totalUsersCount: sessions.length,
    activeUsersCount: getActiveUsersCount(),
    sessions
  });
});

// Check SMTP Email Service status
app.get('/api/admin/email-status', requireAdminAuth, async (req, res) => {
  const status = getSmtpStatus();
  const testConnection = req.query.test === 'true';
  let testResult: { valid: boolean; error?: string } | undefined = undefined;
  if (testConnection) {
    testResult = await verifySmtpConnection();
  }
  res.json({ success: true, smtp: status, testResult });
});

// Direct SMTP connection test endpoint
app.post('/api/admin/test-smtp', requireAdminAuth, requireRole(['SUPER_ADMIN']), async (req, res) => {
  const testResult = await verifySmtpConnection();
  if (testResult.valid) {
    return res.json({ success: true, message: 'SMTP email service is configured and connected successfully.' });
  } else {
    return res.status(500).json({
      success: false,
      message: testResult.error || 'Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.'
    });
  }
});

// Admin SMTP Invitation API Routes (Super Admin Only)
const invitationRouter = typeof adminInvitationRoutes === 'function' ? adminInvitationRoutes : (adminInvitationRoutes as any)?.default;
if (invitationRouter) {
  app.use('/api/admin/invitations', invitationRouter);
}

// Verify invitation token (Public endpoint for accepting invites)
app.get('/api/admin/invite/verify', (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is missing.' });
    }

    const admin = findAdminByInvitationToken(token);
    if (!admin) {
      return res.status(404).json({ error: 'Invalid or unknown invitation link.' });
    }

    if (admin.invitationExpiresAt && new Date(admin.invitationExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        error: 'Invitation Link Expired',
        message: 'This invitation link has expired. Please ask a Super Admin to resend your invitation.'
      });
    }

    res.json({
      success: true,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      title: admin.title,
      status: admin.status
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify invitation token.' });
  }
});

// Accept invitation & set password
app.post('/api/admin/invite/accept', (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invitation token is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const admin = findAdminByInvitationToken(token);
    if (!admin) {
      return res.status(404).json({ error: 'Invalid or unknown invitation token.' });
    }

    if (admin.invitationExpiresAt && new Date(admin.invitationExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        error: 'Invitation Link Expired',
        message: 'This invitation link has expired. Please ask a Super Admin to resend your invitation.'
      });
    }

    const passwordHash = hashPassword(password);
    const updatedAdmin = updateAdminUser(
      admin.id,
      {
        passwordHash,
        status: 'active',
        invitationToken: '',
        invitationSentAt: '',
        invitationExpiresAt: ''
      },
      admin.email
    );

    if (!updatedAdmin) {
      return res.status(500).json({ error: 'Failed to complete account activation.' });
    }

    // Revoke any stale sessions
    revokeAllSessionsForAdmin(admin.id);
    revokeAllSessionsForAdmin(admin.email);

    // Create session and set login cookie
    const session = createAdminSession(updatedAdmin.email, updatedAdmin.role, updatedAdmin.title, updatedAdmin.name, updatedAdmin.id);
    res.setHeader('Set-Cookie', session.cookieHeader);

    const { passwordHash: _, invitationToken: __, ...safeAdmin } = updatedAdmin;
    res.json({
      success: true,
      message: 'Account setup complete! Welcome to Shendam Connect Admin Portal.',
      token: session.token,
      admin: safeAdmin
    });
  } catch (err: any) {
    console.error('[AdminInvite] Accept invitation error:', err);
    res.status(500).json({ error: err.message || 'Failed to set password and accept invitation.' });
  }
});

// Create a new administrator (SUPER_ADMIN only)
app.post('/api/admin/users', requireAdminAuth, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, password, name, role, title, status, sendInvite } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Full administrator name is required.' });
    }

    const validRoles = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'BOOKING_ADMIN', 'ADVERTISING_ADMIN', 'SUPPORT_ADMIN', 'VIEWER'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Check if email already exists
    const existing = findAdminByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An administrator account with this email address already exists.' });
    }

    const isInviteFlow = sendInvite !== false || !password;

    let passwordHash = '';
    if (password && typeof password === 'string' && password.length >= 6) {
      passwordHash = hashPassword(password);
    } else if (!isInviteFlow) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    } else {
      // Set unguessable temporary random hash for invitation account until user accepts & sets password
      passwordHash = hashPassword(crypto.randomBytes(32).toString('hex'));
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const nowIso = new Date().toISOString();
    const expiryMs = parseAdminInviteExpiryMs();
    const expiresDate = new Date(Date.now() + expiryMs);
    const expiresIso = expiresDate.toISOString();

    const adminStatus = isInviteFlow ? 'invited' : (status === 'disabled' ? 'disabled' : 'active');

    const newAdmin = createAdminUser({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      title: title ? title.trim() : 'LGA Administrative Staff',
      passwordHash,
      status: adminStatus,
      createdBy: req.adminSession?.adminEmail || 'SUPER_ADMIN',
      invitationToken: isInviteFlow ? invitationToken : undefined,
      invitationSentAt: isInviteFlow ? nowIso : undefined,
      invitationExpiresAt: isInviteFlow ? expiresIso : undefined
    });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL?.trim();
    const baseUrl = frontendUrl || process.env.APP_URL || `${protocol}://${host}`;

    let emailSent = false;
    let emailError: string | undefined = undefined;
    let inviteUrl = `${baseUrl.replace(/\/$/, '')}/?invite_token=${encodeURIComponent(invitationToken)}#accept-invite`;

    if (isInviteFlow) {
      try {
        const emailResult = await sendAdminInvitationEmail({
          email: newAdmin.email,
          name: newAdmin.name,
          roleTitle: role,
          invitationToken,
          baseUrl,
          expiresAt: expiresDate
        });
        emailSent = emailResult.success;
        emailError = emailResult.error;
        if (emailResult.inviteUrl) {
          inviteUrl = emailResult.inviteUrl;
        }
      } catch (mailErr: any) {
        console.error('[AdminManagement] Email dispatch error:', mailErr);
        emailSent = false;
        emailError = mailErr?.message || 'Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.';
      }
    }

    const { passwordHash: _, invitationToken: __, ...safeAdmin } = newAdmin;
    res.status(201).json({
      success: true,
      admin: safeAdmin,
      isInviteFlow,
      emailSent,
      emailError,
      inviteUrl
    });
  } catch (err: any) {
    console.error('[AdminManagement] Create Admin error:', err);
    res.status(500).json({ error: err.message || 'Failed to create administrator account.' });
  }
});

// Resend Invitation Email to an Administrator (SUPER_ADMIN only)
app.post('/api/admin/users/:id/resend-invite', requireAdminAuth, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const admin = findAdminById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    // Generate fresh invitation token and extended expiration based on ADMIN_INVITE_EXP
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const nowIso = new Date().toISOString();
    const expiryMs = parseAdminInviteExpiryMs();
    const expiresDate = new Date(Date.now() + expiryMs);
    const expiresIso = expiresDate.toISOString();

    const updatedAdmin = updateAdminUser(
      id,
      {
        status: 'invited',
        invitationToken,
        invitationSentAt: nowIso,
        invitationExpiresAt: expiresIso
      },
      req.adminSession?.adminEmail || 'SUPER_ADMIN'
    );

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL?.trim();
    const baseUrl = frontendUrl || process.env.APP_URL || `${protocol}://${host}`;

    let emailSent = false;
    let emailError: string | undefined = undefined;
    let inviteUrl = `${baseUrl.replace(/\/$/, '')}/?invite_token=${encodeURIComponent(invitationToken)}#accept-invite`;

    try {
      const emailResult = await sendAdminInvitationEmail({
        email: admin.email,
        name: admin.name,
        roleTitle: admin.role,
        invitationToken,
        baseUrl,
        expiresAt: expiresDate
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
      if (emailResult.inviteUrl) {
        inviteUrl = emailResult.inviteUrl;
      }
    } catch (mailErr: any) {
      console.error('[AdminManagement] Resend invite error:', mailErr);
      emailSent = false;
      emailError = mailErr?.message || 'Email delivery is not configured correctly. Please check SMTP_HOST, SMTP_USER and SMTP_PASS.';
    }

    const { passwordHash: _, invitationToken: __, ...safeAdmin } = updatedAdmin || admin;
    res.json({
      success: true,
      admin: safeAdmin,
      emailSent,
      emailError,
      inviteUrl
    });
  } catch (err: any) {
    console.error('[AdminManagement] Resend invite error:', err);
    res.status(500).json({ error: err.message || 'Failed to resend invitation email.' });
  }
});

// Get single admin invitation token (SUPER_ADMIN only)
app.get('/api/admin/users/:id/invitation-token', requireAdminAuth, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const admin = findAdminById(id);
  if (!admin) {
    return res.status(404).json({ error: 'Administrator account not found.' });
  }
  res.json({
    success: true,
    invitationToken: admin.invitationToken || null,
    invitationExpiresAt: admin.invitationExpiresAt || null
  });
});

// Update an administrator (SUPER_ADMIN only)
app.put('/api/admin/users/:id', requireAdminAuth, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, role, title, status, password } = req.body || {};

    const admin = findAdminById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    const validRoles = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'BOOKING_ADMIN', 'ADVERTISING_ADMIN', 'SUPPORT_ADMIN', 'VIEWER'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const updates: any = {};
    if (name && typeof name === 'string') updates.name = name.trim();
    if (role) updates.role = role;
    if (title && typeof title === 'string') updates.title = title.trim();
    if (status && (status === 'active' || status === 'disabled')) updates.status = status;

    if (password && typeof password === 'string' && password.trim().length >= 6) {
      updates.passwordHash = hashPassword(password.trim());
      // Revoke all active sessions for this admin upon password reset
      revokeAllSessionsForAdmin(id);
      revokeAllSessionsForAdmin(admin.email);
    }

    if (status === 'disabled') {
      revokeAllSessionsForAdmin(id);
      revokeAllSessionsForAdmin(admin.email);
    }

    const updatedAdmin = updateAdminUser(id, updates, req.adminSession?.adminEmail || 'SUPER_ADMIN');
    if (!updatedAdmin) {
      return res.status(404).json({ error: 'Administrator not found or could not be updated.' });
    }

    const { passwordHash: _, invitationToken: __, ...safeAdmin } = updatedAdmin;
    res.json({ success: true, admin: safeAdmin });
  } catch (err: any) {
    console.error('[AdminManagement] Update Admin error:', err);
    res.status(400).json({ error: err.message || 'Failed to update administrator account.' });
  }
});

// Toggle Admin status (Active / Disabled) (SUPER_ADMIN only)
app.patch('/api/admin/users/:id/status', requireAdminAuth, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (status !== 'active' && status !== 'disabled') {
      return res.status(400).json({ error: 'Status must be "active" or "disabled".' });
    }

    const admin = findAdminById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    const updated = setAdminStatus(id, status, req.adminSession?.adminEmail || 'SUPER_ADMIN');
    if (!updated) {
      return res.status(404).json({ error: 'Administrator not found.' });
    }

    if (status === 'disabled') {
      revokeAllSessionsForAdmin(id);
      revokeAllSessionsForAdmin(admin.email);
    }

    const { passwordHash: _, invitationToken: __, ...safeAdmin } = updated;
    res.json({ success: true, admin: safeAdmin });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update status.' });
  }
});

// Delete an administrator (SUPER_ADMIN only)
app.delete('/api/admin/users/:id', requireAdminAuth, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const admin = findAdminById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Administrator account not found.' });
    }

    // Revoke sessions
    revokeAllSessionsForAdmin(id);
    revokeAllSessionsForAdmin(admin.email);

    const success = deleteAdminUser(id, req.adminSession?.adminEmail || 'SUPER_ADMIN');
    if (!success) {
      return res.status(404).json({ error: 'Administrator not found.' });
    }

    res.json({ success: true, message: `Administrator "${admin.name}" removed successfully.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete administrator account.' });
  }
});

// ============================================================================
// 3. ANALYTICS & LIVE HEARTBEAT APIS
// ============================================================================
// Public Heartbeat ping from client
app.post('/api/analytics/heartbeat', (req, res) => {
  const { sessionId, currentPage, deviceCategory, browser } = req.body;
  const result = recordHeartbeat({ sessionId, currentPage, deviceCategory, browser });
  res.json(result);
});

// Public Event Recording
app.post('/api/analytics/event', (req, res) => {
  const { sessionId, eventType, entityId, entityTitle, category, page, deviceCategory, browser } = req.body;
  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required' });
  }
  const record = recordEvent({
    sessionId,
    eventType,
    entityId,
    entityTitle,
    category,
    page,
    deviceCategory,
    browser
  });
  res.json({ success: true, eventId: record.id });
});

// Real-time active users
app.get('/api/analytics/live-users', (req, res) => {
  res.json(getLiveUsersList());
});

// Admin Analytics Overview & Charts
app.get('/api/admin/analytics/summary', requireAdminAuth, (req, res) => {
  res.json(getAnalyticsSummary());
});

// Admin Dashboard Overview Statistics
app.get('/api/admin/overview', requireAdminAuth, (req, res) => {
  const summary = getAnalyticsSummary();
  const db = getDb();
  res.json({
    ...summary.overview,
    recentAuditLogs: db.auditLogs.slice(0, 5),
    unreadNotifications: db.adminNotifications.filter((n) => !n.read).length
  });
});

// ============================================================================
// 4. PUBLIC PLACES & BOOKINGS APIS
// ============================================================================
app.get('/api/places', (req, res) => {
  const db = getDb();
  // Strictly filter for published/approved places for the public app
  const publishedPlaces = (db.places || []).filter((p) => {
    const s = (p.status || 'published').toLowerCase();
    return s === 'published' || s === 'approved';
  }).map((p) => {
    // Only verified payment details are exposed to customers
    if (p.paymentDetails && p.paymentDetails.status !== 'VERIFIED') {
      const { paymentDetails, ...rest } = p;
      return rest;
    }
    return p;
  });
  res.json({
    places: publishedPlaces,
    deletedPlaceIds: db.deletedPlaceIds || []
  });
});

// Admin All Places (including drafts)
app.get('/api/admin/places', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json({
    places: db.places || [],
    deletedPlaceIds: db.deletedPlaceIds || [],
    total: (db.places || []).length,
    publishedCount: (db.places || []).filter((p) => p.status !== 'draft').length,
    draftCount: (db.places || []).filter((p) => p.status === 'draft').length,
    verifiedCount: (db.places || []).filter((p) => Boolean(p.verified)).length
  });
});

// Direct Image Upload (Admin or Verified Owner Protected)
app.post('/api/admin/upload', requireUserOrAdminAuth, (req: UserOrAdminRequest, res) => {
  try {
    const clientIp = getClientIp(req);
    const callerId = req.adminSession?.adminEmail || req.user?.email || clientIp;

    // Rate limiting check
    const rateCheck = checkUploadRateLimit(`upload_${callerId}`);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Upload rate limit exceeded',
        message: `Too many upload requests. Please wait ${rateCheck.retryAfterSeconds || 60} seconds before trying again.`
      });
    }

    const { fileData, filename, brandingTarget, placeId } = req.body || {};
    if (!fileData) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    // If brandingTarget is requested, strictly require Administrator session
    if (brandingTarget && !req.adminSession) {
      return res.status(403).json({ error: 'Only administrators can update system branding.' });
    }

    // If uploading for a specific place as a normal user, verify listing ownership
    if (placeId && !req.adminSession && req.user) {
      const db = getDb();
      const place = db.places?.find((p) => p.id === placeId);
      if (place && !canUserModifyPlace(req, place)) {
        return res.status(403).json({ error: 'You are not authorized to upload images to this listing.' });
      }
    }

    let mimeType = 'image/jpeg';
    let base64Data = '';

    if (typeof fileData === 'string') {
      if (fileData.startsWith('data:')) {
        const semicolonIdx = fileData.indexOf(';');
        const base64Idx = fileData.indexOf('base64,');
        if (base64Idx !== -1) {
          mimeType = fileData.substring(5, semicolonIdx !== -1 ? semicolonIdx : base64Idx).trim();
          base64Data = fileData.substring(base64Idx + 7).trim();
        } else {
          return res.status(400).json({ error: 'Invalid data URI: missing base64 marker.' });
        }
      } else {
        base64Data = fileData.trim();
      }
    } else {
      return res.status(400).json({ error: 'Invalid image data payload format.' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Decoded image data is empty or invalid.' });
    }

    const prefix = req.body.prefix || (filename?.toLowerCase().includes('lga') || brandingTarget === 'lga_profile' ? 'lga' : (filename?.toLowerCase().includes('logo') || brandingTarget ? 'logo' : 'biz'));
    
    // Strict buffer magic byte and size validation
    const validation = validateUploadedImageBuffer(buffer, mimeType, filename, prefix);
    if (!validation.valid || !validation.safeFilename) {
      return res.status(400).json({ error: validation.error || 'Invalid or unsupported image file.' });
    }

    const publicUrl = storeImageBuffer(validation.safeFilename, validation.mimeType, buffer);

    // If a branding target was provided, update branding in the same single atomic operation
    const db = getDb();
    if (brandingTarget === 'splash' || brandingTarget === 'homepage') {
      if (!db.branding) {
        db.branding = { splashLogo: null, homepageLogo: null };
      }
      if (brandingTarget === 'splash') {
        db.branding.splashLogo = publicUrl;
      } else if (brandingTarget === 'homepage') {
        db.branding.homepageLogo = publicUrl;
      }
      addAuditLog('BRANDING_UPDATED', 'Branding & Logos', `Uploaded and configured new ${brandingTarget === 'splash' ? 'launch screen' : 'homepage header'} logo`, req.adminSession?.adminEmail || 'admin');
      saveDatabase(true);
    }

    res.json({
      success: true,
      url: publicUrl,
      filename: validation.safeFilename,
      size: buffer.length,
      branding: db.branding
    });
  } catch (err: any) {
    console.error('[Upload Error]', err);
    res.status(500).json({ error: `Storage upload error: ${err.message || 'Failed to process and store image upload.'}` });
  }
});

// Batch Image Upload for Photo Galleries (Admin or Verified Owner Protected)
app.post('/api/admin/upload-multiple', requireUserOrAdminAuth, (req: UserOrAdminRequest, res) => {
  try {
    const clientIp = getClientIp(req);
    const callerId = req.adminSession?.adminEmail || req.user?.email || clientIp;

    // Rate limiting check
    const rateCheck = checkUploadRateLimit(`upload_batch_${callerId}`);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Upload rate limit exceeded',
        message: `Too many upload requests. Please wait ${rateCheck.retryAfterSeconds || 60} seconds before trying again.`
      });
    }

    const { files, placeId } = req.body || {};
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for batch upload.' });
    }

    // If uploading for a specific place as a normal user, verify listing ownership
    if (placeId && !req.adminSession && req.user) {
      const db = getDb();
      const place = db.places?.find((p) => p.id === placeId);
      if (place && !canUserModifyPlace(req, place)) {
        return res.status(403).json({ error: 'You are not authorized to upload images to this listing.' });
      }
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file || !file.fileData) continue;
      let mimeType = 'image/jpeg';
      let base64Data = '';
      const fileData = file.fileData;

      if (typeof fileData === 'string') {
        if (fileData.startsWith('data:')) {
          const semicolonIdx = fileData.indexOf(';');
          const base64Idx = fileData.indexOf('base64,');
          if (base64Idx !== -1) {
            mimeType = fileData.substring(5, semicolonIdx !== -1 ? semicolonIdx : base64Idx).trim();
            base64Data = fileData.substring(base64Idx + 7).trim();
          } else {
            continue;
          }
        } else {
          base64Data = fileData.trim();
        }
      } else {
        continue;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0) continue;

      const validation = validateUploadedImageBuffer(buffer, mimeType, file.filename, 'gallery');
      if (!validation.valid || !validation.safeFilename) continue;

      const url = storeImageBuffer(validation.safeFilename, validation.mimeType, buffer);
      uploadedUrls.push(url);
    }

    res.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (err: any) {
    console.error('[Upload Multiple Error]', err);
    res.status(500).json({ error: 'Failed to batch process images.' });
  }
});

app.get('/api/events', (req, res) => {
  const db = getDb();
  res.json({ events: db.events || [] });
});

app.get('/api/notifications', (req, res) => {
  const db = getDb();
  res.json({ notifications: db.notifications || [] });
});

app.get('/api/settings', (req, res) => {
  const db = getDb();
  res.json({ settings: db.settings });
});

// User Review Submission
app.post('/api/places/review', (req, res) => {
  const { placeId, author, rating, comment } = req.body;
  if (!placeId || !author || !comment) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  const db = getDb();
  const place = db.places.find((p) => p.id === placeId);
  if (!place) {
    return res.status(404).json({ error: 'Place not found' });
  }

  const newReview: PlaceReview = {
    id: `rev-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    author: author.trim(),
    rating: Number(rating) || 5,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    comment: comment.trim()
  };

  if (!place.reviews) place.reviews = [];
  place.reviews.unshift(newReview);
  place.reviewsCount = place.reviews.length;
  
  // Recalculate average rating
  const total = place.reviews.reduce((acc, r) => acc + r.rating, 0);
  place.rating = Number((total / place.reviews.length).toFixed(1));

  addAdminNotification(
    'review',
    `New Review for ${place.name}`,
    `${author} gave ${rating} stars: "${comment.slice(0, 60)}..."`,
    'hotels'
  );

  saveDatabase(true);
  res.json({ success: true, review: newReview, updatedPlace: place });
});

// Public Room/Service Booking Submission
app.post('/api/bookings', (req, res) => {
  const {
    placeId,
    placeName,
    category,
    customerName,
    customerPhone,
    customerEmail,
    checkInDate,
    checkOutDate,
    guestsCount,
    roomOrServiceType,
    specialRequests,
    amount
  } = req.body;

  if (!placeId || !placeName || !customerName || !customerPhone || !checkInDate) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Place details, customer name, phone, and check-in date are required.'
    });
  }

  const db = getDb();
  const hotel = (db.places || []).find((p) => p.id === placeId);
  const verifiedPaymentDetails = hotel?.paymentDetails?.status === 'VERIFIED'
    ? {
        bankName: hotel.paymentDetails.bankName,
        accountName: hotel.paymentDetails.accountName,
        accountNumber: hotel.paymentDetails.accountNumber,
        paymentInstructions: hotel.paymentDetails.paymentInstructions || '',
        paymentReferenceFormat: hotel.paymentDetails.paymentReferenceFormat || ''
      }
    : undefined;

  const publicToken = `bk_tok_${crypto.randomBytes(12).toString('hex')}`;
  const accessToken = `bk_sec_${crypto.randomBytes(24).toString('hex')}`;

  const newBooking: Booking = {
    id: `BK-${new Date().getFullYear()}-${String((db.bookings || []).length + 1).padStart(3, '0')}`,
    publicToken,
    accessToken,
    placeId,
    placeName,
    category: category || 'hotels',
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail?.trim(),
    checkInDate,
    checkOutDate: checkOutDate || checkInDate,
    guestsCount: Number(guestsCount) || 1,
    roomOrServiceType: roomOrServiceType || 'Standard Reservation',
    specialRequests: specialRequests || '',
    amount: amount || 'Pay Direct to Hotel',
    status: 'pending',
    paymentMethod: 'Direct Hotel Payment',
    paymentStatus: 'pending_payment',
    hotelPaymentDetails: verifiedPaymentDetails,
    createdAt: new Date().toISOString()
  };

  db.bookings.unshift(newBooking);

  // Set HttpOnly token cookie for session persistence
  try {
    const cookieString = `shendam_booking_token_${newBooking.id}=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
    res.setHeader('Set-Cookie', cookieString);
  } catch {}

  // Trigger Admin Notification & Event
  addAdminNotification(
    'booking',
    `New Direct Booking: ${placeName}`,
    `${customerName} booked ${roomOrServiceType || 'Room'} for ${checkInDate} (${guestsCount} guests). Awaiting direct hotel transfer.`,
    'bookings'
  );

  recordEvent({
    sessionId: req.body.sessionId || 'direct',
    eventType: 'booking_submitted',
    entityId: placeId,
    entityTitle: placeName,
    category: category || 'hotels'
  });

  saveDatabase(true);
  res.status(201).json({
    success: true,
    message: 'Booking request created successfully. Please pay directly to the verified hotel bank account.',
    booking: newBooking,
    accessToken,
    publicToken
  });
});

// Secure Booking Lookup
app.get('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const booking = db.bookings.find((b) => b.id === id || b.publicToken === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking reservation record not found.' });
  }

  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-booking-access-token'] as string;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[`shendam_booking_token_${booking.id}`] || cookies[`shendam_booking_token_${booking.publicToken}`] || cookies['shendam_booking_token'];
  const queryToken = req.query.accessToken as string;

  const providedToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (customHeader || cookieToken || queryToken || '').trim();

  const adminToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : (req.headers['x-admin-token'] as string || cookies['shendam_admin_token']);
  const adminSession = adminToken ? validateSessionToken(adminToken) : null;

  const isOwner = Boolean(booking.accessToken && timingSafeCompare(providedToken, booking.accessToken));
  const isAdmin = Boolean(adminSession);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied: You do not have authorization to view this booking reservation.'
    });
  }

  res.json({ success: true, booking });
});

// Public Customer Payment Reference/Proof Submission
app.post('/api/bookings/:id/payment-proof', (req, res) => {
  const { id } = req.params;
  const { paymentReference, paymentProofNotes } = req.body;
  const db = getDb();

  const booking = db.bookings.find((b) => b.id === id || b.publicToken === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking reservation record not found.' });
  }

  // Extract provided authorization tokens
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-booking-access-token'] as string;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[`shendam_booking_token_${booking.id}`] || cookies[`shendam_booking_token_${booking.publicToken}`] || cookies['shendam_booking_token'];
  const bodyToken = req.body.accessToken;
  const queryToken = req.query.accessToken as string;

  const providedToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (customHeader || bodyToken || cookieToken || queryToken || '').trim();

  // Check admin session
  const adminToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : (req.headers['x-admin-token'] as string || cookies['shendam_admin_token']);
  const adminSession = adminToken ? validateSessionToken(adminToken) : null;

  // Authorization check: must match booking.accessToken or be an admin
  const isOwner = Boolean(booking.accessToken && timingSafeCompare(providedToken, booking.accessToken));
  const isAdmin = Boolean(adminSession);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Unauthorized: You do not have permission to submit payment proof for this booking reservation.'
    });
  }

  if (!paymentReference || !paymentReference.trim()) {
    return res.status(400).json({ error: 'Please provide the transaction reference or sender name.' });
  }

  booking.paymentReference = paymentReference.trim();
  if (paymentProofNotes !== undefined) {
    booking.paymentProofNotes = paymentProofNotes.trim();
  }
  booking.paymentStatus = 'payment_submitted';
  booking.status = 'payment_submitted';
  booking.paymentSubmittedAt = new Date().toISOString();
  booking.updatedAt = new Date().toISOString();

  addAdminNotification(
    'booking',
    `Payment Submitted: ${booking.placeName}`,
    `${booking.customerName} submitted payment reference (${paymentReference.trim()}) for booking ${booking.id}.`,
    'bookings'
  );

  addAuditLog(
    'PAYMENT_PROOF_SUBMITTED',
    `Booking (${booking.id})`,
    `Customer ${booking.customerName} submitted payment reference: ${paymentReference.trim()} for ${booking.placeName}`,
    isOwner ? 'Customer Online' : adminSession?.adminEmail || 'Admin',
    booking.id
  );

  saveDatabase(true);
  res.json({
    success: true,
    message: 'Payment details submitted successfully. The hotel management will verify and confirm your reservation.',
    booking
  });
});

// ============================================================================
// 5. ADMIN BOOKINGS MANAGEMENT (Protected)
// ============================================================================
app.get('/api/admin/bookings', requireAdminAuth, (req, res) => {
  const db = getDb();
  const { status, search, category, sort } = req.query;

  let list = [...db.bookings];

  if (status && status !== 'all') {
    list = list.filter((b) => b.status === status);
  }

  if (category && category !== 'all') {
    list = list.filter((b) => b.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.placeName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q)
    );
  }

  // Sorting
  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ bookings: list, total: list.length });
});

app.patch('/api/admin/bookings/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, paymentStatus, paymentReference, paymentProofNotes, specialRequests, roomOrServiceType, amount } = req.body;
  const db = getDb();

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const oldStatus = booking.status;
  if (status) booking.status = status;
  if (paymentStatus) {
    booking.paymentStatus = paymentStatus;
    if (paymentStatus === 'payment_confirmed') {
      booking.paymentConfirmedAt = new Date().toISOString();
      if (!status && (booking.status === 'pending' || booking.status === 'pending_payment' || booking.status === 'payment_submitted')) {
        booking.status = 'confirmed';
      }
    }
  }
  if (paymentReference !== undefined) booking.paymentReference = paymentReference.trim();
  if (paymentProofNotes !== undefined) booking.paymentProofNotes = paymentProofNotes.trim();
  if (specialRequests !== undefined) booking.specialRequests = specialRequests;
  if (roomOrServiceType) booking.roomOrServiceType = roomOrServiceType;
  if (amount) booking.amount = amount;
  booking.updatedAt = new Date().toISOString();

  addAuditLog(
    `BOOKING_STATUS_CHANGED`,
    `Booking (${id})`,
    `Status: ${booking.status.toUpperCase()}, Payment Status: ${(booking.paymentStatus || 'pending').toUpperCase()} for ${booking.customerName}`,
    req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
    id
  );

  saveDatabase(true);
  res.json({ success: true, booking });
});

app.patch('/api/admin/bookings/:id/status', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, paymentStatus, paymentReference, paymentProofNotes, specialRequests, roomOrServiceType, amount } = req.body;
  const db = getDb();

  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const oldStatus = booking.status;
  if (status) booking.status = status;
  if (paymentStatus) {
    booking.paymentStatus = paymentStatus;
    if (paymentStatus === 'payment_confirmed') {
      booking.paymentConfirmedAt = new Date().toISOString();
      if (!status && (booking.status === 'pending' || booking.status === 'pending_payment' || booking.status === 'payment_submitted')) {
        booking.status = 'confirmed';
      }
    }
  }
  if (paymentReference !== undefined) booking.paymentReference = paymentReference.trim();
  if (paymentProofNotes !== undefined) booking.paymentProofNotes = paymentProofNotes.trim();
  if (specialRequests !== undefined) booking.specialRequests = specialRequests;
  if (roomOrServiceType) booking.roomOrServiceType = roomOrServiceType;
  if (amount) booking.amount = amount;
  booking.updatedAt = new Date().toISOString();

  addAuditLog(
    `BOOKING_STATUS_CHANGED`,
    `Booking (${id})`,
    `Status: ${booking.status.toUpperCase()}, Payment Status: ${(booking.paymentStatus || 'pending').toUpperCase()} for ${booking.customerName}`,
    req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
    id
  );

  saveDatabase(true);
  res.json({ success: true, booking });
});

app.delete('/api/admin/bookings/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const removed = db.bookings.splice(index, 1)[0];
  addAuditLog(
    `BOOKING_DELETED`,
    `Booking (${id})`,
    `Deleted booking for ${removed.customerName} at ${removed.placeName}`,
    req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
    id
  );

  saveDatabase(true);
  res.json({ success: true, message: 'Booking removed successfully.' });
});

// ============================================================================
// 6. ADMIN HOTELS, BUSINESSES & ATTRACTIONS CRUD (Protected)
// ============================================================================
// Helper to validate and sanitize coordinates
function sanitizeCoordinates(coords: any): { lat: number; lng: number } | undefined {
  if (!coords || typeof coords !== 'object') return undefined;
  const lat = typeof coords.lat === 'number' ? coords.lat : parseFloat(coords.lat);
  const lng = typeof coords.lng === 'number' ? coords.lng : parseFloat(coords.lng);
  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0)) {
    return { lat, lng };
  }
  return undefined;
}

// Create Place (Hotel / Business / Commercial / Attraction)
app.post('/api/admin/places', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const placeData: Partial<Place> = req.body;
  if (!placeData.name || !placeData.category) {
    return res.status(400).json({ error: 'Name and Category are required.' });
  }

  const db = getDb();
  const slug = placeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newPlaceId = `place-${slug}-${Date.now().toString().slice(-4)}`;
  const normalizedMainImage = normalizeImageInput(placeData.image, `biz_${newPlaceId}`) || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
  const normalizedGallery = Array.isArray(placeData.gallery) && placeData.gallery.length > 0
    ? placeData.gallery.map((g: string, idx: number) => normalizeImageInput(g, `biz_gal_${newPlaceId}_${idx}`)).filter(Boolean)
    : [normalizedMainImage];
  const normalizedLogo = normalizeImageInput(placeData.logo, `logo_${newPlaceId}`);

  const cleanCoordinates = sanitizeCoordinates(placeData.coordinates);
  const mapUrl = (placeData.map_url || placeData.mapUrl || '').trim() || (cleanCoordinates ? `https://www.google.com/maps?q=${cleanCoordinates.lat},${cleanCoordinates.lng}` : '');
  const directionsUrl = (placeData.directions_url || placeData.directionsUrl || '').trim() || (cleanCoordinates ? `https://www.google.com/maps/dir/?api=1&destination=${cleanCoordinates.lat},${cleanCoordinates.lng}` : '');

  const newPlace: Place = {
    id: newPlaceId,
    name: placeData.name.trim(),
    category: placeData.category,
    categoryLabel: placeData.categoryLabel?.trim() || placeData.category.toUpperCase(),
    rating: Number(placeData.rating) || 5.0,
    reviewsCount: Number(placeData.reviewsCount) || 1,
    image: normalizedMainImage,
    logo: normalizedLogo,
    gallery: normalizedGallery,
    address: placeData.address?.trim() || 'Shendam Town, Plateau State',
    area: placeData.area?.trim() || 'Shendam Central',
    landmark: placeData.landmark?.trim() || undefined,
    lga: placeData.lga?.trim() || 'Shendam',
    state: placeData.state?.trim() || 'Plateau State',
    country: placeData.country?.trim() || 'Nigeria',
    description: placeData.description?.trim() || 'Local business serving the Shendam community.',
    phone: placeData.phone?.trim() || '',
    whatsapp: placeData.whatsapp?.trim() || '',
    priceRange: placeData.priceRange || '₦₦',
    priceDetails: placeData.priceDetails?.trim() || '',
    openingHours: placeData.openingHours?.trim() || '8:00 AM - 6:00 PM',
    owner: placeData.owner?.trim() || '',
    services: Array.isArray(placeData.services) ? placeData.services : [],
    products: Array.isArray(placeData.products) ? placeData.products : [],
    featured: Boolean(placeData.featured),
    popular: Boolean(placeData.popular),
    verified: Boolean(placeData.verified ?? true),
    status: placeData.status === 'draft' ? 'draft' : 'published',
    amenities: Array.isArray(placeData.amenities) && placeData.amenities.length > 0
      ? placeData.amenities
      : (Array.isArray(placeData.services) && placeData.services.length > 0 ? placeData.services : ['Verified Shendam Business']),
    additionalServices: Array.isArray(placeData.additionalServices) ? placeData.additionalServices : [],
    supportedBrands: Array.isArray(placeData.supportedBrands) ? placeData.supportedBrands : [],
    accessories: Array.isArray(placeData.accessories) ? placeData.accessories : [],
    rooms: Array.isArray(placeData.rooms) ? placeData.rooms : undefined,
    menuItems: Array.isArray(placeData.menuItems) ? placeData.menuItems : undefined,
    culturalSignificance: placeData.culturalSignificance?.trim() || undefined,
    entryFee: placeData.entryFee?.trim() || undefined,
    guideAvailable: placeData.guideAvailable !== undefined ? Boolean(placeData.guideAvailable) : undefined,
    dineInAvailable: placeData.dineInAvailable !== undefined ? Boolean(placeData.dineInAvailable) : undefined,
    takeawayAvailable: placeData.takeawayAvailable !== undefined ? Boolean(placeData.takeawayAvailable) : undefined,
    deliveryAvailable: placeData.deliveryAvailable !== undefined ? Boolean(placeData.deliveryAvailable) : undefined,
    emergencyHotline: placeData.emergencyHotline?.trim() || undefined,
    ambulanceAvailable: placeData.ambulanceAvailable !== undefined ? Boolean(placeData.ambulanceAvailable) : undefined,
    coordinates: cleanCoordinates,
    mapUrl: mapUrl || undefined,
    map_url: mapUrl || undefined,
    directionsUrl: directionsUrl || undefined,
    directions_url: directionsUrl || undefined,
    reviews: [],
    paymentDetails: placeData.paymentDetails && placeData.paymentDetails.accountName && placeData.paymentDetails.accountNumber && placeData.paymentDetails.bankName
      ? {
          accountName: placeData.paymentDetails.accountName.trim(),
          accountNumber: placeData.paymentDetails.accountNumber.trim(),
          bankName: placeData.paymentDetails.bankName.trim(),
          paymentInstructions: placeData.paymentDetails.paymentInstructions?.trim() || '',
          paymentReferenceFormat: placeData.paymentDetails.paymentReferenceFormat?.trim() || '',
          status: placeData.paymentDetails.status || 'VERIFIED',
          verifiedAt: (placeData.paymentDetails.status || 'VERIFIED') === 'VERIFIED'
            ? (placeData.paymentDetails.verifiedAt || new Date().toISOString())
            : undefined,
          verifiedBy: (placeData.paymentDetails.status || 'VERIFIED') === 'VERIFIED'
            ? (placeData.paymentDetails.verifiedBy || req.adminSession?.adminEmail || 'Administrator')
            : undefined,
          updatedAt: new Date().toISOString()
        }
      : undefined
  };

  db.places.unshift(newPlace);
  addAuditLog(
    'PLACE_CREATED',
    `Place: ${newPlace.name} (${newPlace.category})`,
    `Added new ${newPlace.categoryLabel} to Shendam Connect directory with status: ${newPlace.status}`,
    req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
    newPlace.id
  );

  saveDatabase(true);
  res.status(201).json({ success: true, place: newPlace });
});

// Update Place
app.put('/api/admin/places/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDb();

  const place = db.places.find((p) => p.id === id);
  if (!place) {
    return res.status(404).json({ error: 'Place not found' });
  }

  // Sanitize and assign updates
  if (updates.name !== undefined) place.name = updates.name.trim();
  if (updates.category !== undefined) place.category = updates.category;
  if (updates.categoryLabel !== undefined) place.categoryLabel = updates.categoryLabel.trim();
  if (updates.image !== undefined) {
    const norm = normalizeImageInput(updates.image, `biz_${place.id}`);
    if (norm) {
      place.image = norm;
    } else if (!String(updates.image).startsWith('blob:')) {
      place.image = '';
    }
  }
  if (updates.logo !== undefined) {
    const norm = normalizeImageInput(updates.logo, `logo_${place.id}`);
    if (norm) {
      place.logo = norm;
    } else if (!String(updates.logo).startsWith('blob:')) {
      place.logo = '';
    }
  }
  if (updates.gallery !== undefined && Array.isArray(updates.gallery)) {
    place.gallery = updates.gallery
      .map((g: string, idx: number) => normalizeImageInput(g, `biz_gal_${place.id}_${idx}`))
      .filter(Boolean);
  }
  if (updates.address !== undefined) place.address = updates.address.trim();
  if (updates.area !== undefined) place.area = updates.area.trim();
  if (updates.landmark !== undefined) place.landmark = updates.landmark ? updates.landmark.trim() : undefined;
  if (updates.lga !== undefined) place.lga = updates.lga ? updates.lga.trim() : undefined;
  if (updates.state !== undefined) place.state = updates.state ? updates.state.trim() : undefined;
  if (updates.country !== undefined) place.country = updates.country ? updates.country.trim() : undefined;
  if (updates.description !== undefined) place.description = updates.description.trim();
  if (updates.phone !== undefined) place.phone = updates.phone.trim();
  if (updates.whatsapp !== undefined) place.whatsapp = updates.whatsapp.trim();
  if (updates.priceRange !== undefined) place.priceRange = updates.priceRange;
  if (updates.priceDetails !== undefined) place.priceDetails = updates.priceDetails.trim();
  if (updates.openingHours !== undefined) place.openingHours = updates.openingHours.trim();
  if (updates.owner !== undefined) place.owner = updates.owner.trim();
  if (updates.services !== undefined) place.services = updates.services;
  if (updates.products !== undefined) place.products = updates.products;
  if (updates.featured !== undefined) place.featured = Boolean(updates.featured);
  if (updates.popular !== undefined) place.popular = Boolean(updates.popular);
  if (updates.verified !== undefined) place.verified = Boolean(updates.verified);
  if (updates.status !== undefined) place.status = updates.status;
  if (updates.amenities !== undefined) place.amenities = updates.amenities;
  if (updates.additionalServices !== undefined) place.additionalServices = updates.additionalServices;
  if (updates.supportedBrands !== undefined) place.supportedBrands = updates.supportedBrands;
  if (updates.accessories !== undefined) place.accessories = updates.accessories;
  if (updates.rooms !== undefined) place.rooms = updates.rooms;
  if (updates.menuItems !== undefined) place.menuItems = updates.menuItems;
  if (updates.culturalSignificance !== undefined) place.culturalSignificance = updates.culturalSignificance ? updates.culturalSignificance.trim() : undefined;
  if (updates.entryFee !== undefined) place.entryFee = updates.entryFee ? updates.entryFee.trim() : undefined;
  if (updates.guideAvailable !== undefined) place.guideAvailable = Boolean(updates.guideAvailable);
  if (updates.dineInAvailable !== undefined) place.dineInAvailable = Boolean(updates.dineInAvailable);
  if (updates.takeawayAvailable !== undefined) place.takeawayAvailable = Boolean(updates.takeawayAvailable);
  if (updates.deliveryAvailable !== undefined) place.deliveryAvailable = Boolean(updates.deliveryAvailable);
  if (updates.emergencyHotline !== undefined) place.emergencyHotline = updates.emergencyHotline ? updates.emergencyHotline.trim() : undefined;
  if (updates.ambulanceAvailable !== undefined) place.ambulanceAvailable = Boolean(updates.ambulanceAvailable);
  if (updates.coordinates !== undefined) {
    place.coordinates = sanitizeCoordinates(updates.coordinates);
    delete place.mapPosition;
  }
  if (updates.mapUrl !== undefined || updates.map_url !== undefined) {
    const mUrl = (updates.map_url || updates.mapUrl || '').trim();
    place.mapUrl = mUrl || undefined;
    place.map_url = mUrl || undefined;
  }
  if (updates.directionsUrl !== undefined || updates.directions_url !== undefined) {
    const dUrl = (updates.directions_url || updates.directionsUrl || '').trim();
    place.directionsUrl = dUrl || undefined;
    place.directions_url = dUrl || undefined;
  }
  if (updates.paymentDetails !== undefined) {
    if (!updates.paymentDetails || updates.paymentDetails === null) {
      delete place.paymentDetails;
    } else if (updates.paymentDetails.accountName && updates.paymentDetails.accountNumber && updates.paymentDetails.bankName) {
      const newStatus = updates.paymentDetails.status || 'VERIFIED';
      const isVerified = newStatus === 'VERIFIED';
      place.paymentDetails = {
        accountName: updates.paymentDetails.accountName.trim(),
        accountNumber: updates.paymentDetails.accountNumber.trim(),
        bankName: updates.paymentDetails.bankName.trim(),
        paymentInstructions: updates.paymentDetails.paymentInstructions?.trim() || '',
        paymentReferenceFormat: updates.paymentDetails.paymentReferenceFormat?.trim() || '',
        status: newStatus,
        verifiedAt: isVerified ? (place.paymentDetails?.verifiedAt || new Date().toISOString()) : undefined,
        verifiedBy: isVerified ? (place.paymentDetails?.verifiedBy || req.adminSession?.adminEmail || 'Administrator') : undefined,
        updatedAt: new Date().toISOString()
      };
    }
  }

  addAuditLog(
    'PLACE_UPDATED',
    `Place: ${place.name}`,
    `Updated directory profile for ${place.name}`,
    req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
    id
  );

  saveDatabase(true);
  res.json({ success: true, place });
});

// Toggle Published / Draft Status
app.patch('/api/admin/places/:id/status', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDb();

  const place = db.places.find((p) => p.id === id);
  if (!place) {
    return res.status(404).json({ error: 'Place not found' });
  }

  place.status = status === 'draft' ? 'draft' : 'published';

  addAuditLog(
    'PLACE_STATUS_TOGGLED',
    `Place: ${place.name}`,
    `Changed status of ${place.name} to ${place.status}`,
    req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
    id
  );

  saveDatabase(true);
  res.json({ success: true, place, status: place.status });
});

// Delete / Archive Place (Permanent atomic deletion, tombstone tracking, and storage file cleanup)
app.delete('/api/admin/places/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const adminEmail = req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng';

  try {
    const result = deletePlacePermanently(id, adminEmail);
    res.json({
      success: true,
      message: `${result.removedPlace.name} deleted permanently.`,
      deletedMediaCount: result.deletedMedia.length,
      deletedPlaceId: id
    });
  } catch (err: any) {
    if (err.message === 'Listing not found') {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    console.error('[Admin] Error deleting place:', err);
    res.status(500).json({ error: err.message || 'Failed to delete listing.' });
  }
});

// Delete specific photo from a place (Permanent removal, referential integrity check, file cleanup)
app.delete('/api/admin/places/:id/photos', requireUserOrAdminAuth, (req: UserOrAdminRequest, res) => {
  const { id } = req.params;
  const { photoUrl } = req.body || {};
  const callerEmail = req.adminSession?.adminEmail || req.user?.email || 'admin@shendamconnect.gov.ng';

  if (!photoUrl) {
    return res.status(400).json({ error: 'photoUrl is required.' });
  }

  const db = getDb();
  const place = db.places?.find((p) => p.id === id);
  if (!place) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  // Enforce Authorization: Caller must be Administrator or verified owner of the listing
  if (!req.adminSession && !canUserModifyPlace(req, place)) {
    return res.status(403).json({ error: 'You are not authorized to delete photos from this listing.' });
  }

  try {
    const result = deletePlacePhotoPermanently(id, photoUrl, callerEmail);
    res.json({
      success: true,
      message: 'Photo deleted permanently.',
      place: result.updatedPlace,
      fileDeleted: result.fileDeleted
    });
  } catch (err: any) {
    if (err.message === 'Listing not found') {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    console.error('[Admin] Error deleting place photo:', err);
    res.status(500).json({ error: err.message || 'Failed to delete photo.' });
  }
});

// Delete specific customer review from a place (Permanent removal, recalculate ratings)
app.delete('/api/admin/places/:id/reviews/:reviewId', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id, reviewId } = req.params;
  const adminEmail = req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng';

  try {
    const result = deletePlaceReviewPermanently(id, reviewId, adminEmail);
    res.json({
      success: true,
      message: 'Customer review deleted successfully.',
      place: result.updatedPlace
    });
  } catch (err: any) {
    if (err.message === 'Listing not found' || err.message === 'Review not found') {
      return res.status(404).json({ error: err.message });
    }
    console.error('[Admin] Error deleting review:', err);
    res.status(500).json({ error: err.message || 'Failed to delete review.' });
  }
});

// Delete uploaded media by URL (with referential integrity check)
app.delete('/api/admin/media', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { mediaUrl } = req.body || {};
  if (!mediaUrl) {
    return res.status(400).json({ error: 'mediaUrl is required.' });
  }

  try {
    const result = deleteImageFileIfUnreferenced(mediaUrl);
    if (result.deleted) {
      saveDatabase(true);
      return res.json({ success: true, message: `Storage file ${result.filename} deleted.`, result });
    } else {
      return res.json({ success: false, message: result.reason || 'File could not be deleted.', result });
    }
  } catch (err: any) {
    console.error('[Admin] Error deleting media file:', err);
    res.status(500).json({ error: err.message || 'Failed to delete media file.' });
  }
});

// ============================================================================
// 7. ADMIN EVENTS, SLIDES & SUBMISSIONS CRUD (Protected)
// ============================================================================
app.post('/api/admin/events', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const eventData: Partial<ShendamEvent> = req.body;
  const db = getDb();

  const newEvent: ShendamEvent = {
    id: `ev-${Date.now()}`,
    title: eventData.title || 'New Cultural Event',
    category: eventData.category || 'Cultural Festival',
    date: eventData.date || 'Upcoming',
    time: eventData.time || '10:00 AM',
    location: eventData.location || 'Shendam LGA Ground',
    image: eventData.image || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
    description: eventData.description || 'Shendam cultural celebration.',
    tag: eventData.tag || 'Featured',
    attendeesCount: Number(eventData.attendeesCount) || 100
  };

  db.events.unshift(newEvent);
  addAuditLog('EVENT_CREATED', `Event: ${newEvent.title}`, 'Created new community event', req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
  saveDatabase(true);
  res.status(201).json({ success: true, event: newEvent });
});

app.put('/api/admin/events/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const ev = db.events.find((e) => e.id === id);
  if (!ev) return res.status(404).json({ error: 'Event not found' });

  Object.assign(ev, req.body);
  addAuditLog('EVENT_UPDATED', `Event: ${ev.title}`, 'Updated event details', req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
  saveDatabase(true);
  res.json({ success: true, event: ev });
});

app.delete('/api/admin/events/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const adminEmail = req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng';

  try {
    const result = deleteEventPermanently(id, adminEmail);
    res.json({
      success: true,
      message: `Event "${result.removedEvent.title}" deleted permanently.`,
      deletedMediaCount: result.deletedMedia.length
    });
  } catch (err: any) {
    if (err.message === 'Event not found') {
      return res.status(404).json({ error: 'Event not found' });
    }
    console.error('[Admin] Error deleting event:', err);
    res.status(500).json({ error: err.message || 'Failed to delete event.' });
  }
});

// ============================================================================
// 7. BUSINESS SUBMISSION SYSTEM & APPROVAL WORKFLOW
// ============================================================================

// Helper: Duplicate Protection Check
function checkDuplicateListing(db: any, name: string, phone: string, address?: string, excludeSubmissionId?: string) {
  const normName = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanPhone = (phone || '').trim().replace(/\D/g, '');

  if (!normName && !cleanPhone) return null;

  // Check existing published/draft places
  for (const p of db.places || []) {
    const pCleanPhone = (p.phone || '').replace(/\D/g, '');
    const pNormName = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanPhone.length >= 7 && pCleanPhone.length >= 7 && (cleanPhone.endsWith(pCleanPhone.slice(-8)) || pCleanPhone.endsWith(cleanPhone.slice(-8)))) {
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        address: p.address,
        matchReason: `Matching phone number with directory place: "${p.name}"`
      };
    }

    if (normName.length >= 4 && pNormName.length >= 4 && (normName === pNormName || (normName.length > 5 && pNormName.includes(normName)))) {
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        address: p.address,
        matchReason: `Identical/similar business name with existing place: "${p.name}"`
      };
    }
  }

  // Check pending submissions queue
  for (const s of db.pendingSubmissions || []) {
    if (excludeSubmissionId && s.id === excludeSubmissionId) continue;
    if (s.status === 'rejected') continue;
    const sCleanPhone = (s.phone || '').replace(/\D/g, '');
    const sNormName = (s.businessName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanPhone.length >= 7 && sCleanPhone.length >= 7 && cleanPhone.endsWith(sCleanPhone.slice(-8))) {
      return {
        id: s.id,
        name: s.businessName,
        phone: s.phone,
        address: s.address,
        matchReason: `Duplicate contact phone with another submitted listing: "${s.businessName}"`
      };
    }
  }

  return null;
}

// Protected multi-photo upload for business listing submission (Authenticated Users & Admins)
app.post('/api/submissions/upload-photos', requireUserOrAdminAuth, (req: UserOrAdminRequest, res) => {
  try {
    const clientIp = getClientIp(req);
    const callerId = req.adminSession?.adminEmail || req.user?.email || clientIp;

    // Rate limiting check
    const rateCheck = checkUploadRateLimit(`submission_upload_${callerId}`);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Upload rate limit exceeded',
        message: `Too many upload requests. Please wait ${rateCheck.retryAfterSeconds || 60} seconds before trying again.`
      });
    }

    const { files, placeId } = req.body || {};
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No photos provided for upload.' });
    }

    // If uploading for an existing listing, verify ownership
    if (placeId && !req.adminSession && req.user) {
      const db = getDb();
      const place = db.places?.find((p) => p.id === placeId);
      if (place && !canUserModifyPlace(req, place)) {
        return res.status(403).json({ error: 'You are not authorized to upload images to this listing.' });
      }
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file || !file.fileData) continue;
      let mimeType = 'image/jpeg';
      let base64Data = '';
      const fileData = file.fileData;

      if (typeof fileData === 'string') {
        if (fileData.startsWith('data:')) {
          const semicolonIdx = fileData.indexOf(';');
          const base64Idx = fileData.indexOf('base64,');
          if (base64Idx !== -1) {
            mimeType = fileData.substring(5, semicolonIdx !== -1 ? semicolonIdx : base64Idx).trim();
            base64Data = fileData.substring(base64Idx + 7).trim();
          } else {
            continue;
          }
        } else {
          base64Data = fileData.trim();
        }
      } else {
        continue;
      }

      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length === 0) continue;

      const validation = validateUploadedImageBuffer(buffer, mimeType, file.filename, 'biz_real');
      if (!validation.valid || !validation.safeFilename) {
        continue;
      }

      const url = storeImageBuffer(validation.safeFilename, validation.mimeType, buffer);
      uploadedUrls.push(url);
    }

    res.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (err: any) {
    console.error('[Photos Upload Error]', err);
    res.status(500).json({ error: 'Failed to upload business photos.' });
  }
});

// Pending Merchant Submissions Queue (Admin)
app.get('/api/admin/submissions', requireAdminAuth, (req, res) => {
  const db = getDb();
  const subs = (db.pendingSubmissions || []).map((sub: any) => {
    // Dynamic duplicate re-check
    const duplicateWarning = checkDuplicateListing(db, sub.businessName, sub.phone, sub.address, sub.id);
    return {
      ...sub,
      potentialDuplicateOf: duplicateWarning || sub.potentialDuplicateOf || null
    };
  });
  res.json({ submissions: subs });
});

// Admin Approve Submission
app.post('/api/admin/submissions/:id/approve', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();

  const sub = (db.pendingSubmissions || []).find((s: any) => s.id === id);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });

  sub.status = 'approved';
  sub.reviewedAt = new Date().toISOString();
  sub.reviewedBy = req.adminSession?.adminEmail || 'admin';

  // Format operating hours for the place record
  let formattedHours = '8:00 AM - 8:00 PM Daily';
  if (typeof sub.operatingHours === 'string' && sub.operatingHours.trim()) {
    formattedHours = sub.operatingHours.trim();
  } else if (sub.operatingHours && typeof sub.operatingHours === 'object') {
    const days = Object.entries(sub.operatingHours);
    if (days.length > 0) {
      const parts = days.map(([day, val]: [string, any]) => {
        if (val?.closed) return `${day.slice(0, 3)}: Closed`;
        if (val?.is24Hours) return `${day.slice(0, 3)}: 24hrs`;
        if (val?.open && val?.close) return `${day.slice(0, 3)}: ${val.open}-${val.close}`;
        return null;
      }).filter(Boolean);
      if (parts.length > 0) formattedHours = parts.slice(0, 4).join(', ');
    }
  }

  // Extract photos
  const allPhotos = Array.isArray(sub.submittedPhotos) && sub.submittedPhotos.length > 0
    ? sub.submittedPhotos
    : sub.imageUrl
    ? [sub.imageUrl]
    : [];

  const primaryPhoto = allPhotos[0] || sub.imageUrl || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80';

  // Check if Place already exists for this submission
  const existingPlaceIndex = (db.places || []).findIndex((p: any) => p.id === `place-${sub.id}` || p.id.startsWith(`place-${sub.id}`));

  const placeRecord: Place = {
    id: existingPlaceIndex !== -1 ? db.places[existingPlaceIndex].id : `place-${sub.id}-${Date.now().toString().slice(-4)}`,
    name: sub.businessName,
    category: sub.category,
    categoryLabel: sub.categoryLabel,
    rating: 5.0,
    reviewsCount: 1,
    image: primaryPhoto,
    gallery: allPhotos.length > 0 ? allPhotos : [primaryPhoto],
    address: sub.address,
    area: sub.area,
    description: sub.fullDescription || sub.description || sub.shortDescription || 'Verified enterprise serving Shendam community.',
    phone: sub.phone,
    whatsapp: sub.whatsapp,
    priceRange: sub.details?.priceRange || sub.priceRange || '₦₦',
    openingHours: formattedHours,
    featured: false,
    popular: true,
    verified: true,
    status: 'published',
    amenities: sub.details?.facilities && sub.details.facilities.length > 0
      ? sub.details.facilities
      : ['Verified Local Business', 'Customer Support', 'Local Shendam Enterprise'],
    products: sub.productsServices && Array.isArray(sub.productsServices)
      ? sub.productsServices.map((ps: any) => ps.name).filter(Boolean)
      : undefined,
    deliveryAvailable: sub.details?.deliveryAvailable,
    takeawayAvailable: sub.details?.pickupAvailable,
    coordinates: sanitizeCoordinates(sub.coordinates),
    directionsUrl: sub.coordinates && typeof sub.coordinates.lat === 'number'
      ? `https://www.google.com/maps/dir/?api=1&destination=${sub.coordinates.lat},${sub.coordinates.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sub.businessName} ${sub.address} Shendam`)}`,
    reviews: [
      {
        id: `rev-initial-${Date.now()}`,
        author: 'Shendam Directory Verification Desk',
        rating: 5,
        date: 'Verified Listing',
        comment: 'Official business registration verified and authenticated for Shendam Connect.'
      }
    ],
    createdAt: new Date().toISOString()
  };

  if (existingPlaceIndex !== -1) {
    db.places[existingPlaceIndex] = placeRecord;
  } else {
    db.places.unshift(placeRecord);
  }

  addAuditLog(
    'SUBMISSION_APPROVED',
    `Business: ${sub.businessName}`,
    `Approved and published "${sub.businessName}" to live directory`,
    req.adminSession?.adminEmail || 'admin'
  );

  saveDatabase(true);
  res.json({ success: true, submission: sub, place: placeRecord, places: db.places });
});

// Admin Reject Submission (with custom reason)
app.post('/api/admin/submissions/:id/reject', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const db = getDb();

  const sub = (db.pendingSubmissions || []).find((s: any) => s.id === id);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });

  sub.status = 'rejected';
  sub.rejectionReason = (reason || 'Incomplete or unverified business information').trim();
  sub.reviewedAt = new Date().toISOString();
  sub.reviewedBy = req.adminSession?.adminEmail || 'admin';

  // If a place was previously published for this submission, remove or mark draft
  db.places = (db.places || []).filter((p: any) => p.id !== `place-${sub.id}` && !p.id.startsWith(`place-${sub.id}`));

  addAuditLog(
    'SUBMISSION_REJECTED',
    `Business: ${sub.businessName}`,
    `Rejected submission "${sub.businessName}": ${sub.rejectionReason}`,
    req.adminSession?.adminEmail || 'admin'
  );

  saveDatabase(true);
  res.json({ success: true, submission: sub });
});

// Admin Suspend Submission / Business
app.post('/api/admin/submissions/:id/suspend', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const db = getDb();

  const sub = (db.pendingSubmissions || []).find((s: any) => s.id === id);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });

  sub.status = 'suspended';
  if (reason) sub.rejectionReason = reason;

  // Unpublish any corresponding place from the public directory
  for (const p of db.places || []) {
    if (p.id === `place-${sub.id}` || p.id.startsWith(`place-${sub.id}`)) {
      p.status = 'draft';
    }
  }

  addAuditLog(
    'SUBMISSION_SUSPENDED',
    `Business: ${sub.businessName}`,
    `Suspended listing "${sub.businessName}"`,
    req.adminSession?.adminEmail || 'admin'
  );

  saveDatabase(true);
  res.json({ success: true, submission: sub, places: db.places });
});

// Admin Edit Submitted Business Information
app.put('/api/admin/submissions/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const db = getDb();

  const sub = (db.pendingSubmissions || []).find((s: any) => s.id === id);
  if (!sub) return res.status(404).json({ error: 'Submission not found.' });

  // Update fields
  if (updates.businessName) sub.businessName = updates.businessName.trim();
  if (updates.category) sub.category = updates.category;
  if (updates.categoryLabel) sub.categoryLabel = updates.categoryLabel;
  if (updates.subcategory) sub.subcategory = updates.subcategory;
  if (updates.shortDescription) sub.shortDescription = updates.shortDescription;
  if (updates.fullDescription) sub.fullDescription = updates.fullDescription;
  if (updates.description) sub.description = updates.description;
  if (updates.contactName) sub.contactName = updates.contactName;
  if (updates.email) sub.email = updates.email;
  if (updates.phone) sub.phone = updates.phone;
  if (updates.whatsapp !== undefined) sub.whatsapp = updates.whatsapp;
  if (updates.website !== undefined) sub.website = updates.website;
  if (updates.socialMedia !== undefined) sub.socialMedia = updates.socialMedia;
  if (updates.area) sub.area = updates.area;
  if (updates.address) sub.address = updates.address;
  if (updates.landmark !== undefined) sub.landmark = updates.landmark;
  if (updates.priceRange) sub.priceRange = updates.priceRange;
  if (updates.submittedPhotos && Array.isArray(updates.submittedPhotos)) {
    sub.submittedPhotos = updates.submittedPhotos;
    sub.imageUrl = updates.submittedPhotos[0] || sub.imageUrl;
  }
  if (updates.operatingHours) sub.operatingHours = updates.operatingHours;
  if (updates.productsServices) sub.productsServices = updates.productsServices;
  if (updates.details) sub.details = updates.details;
  if (updates.status) sub.status = updates.status;

  // If already published, sync to places directory
  if (sub.status === 'approved') {
    const existingPlace = (db.places || []).find((p: any) => p.id === `place-${sub.id}` || p.id.startsWith(`place-${sub.id}`));
    if (existingPlace) {
      existingPlace.name = sub.businessName;
      existingPlace.category = sub.category;
      existingPlace.categoryLabel = sub.categoryLabel;
      existingPlace.address = sub.address;
      existingPlace.area = sub.area;
      existingPlace.phone = sub.phone;
      existingPlace.whatsapp = sub.whatsapp;
      existingPlace.description = sub.fullDescription || sub.description || sub.shortDescription;
      if (sub.submittedPhotos && sub.submittedPhotos.length > 0) {
        existingPlace.image = sub.submittedPhotos[0];
        existingPlace.gallery = sub.submittedPhotos;
      }
    }
  }

  addAuditLog(
    'SUBMISSION_EDITED',
    `Business: ${sub.businessName}`,
    `Updated submitted business details for "${sub.businessName}"`,
    req.adminSession?.adminEmail || 'admin'
  );

  saveDatabase(true);
  res.json({ success: true, submission: sub, places: db.places });
});

// Public Merchant Business Submission Endpoint
app.post('/api/submissions', (req, res) => {
  try {
    const {
      businessName,
      category,
      subcategory,
      shortDescription,
      fullDescription,
      description,
      contactName,
      email,
      phone,
      whatsapp,
      website,
      socialMedia,
      area,
      address,
      landmark,
      city,
      lga,
      coordinates,
      operatingHours,
      productsServices,
      details,
      photos,
      submittedPhotos,
      verificationInfo,
      termsAccepted,
      priceRange
    } = req.body;

    if (!businessName || !businessName.trim()) {
      return res.status(400).json({ error: 'Business / Place Name is required.' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Business Category is required.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Street Address is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Contact Phone Number is required.' });
    }
    if (!termsAccepted) {
      return res.status(400).json({ error: 'You must confirm that the information and photos are accurate and belong to this business.' });
    }

    const db = getDb();
    if (!db.pendingSubmissions) db.pendingSubmissions = [];

    // Process submitted photos: save any data URIs as permanent files using storeImageBuffer
    const rawPhotosList = Array.isArray(submittedPhotos) && submittedPhotos.length > 0
      ? submittedPhotos
      : Array.isArray(photos) && photos.length > 0
      ? photos
      : [];

    const permanentPhotos: string[] = [];
    for (const item of rawPhotosList) {
      if (typeof item === 'string') {
        if (item.startsWith('data:image/')) {
          const semicolonIdx = item.indexOf(';');
          const base64Idx = item.indexOf('base64,');
          if (base64Idx !== -1) {
            const mimeType = item.substring(5, semicolonIdx !== -1 ? semicolonIdx : base64Idx).trim();
            const base64Data = item.substring(base64Idx + 7).trim();
            const buffer = Buffer.from(base64Data, 'base64');
            if (buffer.length > 0) {
              let ext = 'jpg';
              if (mimeType.includes('png')) ext = 'png';
              else if (mimeType.includes('webp')) ext = 'webp';
              const safeName = `biz_real_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
              const url = storeImageBuffer(safeName, mimeType, buffer);
              permanentPhotos.push(url);
              continue;
            }
          }
        } else if (item.startsWith('/uploads/') || item.startsWith('http://') || item.startsWith('https://')) {
          permanentPhotos.push(item);
        }
      }
    }

    const getCategoryLabel = (cat: string): string => {
      switch (cat) {
        case 'hotels': return 'Hotel & Lodging';
        case 'restaurants': return 'Restaurant & Dining';
        case 'tourist_spots': return 'Tourist & Cultural Attraction';
        case 'shopping': return 'Shopping & Market';
        case 'transport': return 'Transport & Logistics';
        case 'services': return 'Professional & Artisan Services';
        case 'health': return 'Health & Medical';
        case 'emergency': return 'Emergency Service';
        default: return 'Business & Enterprise';
      }
    };

    const finalDescription = (fullDescription || description || shortDescription || 'Verified local business in Shendam.').trim();

    // Check Duplicate protection
    const duplicateMatch = checkDuplicateListing(db, businessName, phone, address);

    const submissionId = `sub-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newSubmission: PendingBusinessSubmission = {
      id: submissionId,
      businessName: businessName.trim(),
      category: category || 'businesses',
      categoryLabel: getCategoryLabel(category),
      subcategory: subcategory ? subcategory.trim() : undefined,
      shortDescription: shortDescription ? shortDescription.trim() : undefined,
      fullDescription: fullDescription ? fullDescription.trim() : undefined,
      description: finalDescription,
      contactName: contactName ? contactName.trim() : 'Business Owner',
      email: email ? email.trim() : undefined,
      phone: phone.trim(),
      whatsapp: whatsapp ? whatsapp.trim() : undefined,
      website: website ? website.trim() : undefined,
      socialMedia: socialMedia ? socialMedia.trim() : undefined,
      area: area ? area.trim() : 'Shendam Main Town',
      address: address.trim(),
      landmark: landmark ? landmark.trim() : undefined,
      city: city ? city.trim() : 'Shendam',
      lga: lga ? lga.trim() : 'Shendam LGA, Plateau State, Nigeria',
      coordinates: sanitizeCoordinates(coordinates),
      operatingHours: operatingHours || '8:00 AM - 8:00 PM Daily',
      productsServices: Array.isArray(productsServices) ? productsServices : [],
      details: details || {
        priceRange: priceRange || '₦₦',
        paymentMethods: ['Cash', 'POS / Debit Card', 'Bank Transfer'],
        parkingAvailable: true
      },
      submittedPhotos: permanentPhotos,
      imageUrl: permanentPhotos[0] || undefined,
      gallery: permanentPhotos,
      verificationInfo: verificationInfo || undefined,
      termsAccepted: true,
      status: 'pending', // PENDING ADMIN APPROVAL - Strictly not public until approved
      potentialDuplicateOf: duplicateMatch,
      submittedAt: new Date().toISOString(),
      priceRange: priceRange || details?.priceRange || '₦₦'
    };

    db.pendingSubmissions.unshift(newSubmission);

    addAdminNotification(
      'alert',
      `New Business Listing Proposed: ${newSubmission.businessName}`,
      `Proprietor: ${newSubmission.contactName} (${newSubmission.phone}). Category: ${newSubmission.categoryLabel}. Status: PENDING APPROVAL.`,
      'submissions'
    );

    addAuditLog(
      'SUBMISSION_RECEIVED',
      `Business: ${newSubmission.businessName}`,
      `Public merchant application registered for admin approval`,
      'public_merchant'
    );

    saveDatabase(true);

    res.status(201).json({
      success: true,
      submission: newSubmission,
      status: 'PENDING_APPROVAL',
      message: 'Your business listing has been submitted for review. Status: PENDING ADMIN APPROVAL. Our administration will review your information and verify your real photos before publishing to Shendam Connect.'
    });
  } catch (err: any) {
    console.error('[Submission Error]', err);
    res.status(500).json({ error: 'Failed to process business submission: ' + (err.message || 'Unknown error') });
  }
});

// Check Submission Status (by submission ID or phone number)
app.get('/api/submissions/status/:query', (req, res) => {
  const { query } = req.params;
  const db = getDb();

  const cleanQuery = query.trim();
  const cleanPhone = cleanQuery.replace(/\D/g, '');

  const submission = (db.pendingSubmissions || []).find((s: any) => {
    if (s.id === cleanQuery) return true;
    if (cleanPhone.length >= 7) {
      const sPhone = (s.phone || '').replace(/\D/g, '');
      return sPhone.endsWith(cleanPhone.slice(-8));
    }
    return false;
  });

  if (!submission) {
    return res.status(404).json({ error: 'No submission found with the provided reference or phone number.' });
  }

  res.json({
    success: true,
    submission: {
      id: submission.id,
      businessName: submission.businessName,
      categoryLabel: submission.categoryLabel,
      status: submission.status,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      rejectionReason: submission.rejectionReason,
      photosCount: (submission.submittedPhotos || []).length
    }
  });
});

// ============================================================================
// 8. USER FEEDBACK & FEATURE REQUESTS QUEUE
// ============================================================================
// Public submission endpoint
app.post('/api/feedback', (req, res) => {
  const { type, title, description, category, contactName, contactEmail, contactPhone, deviceInfo } = req.body;

  if (!title || !title.trim() || !description || !description.trim()) {
    return res.status(400).json({ error: 'Title and detailed description are required.' });
  }

  const db = getDb();
  const feedbackType = (type === 'feature_request' || type === 'issue_report' || type === 'general_feedback') ? type : 'general_feedback';

  const newFeedback: FeedbackItem = {
    id: `fb-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    type: feedbackType,
    title: title.trim(),
    description: description.trim(),
    category: (category && String(category).trim()) || (feedbackType === 'feature_request' ? 'Feature Idea' : feedbackType === 'issue_report' ? 'Issue Report' : 'General'),
    contactName: contactName ? String(contactName).trim() : undefined,
    contactEmail: contactEmail ? String(contactEmail).trim() : undefined,
    contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
    deviceInfo: deviceInfo ? String(deviceInfo).trim() : undefined,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    adminNotes: ''
  };

  db.feedbackQueue.unshift(newFeedback);

  const typeLabel = feedbackType === 'feature_request' ? 'Feature Request' : feedbackType === 'issue_report' ? 'Issue Report' : 'General Feedback';
  addAdminNotification(
    'alert',
    `New ${typeLabel}: ${newFeedback.title}`,
    `${newFeedback.contactName ? newFeedback.contactName + ': ' : ''}${newFeedback.description.slice(0, 100)}${newFeedback.description.length > 100 ? '...' : ''}`,
    'feedback'
  );

  addAuditLog('FEEDBACK_SUBMITTED', `${typeLabel}: ${newFeedback.title}`, `User submitted ${feedbackType}: "${newFeedback.title}"`, 'public_user');

  saveDatabase(true);
  res.status(201).json({ success: true, feedback: newFeedback, message: 'Thank you for your feedback! It has been submitted directly to the Shendam LGA administration team.' });
});

// Admin list feedback queue (Protected)
app.get('/api/admin/feedback', requireAdminAuth, (req, res) => {
  const db = getDb();
  res.json({ feedback: db.feedbackQueue || [] });
});

// Admin update feedback status / notes (Protected)
app.patch('/api/admin/feedback/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const db = getDb();

  const item = db.feedbackQueue.find((f) => f.id === id);
  if (!item) return res.status(404).json({ error: 'Feedback item not found.' });

  if (status) item.status = status;
  if (adminNotes !== undefined) item.adminNotes = adminNotes;

  addAuditLog(
    'FEEDBACK_UPDATED',
    `Feedback (${item.id}): ${item.title}`,
    `Updated status to '${item.status}'`,
    req.adminSession?.adminEmail || 'admin'
  );

  saveDatabase(true);
  res.json({ success: true, feedback: item });
});

app.patch('/api/admin/feedback/:id/status', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const db = getDb();

  const item = db.feedbackQueue.find((f) => f.id === id);
  if (!item) return res.status(404).json({ error: 'Feedback item not found.' });

  if (status) item.status = status;
  if (adminNotes !== undefined) item.adminNotes = adminNotes;

  addAuditLog(
    'FEEDBACK_UPDATED',
    `Feedback (${item.id}): ${item.title}`,
    `Updated status to '${item.status}'`,
    req.adminSession?.adminEmail || 'admin'
  );

  saveDatabase(true);
  res.json({ success: true, feedback: item });
});

// Admin delete feedback ticket (Protected)
app.delete('/api/admin/feedback/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();

  const index = db.feedbackQueue.findIndex((f) => f.id === id);
  if (index === -1) return res.status(404).json({ error: 'Feedback item not found.' });

  const removed = db.feedbackQueue.splice(index, 1)[0];
  addAuditLog('FEEDBACK_DELETED', `Feedback: ${removed.title}`, 'Deleted feedback record from queue', req.adminSession?.adminEmail || 'admin');

  saveDatabase(true);
  res.json({ success: true, message: 'Feedback ticket deleted successfully.' });
});

// ============================================================================
// 9. REVENUE & FINANCIAL MANAGEMENT
// ============================================================================
app.get('/api/admin/revenue', requireAdminAuth, (req, res) => {
  const db = getDb();
  if (!db.revenue) {
    db.revenue = INITIAL_REVENUE_DATA;
    saveDatabase();
  }
  res.json({
    success: true,
    revenue: db.revenue
  });
});

app.post('/api/admin/revenue/transaction', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { source, title, amount, payer, status, reference } = req.body;
  if (!source || !title || !amount) {
    return res.status(400).json({ error: 'Source, title, and amount are required.' });
  }

  const db = getDb();
  if (!db.revenue) db.revenue = INITIAL_REVENUE_DATA;

  const numAmount = Number(amount) || 0;
  const newTx: RevenueTransaction = {
    id: `tx-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    source,
    title: title.trim(),
    amount: numAmount,
    date: new Date().toISOString(),
    status: status === 'pending' ? 'pending' : 'completed',
    payer: payer ? String(payer).trim() : 'Direct Transaction',
    reference: reference || `TXN-${Date.now().toString().slice(-6)}`
  };

  if (!db.revenue.recentTransactions) db.revenue.recentTransactions = [];
  db.revenue.recentTransactions.unshift(newTx);

  // Update tallies
  if (newTx.status === 'completed') {
    db.revenue.todaysRevenue += numAmount;
    db.revenue.thisMonth += numAmount;
    if (source === 'booking_commission') db.revenue.bookingCommission += numAmount;
    else if (source === 'advertising') db.revenue.advertising += numAmount;
    else if (source === 'sponsored_listing') db.revenue.sponsoredListings += numAmount;
    else if (source === 'premium_account') db.revenue.premiumAccounts += numAmount;
  } else {
    db.revenue.pendingRevenue += numAmount;
  }

  addAuditLog(
    'REVENUE_TRANSACTION_RECORDED',
    `Revenue: ₦${numAmount.toLocaleString()} (${source})`,
    `Recorded transaction: "${newTx.title}" from ${newTx.payer}`,
    req.adminSession?.adminEmail || 'admin'
  );

  saveDatabase(true);
  res.json({ success: true, transaction: newTx, revenue: db.revenue });
});

// ============================================================================
// 10. USERS (ANONYMOUS SESSIONS), AUDIT LOGS, NOTIFICATIONS & SETTINGS
// ============================================================================
app.get(['/api/admin/user-sessions', '/api/admin/sessions'], requireAdminAuth, (req, res) => {
  const db = getDb();
  const sessions = Object.values(db.sessions || {}).sort((a, b) => b.lastSeen - a.lastSeen);
  res.json({
    success: true,
    totalUsersCount: sessions.length,
    activeUsersCount: getActiveUsersCount(),
    sessions
  });
});

app.get('/api/admin/activity', requireAdminAuth, (req, res) => {
  const db = getDb();
  res.json({ activityLogs: db.auditLogs });
});

app.get('/api/admin/notifications', requireAdminAuth, (req, res) => {
  const db = getDb();
  res.json({ notifications: db.adminNotifications });
});

app.patch('/api/admin/notifications/:id/read', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const n = db.adminNotifications.find((item) => item.id === id);
  if (n) n.read = true;
  saveDatabase();
  res.json({ success: true });
});

// Broadcast Alert to App Users
app.post('/api/admin/notifications/broadcast', requireAdminAuth, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), (req: AuthenticatedRequest, res) => {
  const { title, category, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const db = getDb();
  const newNotif = {
    id: `notif-${Date.now()}`,
    title: title.trim(),
    category: category || 'LGA Announcement',
    time: 'Just now',
    content: content.trim(),
    read: false
  };

  db.notifications.unshift(newNotif);
  addAuditLog('BROADCAST_ALERT', 'Public Notifications', `Broadcasted public notice: "${title}"`, req.adminSession?.adminEmail || 'admin');
  saveDatabase(true);
  res.json({ success: true, notification: newNotif });
});

app.get('/api/admin/settings', requireAdminAuth, (req, res) => {
  const db = getDb();
  res.json({ settings: db.settings });
});

app.put('/api/admin/settings', requireAdminAuth, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.settings) {
    db.settings = {} as any;
  }

  const oldLgaImage = db.settings.lgaProfileImage;
  let newLgaImage = req.body.lgaProfileImage;

  // If a base64 Data URI was provided for lgaProfileImage, normalize it to persistent disk storage
  if (newLgaImage && typeof newLgaImage === 'string' && newLgaImage.startsWith('data:')) {
    newLgaImage = normalizeImageInput(newLgaImage, 'lga_profile');
  }

  // Update settings
  Object.assign(db.settings, req.body);
  if (req.body.lgaProfileImage !== undefined) {
    db.settings.lgaProfileImage = newLgaImage || null;
  }

  // If the old image existed, is different from the newly stored one, and is in /uploads/,
  // clean up the storage file if unreferenced elsewhere
  if (oldLgaImage && oldLgaImage !== db.settings.lgaProfileImage && typeof oldLgaImage === 'string' && oldLgaImage.includes('/uploads/')) {
    try {
      deleteImageFileIfUnreferenced(oldLgaImage);
    } catch (cleanupErr) {
      console.warn('[Storage] Non-fatal error cleaning up previous LGA profile image:', cleanupErr);
    }
  }

  addAuditLog('SETTINGS_UPDATED', 'Platform Settings', 'Updated platform configuration settings', req.adminSession?.adminEmail || 'admin');
  saveDatabase(true);
  res.json({ success: true, settings: db.settings });
});

// ============================================================================
// BRANDING, LOGOS & SEASONAL THEMES ENDPOINTS
// ============================================================================
app.get('/api/branding', (req, res) => {
  res.json(getBrandingConfig());
});

app.get('/api/admin/branding', requireAdminAuth, (req, res) => {
  res.json({ branding: getBrandingConfig() });
});

app.put('/api/admin/branding', requireAdminAuth, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body || {};
    // Normalize and persist any Data URI images to permanent storage (/public/uploads)
    if (body.splashLogo) body.splashLogo = normalizeImageInput(body.splashLogo, 'logo_splash');
    if (body.homepageLogo) body.homepageLogo = normalizeImageInput(body.homepageLogo, 'logo_home');
    if (body.favicon) body.favicon = normalizeImageInput(body.favicon, 'favicon');
    if (body.homepageBackground) body.homepageBackground = normalizeImageInput(body.homepageBackground, 'bg_home');
    if (body.heroBackground) body.heroBackground = normalizeImageInput(body.heroBackground, 'bg_hero');
    if (body.seasonal?.customBannerUrl) {
      body.seasonal.customBannerUrl = normalizeImageInput(body.seasonal.customBannerUrl, 'banner_festive');
    }

    const updated = updateBrandingConfig(body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success: true, branding: updated });
  } catch (err: any) {
    console.error('[Branding Update Error]', err);
    res.status(500).json({ error: `Database update failed: ${err.message || 'Could not update branding settings.'}` });
  }
});

app.post('/api/admin/branding/seasonal/activate', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { theme, customTitle, customGreeting, customBannerUrl, accentColor, showCelebrationBadge } = req.body || {};
  const current = getBrandingConfig();
  const updated = updateBrandingConfig({
    ...current,
    seasonal: {
      activeTheme: theme || 'custom',
      customTitle: customTitle || '',
      customGreeting: customGreeting || '',
      customBannerUrl: customBannerUrl || null,
      accentColor: accentColor || '#FFC928',
      showCelebrationBadge: showCelebrationBadge ?? true
    }
  }, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');

  res.json({ success: true, message: `Activated ${theme} seasonal theme.`, branding: updated });
});

app.post('/api/admin/branding/seasonal/deactivate', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const current = getBrandingConfig();
  const updated = updateBrandingConfig({
    ...current,
    seasonal: {
      activeTheme: 'none',
      customTitle: '',
      customGreeting: '',
      customBannerUrl: null,
      accentColor: '#FFC928',
      showCelebrationBadge: false
    }
  }, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');

  res.json({ success: true, message: 'Deactivated seasonal theme. Reverted to standard brand theme.', branding: updated });
});

// ============================================================================
// HERO SLIDES / HOMEPAGE CAROUSEL CMS (Public & Protected Admin)
// ============================================================================
app.get('/api/hero-slides', (req, res) => {
  res.json({ slides: getHeroSlides() });
});

app.get('/api/admin/hero-slides', requireAdminAuth, (req, res) => {
  res.json({ slides: getHeroSlides() });
});

app.post('/api/admin/hero-slides', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const slide = createHeroSlide(req.body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.status(201).json({ success: true, slide, slides: getHeroSlides() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create hero slide' });
  }
});

app.put('/api/admin/hero-slides/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const slide = updateHeroSlide(req.params.id, req.body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success: true, slide, slides: getHeroSlides() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update hero slide' });
  }
});

app.delete('/api/admin/hero-slides/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const result = deleteHeroSlidePermanently(req.params.id, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success: true, ...result, slides: getHeroSlides() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete hero slide' });
  }
});

// ============================================================================
// ADVERTISEMENTS & SPONSORSHIPS CMS (Public & Protected Admin)
// ============================================================================
app.get('/api/advertisements', (req, res) => {
  const placement = typeof req.query.placement === 'string' ? req.query.placement : undefined;
  const ads = getPublicAdvertisements(placement);
  res.json({ advertisements: ads, count: ads.length });
});

app.get('/api/advertisements/settings', (req, res) => {
  const settings = getAdvertisementSettings();
  // Sanitize for public output (do not expose private server tokens)
  res.json({
    settings: {
      localAdsEnabled: settings.localAdsEnabled,
      startupAdsEnabled: settings.startupAdsEnabled,
      startupFrequencyHours: settings.startupFrequencyHours,
      allowedPlacements: settings.allowedPlacements,
      approvalRequired: settings.approvalRequired,
      googleAds: {
        enabled: settings.googleAds?.enabled ?? false,
        clientId: settings.googleAds?.clientId || '',
        slotId: settings.googleAds?.slotId || '',
        testMode: settings.googleAds?.testMode ?? true,
        placements: settings.googleAds?.placements || {}
      },
      paystack: {
        // Retained for future activation; disabled in current version (hotel bookings and local ads use verified direct transfers)
        enabled: false,
        publicKey: process.env.VITE_PAYSTACK_PUBLIC_KEY || settings.paystack?.publicKey || '',
        configured: Boolean(process.env.PAYSTACK_SECRET_KEY)
      }
    }
  });
});

app.get('/api/advertisements/packages', (req, res) => {
  const packages = getAdvertisementPackages().filter((p) => p.active !== false);
  res.json({ packages, count: packages.length });
});

app.post('/api/advertisements/:id/click', (req, res) => {
  recordAdvertisementClick(req.params.id);
  res.json({ success: true });
});

app.post('/api/advertisements/:id/impression', (req, res) => {
  recordAdvertisementView(req.params.id);
  res.json({ success: true });
});

// Paystack Online Processing Flag: disabled in current version (Direct Hotel Payment & Admin reconciliation active)
const PAYSTACK_PROCESSING_ENABLED = process.env.PAYSTACK_ENABLED === 'true';

// Create payment record for advertisement / package
app.post('/api/advertisements/payments/initiate', (req, res) => {
  try {
    const { advertisementId, packageId, amount, advertiserName, advertiserEmail, advertiserPhone } = req.body;
    if (!advertiserName) {
      return res.status(400).json({ error: 'Advertiser name is required' });
    }

    if (!PAYSTACK_PROCESSING_ENABLED) {
      return res.status(200).json({
        success: false,
        disabled: true,
        message: 'Online automated Paystack payment processing is disabled in this version. Please use Direct Bank Payment or contact Shendam Connect Admin for manual reconciliation.',
        payment: null
      });
    }

    const payment = createAdvertisementPayment({
      advertisementId,
      packageId,
      amount: typeof amount === 'number' ? amount : 0,
      advertiserName,
      advertiserEmail,
      advertiserPhone
    });

    res.status(201).json({
      success: true,
      payment,
      paystackPublicKey: process.env.VITE_PAYSTACK_PUBLIC_KEY || ''
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to initiate payment' });
  }
});

// Server-side payment verification (Paystack live or test verification)
// Retained for future activation; disabled in current version.
app.post('/api/advertisements/payments/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    if (!PAYSTACK_PROCESSING_ENABLED) {
      return res.status(403).json({
        success: false,
        error: 'Automated Paystack payment verification is disabled in this version. Admin manual reconciliation is available in the Admin Portal.'
      });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(400).json({
        success: false,
        error: 'PAYSTACK_SECRET_KEY is not configured in the server environment. Please configure it in your Settings to enable live automated Paystack verification, or have an admin manually reconcile the payment.'
      });
    }

    // Call official Paystack transaction verification endpoint
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = (await response.json()) as any;
    if (!response.ok || !data.status) {
      return res.status(400).json({
        success: false,
        error: data.message || 'Paystack payment verification failed'
      });
    }

    const isSuccess = data.data && data.data.status === 'success';
    const amountInNaira = data.data && data.data.amount ? data.data.amount / 100 : 0;

    const result = verifyAdvertisementPayment(
      reference,
      {
        status: isSuccess ? 'success' : 'failed',
        amount: amountInNaira,
        transactionData: data.data
      }
    );

    res.json({
      success: result.success,
      payment: result.payment,
      activatedAd: result.activatedAd
    });
  } catch (err: any) {
    console.error('[Paystack Verification Error]', err);
    res.status(500).json({ error: err.message || 'Payment verification processing error' });
  }
});

// Optional Paystack Webhook (retained for future activation; disabled in current version)
app.post('/api/advertisements/payments/webhook', (req, res) => {
  try {
    if (!PAYSTACK_PROCESSING_ENABLED) {
      return res.sendStatus(200);
    }
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
      if (hash === req.headers['x-paystack-signature']) {
        const event = req.body;
        if (event && event.event === 'charge.success') {
          const ref = event.data?.reference;
          const amount = event.data?.amount ? event.data.amount / 100 : 0;
          if (ref) {
            verifyAdvertisementPayment(ref, {
              status: 'success',
              amount,
              transactionData: event.data
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Paystack Webhook Handler]', err);
  }
  res.sendStatus(200);
});

// ============================================================================
// ADMIN ADVERTISEMENT CMS ENDPOINTS
// ============================================================================
app.get('/api/admin/advertisements', requireAdminAuth, (req, res) => {
  const ads = getAdvertisements();
  res.json({ advertisements: ads, total: ads.length });
});

app.get('/api/admin/advertisements/analytics', requireAdminAuth, (req, res) => {
  const dateRange = typeof req.query.range === 'string' ? req.query.range : '30d';
  const analytics = getAdvertisementAnalytics(dateRange);
  res.json({ success: true, analytics });
});

app.post('/api/admin/advertisements', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const ad = createAdvertisement(req.body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.status(201).json({ success: true, advertisement: ad, advertisements: getAdvertisements() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create advertisement' });
  }
});

app.put('/api/admin/advertisements/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const ad = updateAdvertisement(req.params.id, req.body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success: true, advertisement: ad, advertisements: getAdvertisements() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update advertisement' });
  }
});

app.patch('/api/admin/advertisements/:id/status', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.body;
    const ad = updateAdvertisement(
      req.params.id,
      { status: status as any },
      req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng'
    );
    res.json({ success: true, advertisement: ad, advertisements: getAdvertisements() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to toggle advertisement status' });
  }
});

app.patch('/api/admin/advertisements/:id/approval', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { approvalStatus, notes } = req.body;
    if (!approvalStatus || !['pending_approval', 'approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Valid approvalStatus is required (pending_approval, approved, rejected)' });
    }
    const ad = setAdvertisementApproval(
      req.params.id,
      approvalStatus,
      req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
      notes
    );
    res.json({ success: true, advertisement: ad, advertisements: getAdvertisements() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update advertisement approval' });
  }
});

app.delete('/api/admin/advertisements/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const result = deleteAdvertisementPermanently(req.params.id, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success: true, ...result, advertisements: getAdvertisements() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete advertisement' });
  }
});

// Admin Packages Management
app.get('/api/admin/advertisements/packages', requireAdminAuth, (req, res) => {
  const packages = getAdvertisementPackages();
  res.json({ packages, total: packages.length });
});

app.post('/api/admin/advertisements/packages', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const pkg = createAdvertisementPackage(req.body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.status(201).json({ success: true, package: pkg, packages: getAdvertisementPackages() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create advertisement package' });
  }
});

app.put('/api/admin/advertisements/packages/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const pkg = updateAdvertisementPackage(req.params.id, req.body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success: true, package: pkg, packages: getAdvertisementPackages() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update advertisement package' });
  }
});

app.delete('/api/admin/advertisements/packages/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const success = deleteAdvertisementPackage(req.params.id, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success, packages: getAdvertisementPackages() });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete advertisement package' });
  }
});

// Admin Payments Management
app.get('/api/admin/advertisements/payments', requireAdminAuth, (req, res) => {
  const payments = getAdvertisementPayments();
  res.json({ payments, total: payments.length });
});

app.post('/api/admin/advertisements/payments/:id/reconcile', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { notes } = req.body;
    const result = reconcileAdvertisementPaymentManually(
      req.params.id,
      req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng',
      notes
    );
    res.json({
      success: true,
      payment: result.payment,
      activatedAd: result.activatedAd,
      payments: getAdvertisementPayments()
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reconcile payment' });
  }
});

// Admin Advertising Settings Management
app.get('/api/admin/advertisements/settings', requireAdminAuth, (req, res) => {
  const settings = getAdvertisementSettings();
  res.json({ settings });
});

app.put('/api/admin/advertisements/settings', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  try {
    const updated = updateAdvertisementSettings(req.body, req.adminSession?.adminEmail || 'admin@shendamconnect.gov.ng');
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update advertising settings' });
  }
});

// ============================================================================
// 8. JOBS & OPPORTUNITIES ENDPOINTS (Public & Protected Admin)
// ============================================================================
function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Public: Get all active published opportunities with filters & search
app.get('/api/opportunities', (req, res) => {
  const { search, category, remoteStatus, paidStatus, includeExpired, hasReferral } = req.query;
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  let list = db.opportunities ? db.opportunities.filter((o) => o.published) : [];

  // Filter out expired opportunities for public view unless requested
  if (includeExpired !== 'true') {
    list = list.filter((o) => !o.deadline || o.deadline >= today);
  }

  // Filter by category
  if (category && category !== 'all') {
    list = list.filter((o) => o.category === category);
  }

  // Filter by remote status
  if (remoteStatus && remoteStatus !== 'all') {
    list = list.filter((o) => o.remoteStatus === remoteStatus);
  }

  // Filter by paid status
  if (paidStatus && paidStatus !== 'all') {
    list = list.filter((o) => o.paidStatus === paidStatus);
  }

  // Filter by referral link status
  if (hasReferral === 'true') {
    list = list.filter((o) => !!(o.referralUrl && o.referralUrl.trim() && isValidUrl(o.referralUrl)));
  }

  // Search filter (title, organization, category, location, description)
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
    );
  }

  // Sort featured first, then newest
  list.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Securely sanitize public payload: hide raw referralUrl in list view unless clicked
  const sanitizedList = list.map((o) => {
    const hasRef = !!(o.referralUrl && o.referralUrl.trim() && isValidUrl(o.referralUrl));
    const { referralUrl, ...publicFields } = o;
    return {
      ...publicFields,
      hasReferralLink: hasRef,
      isReferral: hasRef
    };
  });

  res.json({ success: true, opportunities: sanitizedList, count: sanitizedList.length });
});

// Public: Get single opportunity & track view
app.get('/api/opportunities/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  // Increment view count
  opp.viewsCount = (opp.viewsCount || 0) + 1;
  saveDatabase();

  // Record analytics event
  recordEvent({
    sessionId: (req.headers['x-session-id'] as string) || 'public-session',
    eventType: 'opportunity_viewed',
    entityId: opp.id,
    entityTitle: opp.title,
    category: opp.category as any
  });

  const hasRef = !!(opp.referralUrl && opp.referralUrl.trim() && isValidUrl(opp.referralUrl));

  res.json({
    success: true,
    opportunity: {
      ...opp,
      hasReferralLink: hasRef,
      isReferral: hasRef
    }
  });
});

// Public: Track apply button click (prioritizes Referral Link if set)
app.post('/api/opportunities/:id/apply', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  opp.applyClicks = (opp.applyClicks || 0) + 1;

  const hasReferral = !!(opp.referralUrl && opp.referralUrl.trim() && isValidUrl(opp.referralUrl));
  const targetUrl = hasReferral ? opp.referralUrl!.trim() : (opp.applicationUrl || opp.officialUrl || '').trim();

  if (hasReferral) {
    opp.referralClicks = (opp.referralClicks || 0) + 1;
    recordEvent({
      sessionId: (req.headers['x-session-id'] as string) || 'public-session',
      eventType: 'opportunity_referral_clicked',
      entityId: opp.id,
      entityTitle: opp.title,
      category: opp.category as any
    });
  } else {
    recordEvent({
      sessionId: (req.headers['x-session-id'] as string) || 'public-session',
      eventType: 'opportunity_apply_clicked',
      entityId: opp.id,
      entityTitle: opp.title,
      category: opp.category as any
    });
  }

  saveDatabase();

  res.json({
    success: true,
    applicationUrl: targetUrl,
    targetUrl,
    isReferral: hasReferral
  });
});

// Webhook / Postback endpoint for Affiliate Networks (Authorized Server-to-Server or Admin Protected)
app.post('/api/affiliate/conversion', (req, res) => {
  const webhookSecret = process.env.AFFILIATE_WEBHOOK_SECRET;
  const providedSecret = (req.headers['x-webhook-secret'] as string) || (req.query.secret as string);
  const sessionToken = parseCookies(req.headers.cookie || '').admin_session;
  const adminSession = sessionToken ? validateSessionToken(sessionToken) : null;

  // Enforce security: Require configured webhook secret OR active Admin session
  if (webhookSecret) {
    if (!providedSecret || !timingSafeCompare(providedSecret, webhookSecret)) {
      if (!adminSession) {
        return res.status(401).json({ error: 'Unauthorized affiliate conversion webhook request.' });
      }
    }
  } else if (!adminSession) {
    // If no webhook secret is configured in environment, require admin session to record conversions
    return res.status(401).json({ error: 'Authentication required to report affiliate conversions.' });
  }

  const { opportunityId, referralCode, commissionAmount, note } = req.body || {};
  const db = getDb();
  const opp = db.opportunities?.find(
    (o) => o.id === opportunityId || (o.referralUrl && referralCode && o.referralUrl.includes(referralCode))
  );

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity matching referral parameter not found.' });
  }

  const amt = parseFloat(commissionAmount || '0');
  if (amt > 0) {
    opp.confirmedCommissions = (opp.confirmedCommissions || 0) + amt;
    opp.conversionCount = (opp.conversionCount || 0) + 1;
    opp.conversionNote = note || 'Conversions are reported by the external referral platform.';
    
    db.revenue.referralCommission = (db.revenue.referralCommission || 0) + amt;
    db.revenue.confirmedReferralRevenue = (db.revenue.confirmedReferralRevenue || 0) + amt;
    db.revenue.thisMonth = (db.revenue.thisMonth || 0) + amt;
    db.revenue.todaysRevenue = (db.revenue.todaysRevenue || 0) + amt;
    saveDatabase();
  }

  res.json({ success: true, message: 'External conversion recorded successfully', opportunityId: opp.id });
});

// Admin: Opportunities Statistics Summary
app.get('/api/admin/opportunities/stats', requireAdminAuth, (req, res) => {
  const db = getDb();
  const list = db.opportunities || [];
  const today = new Date().toISOString().split('T')[0];
  const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const stats = {
    total: list.length,
    active: list.filter((o) => o.published && (!o.deadline || o.deadline >= today)).length,
    expiringSoon: list.filter(
      (o) => o.published && o.deadline && o.deadline >= today && o.deadline <= inSevenDays
    ).length,
    expired: list.filter((o) => o.deadline && o.deadline < today).length,
    featured: list.filter((o) => o.featured).length,
    verified: list.filter((o) => o.verificationStatus === 'verified').length,
    totalViews: list.reduce((acc, o) => acc + (o.viewsCount || 0), 0),
    totalApplyClicks: list.reduce((acc, o) => acc + (o.applyClicks || 0), 0),
    totalReferralClicks: list.reduce((acc, o) => acc + (o.referralClicks || 0), 0),
    confirmedReferralRevenue: list.reduce((acc, o) => acc + (o.confirmedCommissions || 0), 0),
    totalMonetized: list.filter((o) => !!(o.referralUrl && o.referralUrl.trim())).length
  };

  res.json({ success: true, stats });
});

// Admin: Get all opportunities (including draft / unpublished / expired)
app.get('/api/admin/opportunities', requireAdminAuth, (req, res) => {
  const db = getDb();
  res.json({ success: true, opportunities: db.opportunities || [] });
});

// Admin: Create opportunity
app.post('/api/admin/opportunities', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const {
    title,
    organization,
    category,
    description,
    requirements,
    location,
    remoteStatus,
    paidStatus,
    compensation,
    deadline,
    applicationUrl,
    officialUrl,
    referralUrl,
    monetizationStatus,
    applicationInstructions,
    contactInfo,
    verificationStatus,
    featured,
    published
  } = req.body;

  const primaryOfficialUrl = (officialUrl || applicationUrl || '').trim();

  if (!title || !organization || !category || !description || !primaryOfficialUrl) {
    return res.status(400).json({ error: 'Title, organization, category, description, and Official URL are required.' });
  }

  if (!isValidUrl(primaryOfficialUrl)) {
    return res.status(400).json({ error: 'Please enter a valid HTTP or HTTPS official application URL (e.g. https://example.com/careers).' });
  }

  if (referralUrl && referralUrl.trim() && !isValidUrl(referralUrl.trim())) {
    return res.status(400).json({ error: 'Invalid Referral/Affiliate URL format. Must start with http:// or https://' });
  }

  const db = getDb();
  if (!db.opportunities) db.opportunities = [];

  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';
  const isVerified = verificationStatus === 'verified';
  const cleanedReferralUrl = referralUrl ? referralUrl.trim() : '';

  const newOpp: Opportunity = {
    id: `opp-${Date.now()}`,
    title: title.trim(),
    organization: organization.trim(),
    category,
    description: description.trim(),
    requirements: Array.isArray(requirements)
      ? requirements
      : typeof requirements === 'string'
      ? requirements.split('\n').map((r: string) => r.trim()).filter(Boolean)
      : [],
    location: location?.trim() || 'Shendam LGA / Remote',
    remoteStatus: remoteStatus || 'remote',
    paidStatus: paidStatus || 'paid',
    compensation: compensation?.trim() || '',
    deadline: deadline || '',
    applicationUrl: primaryOfficialUrl,
    officialUrl: primaryOfficialUrl,
    referralUrl: cleanedReferralUrl,
    monetizationStatus: monetizationStatus || (cleanedReferralUrl ? 'referral_link' : 'no_referral'),
    applicationInstructions: applicationInstructions?.trim() || '',
    contactInfo: contactInfo?.trim() || '',
    verificationStatus: isVerified ? 'verified' : 'unverified',
    verifiedBy: isVerified ? adminEmail : undefined,
    verifiedAt: isVerified ? new Date().toISOString() : undefined,
    featured: !!featured,
    published: published !== false,
    viewsCount: 0,
    applyClicks: 0,
    referralClicks: 0,
    confirmedCommissions: 0,
    conversionCount: 0,
    conversionNote: 'Conversions are reported by the external referral platform.',
    createdAt: new Date().toISOString()
  };

  db.opportunities.unshift(newOpp);
  addAuditLog('OPPORTUNITY_CREATED', `Opportunity: ${newOpp.title}`, `Created listing for ${newOpp.organization}${cleanedReferralUrl ? ' with referral link' : ''}`, adminEmail);
  saveDatabase(true);

  res.status(201).json({ success: true, opportunity: newOpp });
});

// Admin: Edit opportunity
app.put('/api/admin/opportunities/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const {
    title,
    organization,
    category,
    description,
    requirements,
    location,
    remoteStatus,
    paidStatus,
    compensation,
    deadline,
    applicationUrl,
    officialUrl,
    referralUrl,
    monetizationStatus,
    applicationInstructions,
    contactInfo,
    verificationStatus,
    featured,
    published
  } = req.body;

  const targetOfficialUrl = (officialUrl || applicationUrl || '').trim();
  if (targetOfficialUrl && !isValidUrl(targetOfficialUrl)) {
    return res.status(400).json({ error: 'Invalid Official URL format. Must start with http:// or https://' });
  }

  if (referralUrl !== undefined && referralUrl !== '' && !isValidUrl(referralUrl.trim())) {
    return res.status(400).json({ error: 'Invalid Referral/Affiliate URL format. Must start with http:// or https://' });
  }

  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';

  if (title) opp.title = title.trim();
  if (organization) opp.organization = organization.trim();
  if (category) opp.category = category;
  if (description) opp.description = description.trim();
  if (requirements !== undefined) {
    opp.requirements = Array.isArray(requirements)
      ? requirements
      : typeof requirements === 'string'
      ? requirements.split('\n').map((r: string) => r.trim()).filter(Boolean)
      : [];
  }
  if (location !== undefined) opp.location = location.trim();
  if (remoteStatus) opp.remoteStatus = remoteStatus;
  if (paidStatus) opp.paidStatus = paidStatus;
  if (compensation !== undefined) opp.compensation = compensation.trim();
  if (deadline !== undefined) opp.deadline = deadline;
  if (targetOfficialUrl) {
    opp.applicationUrl = targetOfficialUrl;
    opp.officialUrl = targetOfficialUrl;
  }
  if (referralUrl !== undefined) {
    opp.referralUrl = referralUrl.trim();
    if (!opp.referralUrl) {
      opp.monetizationStatus = 'no_referral';
    } else if (!opp.monetizationStatus || opp.monetizationStatus === 'no_referral') {
      opp.monetizationStatus = 'referral_link';
    }
  }
  if (monetizationStatus) opp.monetizationStatus = monetizationStatus;
  if (applicationInstructions !== undefined) opp.applicationInstructions = applicationInstructions.trim();
  if (contactInfo !== undefined) opp.contactInfo = contactInfo.trim();
  if (featured !== undefined) opp.featured = !!featured;
  if (published !== undefined) opp.published = !!published;

  if (verificationStatus) {
    if (verificationStatus === 'verified' && opp.verificationStatus !== 'verified') {
      opp.verificationStatus = 'verified';
      opp.verifiedBy = adminEmail;
      opp.verifiedAt = new Date().toISOString();
    } else if (verificationStatus === 'unverified') {
      opp.verificationStatus = 'unverified';
      opp.verifiedBy = undefined;
      opp.verifiedAt = undefined;
    }
  }

  opp.updatedAt = new Date().toISOString();

  addAuditLog('OPPORTUNITY_UPDATED', `Opportunity: ${opp.title}`, `Updated opportunity listing`, adminEmail);
  saveDatabase(true);

  res.json({ success: true, opportunity: opp });
});

// Admin: Clear/Remove referral link
app.delete('/api/admin/opportunities/:id/referral-url', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  opp.referralUrl = '';
  opp.monetizationStatus = 'no_referral';
  opp.updatedAt = new Date().toISOString();

  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';
  addAuditLog('OPPORTUNITY_REFERRAL_REMOVED', `Opportunity: ${opp.title}`, `Removed referral URL`, adminEmail);
  saveDatabase(true);

  res.json({ success: true, opportunity: opp });
});

// Admin: Record confirmed commission payout for an opportunity
app.post('/api/admin/opportunities/:id/commission', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { amount, note, reference, payer } = req.body;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive commission amount in Naira.' });
  }

  opp.confirmedCommissions = (opp.confirmedCommissions || 0) + numAmount;
  opp.conversionCount = (opp.conversionCount || 0) + 1;
  if (note) opp.conversionNote = note;

  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';
  
  if (!db.revenue.recentTransactions) db.revenue.recentTransactions = [];
  const newTx: RevenueTransaction = {
    id: `tx-ref-${Date.now()}`,
    source: 'referral_commission',
    title: `Confirmed Referral Commission - ${opp.title}`,
    amount: numAmount,
    date: new Date().toISOString(),
    status: 'completed',
    payer: payer || opp.organization || 'Affiliate Partner Network',
    reference: reference || `REF-COMM-${Date.now().toString().slice(-6)}`
  };

  db.revenue.recentTransactions.unshift(newTx);
  db.revenue.referralCommission = (db.revenue.referralCommission || 0) + numAmount;
  db.revenue.confirmedReferralRevenue = (db.revenue.confirmedReferralRevenue || 0) + numAmount;
  db.revenue.thisMonth = (db.revenue.thisMonth || 0) + numAmount;
  db.revenue.todaysRevenue = (db.revenue.todaysRevenue || 0) + numAmount;

  addAuditLog('REFERRAL_COMMISSION_RECORDED', `Opportunity: ${opp.title}`, `Recorded ₦${numAmount.toLocaleString()} confirmed referral revenue`, adminEmail);
  saveDatabase(true);

  res.json({ success: true, opportunity: opp, transaction: newTx });
});

// Admin: Toggle publish
app.patch('/api/admin/opportunities/:id/publish', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  opp.published = !opp.published;
  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';

  addAuditLog(
    'OPPORTUNITY_PUBLISH_TOGGLED',
    `Opportunity: ${opp.title}`,
    `${opp.published ? 'Published' : 'Unpublished'} opportunity`,
    adminEmail
  );
  saveDatabase(true);

  res.json({ success: true, opportunity: opp, published: opp.published });
});

// Admin: Toggle verification
app.patch('/api/admin/opportunities/:id/verify', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';

  if (opp.verificationStatus === 'verified') {
    opp.verificationStatus = 'unverified';
    opp.verifiedBy = undefined;
    opp.verifiedAt = undefined;
  } else {
    opp.verificationStatus = 'verified';
    opp.verifiedBy = adminEmail;
    opp.verifiedAt = new Date().toISOString();
  }

  addAuditLog(
    'OPPORTUNITY_VERIFY_TOGGLED',
    `Opportunity: ${opp.title}`,
    `Changed verification status to ${opp.verificationStatus}`,
    adminEmail
  );
  saveDatabase(true);

  res.json({ success: true, opportunity: opp });
});

// Admin: Toggle feature
app.patch('/api/admin/opportunities/:id/feature', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  const opp = db.opportunities?.find((o) => o.id === id);

  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  opp.featured = !opp.featured;
  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';

  addAuditLog(
    'OPPORTUNITY_FEATURE_TOGGLED',
    `Opportunity: ${opp.title}`,
    `${opp.featured ? 'Featured' : 'Unfeatured'} opportunity`,
    adminEmail
  );
  saveDatabase(true);

  res.json({ success: true, opportunity: opp, featured: opp.featured });
});

// Admin: Delete / Archive opportunity
app.delete('/api/admin/opportunities/:id', requireAdminAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.opportunities) return res.status(404).json({ error: 'Opportunity not found' });

  const idx = db.opportunities.findIndex((o) => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  const removed = db.opportunities.splice(idx, 1)[0];
  const adminEmail = req.adminSession?.adminEmail || 'Super Admin';

  addAuditLog(
    'OPPORTUNITY_DELETED',
    `Opportunity: ${removed.title}`,
    `Deleted opportunity listing (${removed.organization})`,
    adminEmail
  );
  saveDatabase(true);

  res.json({ success: true, message: 'Opportunity deleted successfully.' });
});

// Global Express Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Request Error]', err);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred processing your request.';
  res.status(statusCode).json({ error: message, message });
});

// ============================================================================
// 9. VITE SPA MIDDLEWARE FOR DEVELOPMENT & PRODUCTION
// ============================================================================
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NETLIFY ||
  process.env.SERVERLESS
);

async function startServer() {
  if (isServerless) {
    // In Vercel or serverless environment, Vercel routes static files directly and handles serverless requests.
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1d' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Shendam Connect] Server & Admin API running at http://0.0.0.0:${PORT}`);
  });
}

if (!isServerless) {
  startServer();
}

export default app;
export { app };
