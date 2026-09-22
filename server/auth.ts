import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import {
  addAuditLog,
  getDb,
  saveDatabase,
  findAdminByEmail,
  findAdminById,
  getAdmins,
  getUserAuthSession,
  findUserById,
  findUserByEmail
} from './db';
import { sanitizeString } from './validation';
import { AdminRole, AdminUser, RegisteredUser, UserAuthSession } from '../src/types';

// Super Admin initial account and environment credentials
const SUPER_ADMIN_EMAIL = 'domnanraymond9@gmail.com';
const CONFIGURED_ADMIN_EMAIL = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : null;

// Authorized Administrator Accounts whitelist
export const AUTHORIZED_ADMIN_ACCOUNTS = new Set<string>([
  SUPER_ADMIN_EMAIL.toLowerCase(),
  ...(CONFIGURED_ADMIN_EMAIL ? [CONFIGURED_ADMIN_EMAIL] : [])
]);

// Master password / hash configuration
const ADMIN_PASSWORD_RAW = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH || 'ShendamAdmin2026!';
const JWT_SECRET = process.env.JWT_SECRET || 'shendam_connect_secret_jwt_key_2026';
const rawTTL = String(process.env.ADMIN_SESSION_TTL_MS || '2592000000').replace(/[^0-9]/g, '');
const SESSION_TTL_MS = Number(rawTTL) > 0 ? Number(rawTTL) : 2592000000; // 30 days default long-lived session

// Helper to hash password with SHA-256 + secret HMAC salt
export function hashPassword(plain: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(plain).digest('hex');
}

// Expected hashes
const EXPECTED_ADMIN_HASH = hashPassword(ADMIN_PASSWORD_RAW);
const DEFAULT_FALLBACK_HASH = hashPassword('ShendamAdmin2026!');

// Safe constant-time hash comparison to prevent timing attacks
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      // Compare dummy buffer to maintain constant time
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Failed login attempt tracking for brute-force protection
interface LoginAttemptRecord {
  attempts: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkLoginLockout(identifier: string): { isLocked: boolean; waitMinutes?: number } {
  const record = loginAttempts.get(identifier);
  if (!record) return { isLocked: false };

  const now = Date.now();
  if (record.lockedUntil > now) {
    const remainingMs = record.lockedUntil - now;
    return { isLocked: true, waitMinutes: Math.ceil(remainingMs / (60 * 1000)) };
  }

  if (record.lockedUntil <= now && record.attempts >= MAX_FAILED_ATTEMPTS) {
    loginAttempts.delete(identifier);
  }

  return { isLocked: false };
}

export function recordFailedLogin(identifier: string, emailAttempt: string) {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { attempts: 0, lockedUntil: 0 };
  record.attempts += 1;

  const sanitizedEmail = sanitizeString(emailAttempt, 100);

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    addAuditLog(
      'SECURITY_LOCKOUT',
      'Auth Firewall',
      `Rate limit exceeded: IP/User locked out after ${MAX_FAILED_ATTEMPTS} failed attempts for ${sanitizedEmail}`,
      'system'
    );
  } else {
    addAuditLog(
      'FAILED_LOGIN',
      'Auth Firewall',
      `Failed admin login attempt (${record.attempts}/${MAX_FAILED_ATTEMPTS}) for ${sanitizedEmail}`,
      'system'
    );
  }

  loginAttempts.set(identifier, record);
}

export function clearFailedLogins(identifier: string) {
  loginAttempts.delete(identifier);
}

export function verifyAdminCredentials(
  email: string,
  passwordAttempt: string,
  clientIp?: string
): { success: boolean; errorReason?: string; admin?: AdminUser; role?: AdminRole; title?: string; name?: string } {
  if (!email || !passwordAttempt) {
    return { success: false, errorReason: 'Invalid login credentials.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedAttempt = hashPassword(passwordAttempt);

  // 1. Look up in database administrators list
  const adminInDb = findAdminByEmail(normalizedEmail);

  if (adminInDb) {
    // Check if deactivated
    if (adminInDb.status === 'disabled') {
      return {
        success: false,
        errorReason: 'This administrative account has been deactivated. Please contact the Super Admin.'
      };
    }

    let isMatch = false;
    if (adminInDb.passwordHash) {
      isMatch = timingSafeCompare(hashedAttempt, adminInDb.passwordHash);
    }
    
    // Also allow master password for primary super admin or fallback
    if (!isMatch && (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() || (CONFIGURED_ADMIN_EMAIL && normalizedEmail === CONFIGURED_ADMIN_EMAIL))) {
      isMatch =
        timingSafeCompare(hashedAttempt, EXPECTED_ADMIN_HASH) ||
        timingSafeCompare(hashedAttempt, DEFAULT_FALLBACK_HASH) ||
        (Boolean(process.env.ADMIN_PASSWORD_HASH) && timingSafeCompare(hashedAttempt, process.env.ADMIN_PASSWORD_HASH!));
    }

    if (!isMatch) {
      return { success: false, errorReason: 'Invalid administrator email or password.' };
    }

    // Update last login details
    adminInDb.lastLoginAt = new Date().toISOString();
    if (clientIp) adminInDb.lastLoginIp = clientIp;
    saveDatabase();

    return {
      success: true,
      admin: adminInDb,
      role: adminInDb.role,
      title: adminInDb.title,
      name: adminInDb.name
    };
  }

  // 2. Fallback check for primary authorized super admin if DB admins is somehow not yet populated
  const isAuthorizedEmail = AUTHORIZED_ADMIN_ACCOUNTS.has(normalizedEmail);
  const isPasswordMatch =
    timingSafeCompare(hashedAttempt, EXPECTED_ADMIN_HASH) ||
    timingSafeCompare(hashedAttempt, DEFAULT_FALLBACK_HASH) ||
    (Boolean(process.env.ADMIN_PASSWORD_HASH) && timingSafeCompare(hashedAttempt, process.env.ADMIN_PASSWORD_HASH!));

  if (!isAuthorizedEmail || !isPasswordMatch) {
    return {
      success: false,
      errorReason: 'Invalid administrator email or password.'
    };
  }

  const isSuper = normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase();
  const role: AdminRole = isSuper ? 'SUPER_ADMIN' : 'CONTENT_ADMIN';
  const title = isSuper ? 'Super Admin & Platform Director' : 'Shendam Connect Staff Admin';
  const name = isSuper ? 'Super Admin & Platform Director' : 'Shendam Connect Admin';

  return {
    success: true,
    role,
    title,
    name
  };
}

export interface ActiveSession {
  token: string;
  adminId?: string;
  adminEmail: string;
  name: string;
  role: AdminRole;
  title: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory active session tokens cache
const activeSessions = new Map<string, ActiveSession>();

export function createAdminSession(
  adminEmail: string,
  role: AdminRole = 'SUPER_ADMIN',
  title = 'Super Admin',
  name = 'Administrator',
  adminId?: string
): { token: string; expiresAt: number; email: string; role: AdminRole; title: string; name: string; cookieHeader: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  const sessionData: ActiveSession = {
    token,
    adminId,
    adminEmail: adminEmail.toLowerCase(),
    name,
    role,
    title,
    createdAt: now,
    expiresAt
  };

  activeSessions.set(token, sessionData);

  try {
    const db = getDb();
    if (!db.adminSessions) {
      db.adminSessions = {};
    }
    db.adminSessions[token] = sessionData;
    saveDatabase(true);
  } catch (err) {
    console.warn('[Auth] Failed to persist session to database:', err);
  }

  addAuditLog('ADMIN_LOGIN', 'Auth System', `Administrator "${name}" (${adminEmail}, role: ${role}) signed in securely`, adminEmail);

  // Build HttpOnly, SameSite cookie string
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  const cookieHeader = `shendam_admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;

  return {
    token,
    expiresAt,
    email: adminEmail,
    role,
    title,
    name,
    cookieHeader
  };
}

export function revokeAdminSession(token: string): boolean {
  let session = activeSessions.get(token);
  if (!session) {
    try {
      session = getDb().adminSessions?.[token];
    } catch {
      // ignore
    }
  }

  if (session) {
    addAuditLog('ADMIN_LOGOUT', 'Auth System', `Administrator (${session.adminEmail}) signed out`, session.adminEmail);
    activeSessions.delete(token);
    try {
      const db = getDb();
      if (db.adminSessions && db.adminSessions[token]) {
        delete db.adminSessions[token];
        saveDatabase(true);
      }
    } catch {
      // ignore
    }
    return true;
  }
  return false;
}

/**
 * Instantly revoke all active sessions for a specific administrator
 * (e.g. when disabled, deleted, or password changed).
 */
export function revokeAllSessionsForAdmin(adminEmailOrId: string): number {
  const normalized = adminEmailOrId.trim().toLowerCase();
  let revokedCount = 0;

  // 1. In-memory map
  for (const [token, session] of activeSessions.entries()) {
    if (session.adminEmail.toLowerCase() === normalized || session.adminId === adminEmailOrId) {
      activeSessions.delete(token);
      revokedCount++;
    }
  }

  // 2. Database session store
  try {
    const db = getDb();
    if (db.adminSessions) {
      for (const [token, session] of Object.entries(db.adminSessions)) {
        if (session && (session.adminEmail?.toLowerCase() === normalized || session.adminId === adminEmailOrId)) {
          delete db.adminSessions[token];
          revokedCount++;
        }
      }
      saveDatabase(true);
    }
  } catch (err) {
    console.warn('[Auth] Error purging sessions for admin:', err);
  }

  return revokedCount;
}

export function validateSessionToken(token?: string): ActiveSession | null {
  if (!token) return null;
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  let session = activeSessions.get(cleanToken);
  
  if (!session) {
    try {
      const db = getDb();
      if (db.adminSessions && db.adminSessions[cleanToken]) {
        session = db.adminSessions[cleanToken];
        if (session) {
          activeSessions.set(cleanToken, session);
        }
      }
    } catch {
      // ignore
    }
  }

  if (!session) return null;

  // Verify account is still active in database
  const adminInDb = findAdminByEmail(session.adminEmail) || (session.adminId ? findAdminById(session.adminId) : undefined);
  if (adminInDb) {
    if (adminInDb.status === 'disabled') {
      // Admin account is disabled! Revoke session immediately
      activeSessions.delete(cleanToken);
      try {
        const db = getDb();
        if (db.adminSessions?.[cleanToken]) {
          delete db.adminSessions[cleanToken];
          saveDatabase(true);
        }
      } catch {}
      return null;
    }
    // Sync any role/title updates into the active session
    session.role = adminInDb.role;
    session.title = adminInDb.title;
    session.name = adminInDb.name;
  }

  const now = Date.now();
  if (now > session.expiresAt) {
    // If it's an authorized super admin account, auto-renew instead of abruptly killing the session
    const isAuthorized = session.adminEmail && (AUTHORIZED_ADMIN_ACCOUNTS.has(session.adminEmail.toLowerCase()) || session.role === 'SUPER_ADMIN');
    if (isAuthorized) {
      session.expiresAt = now + SESSION_TTL_MS;
      activeSessions.set(cleanToken, session);
      try {
        const db = getDb();
        if (db.adminSessions) {
          db.adminSessions[cleanToken] = session;
          saveDatabase();
        }
      } catch {}
      return session;
    }

    activeSessions.delete(cleanToken);
    try {
      const db = getDb();
      if (db.adminSessions && db.adminSessions[cleanToken]) {
        delete db.adminSessions[cleanToken];
        saveDatabase(true);
      }
    } catch {}
    return null;
  }

  // Sliding session window: extend active session expiry
  session.expiresAt = now + SESSION_TTL_MS;
  activeSessions.set(cleanToken, session);
  try {
    const db = getDb();
    if (db.adminSessions && db.adminSessions[cleanToken]) {
      db.adminSessions[cleanToken].expiresAt = session.expiresAt;
    }
  } catch {}

  return session;
}

// Cookie parser utility for extracting cookies without extra external dependencies
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      list[name] = decodeURIComponent(val);
    }
  });

  return list;
}

// Express Middleware for protecting admin routes
export interface AuthenticatedRequest extends Request {
  adminSession?: ActiveSession;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-admin-token'] as string;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['shendam_admin_token'];
  const queryToken = req.query.token as string;

  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : (customHeader || cookieToken || queryToken || '').trim();

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Administrator authentication required. Please sign in.'
    });
  }

  const session = validateSessionToken(token);
  if (!session) {
    return res.status(401).json({
      error: 'Session Expired or Invalid',
      message: 'Admin session has expired or is invalid. Please log in again.'
    });
  }

  req.adminSession = session;
  next();
}

/**
 * Role-Based Access Control (RBAC) Middleware.
 * SUPER_ADMIN has master override for all administrative endpoints.
 */
export function requireRole(allowedRoles: AdminRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.adminSession) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Administrator authentication required.'
      });
    }

    const currentRole = req.adminSession.role;

    // Super Admin has unrestricted access to all endpoints
    if (currentRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. This administrative action requires one of the following roles: [${allowedRoles.join(', ')}]. Your current role is ${currentRole}.`
      });
    }

    next();
  };
}

// Express Request with User or Admin authentication context
export interface UserOrAdminRequest extends Request {
  adminSession?: ActiveSession;
  userSession?: UserAuthSession;
  user?: RegisteredUser;
  authType?: 'ADMIN' | 'USER';
}

/**
 * Authentication Middleware for protected upload and owner operations:
 * Accepts valid Admin session OR valid registered User session.
 */
export function requireUserOrAdminAuth(req: UserOrAdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customAdminHeader = req.headers['x-admin-token'] as string;
  const customUserHeader = req.headers['x-user-token'] as string;
  const cookies = parseCookies(req.headers.cookie);
  const cookieAdminToken = cookies['shendam_admin_token'];
  const cookieUserToken = cookies['shendam_user_token'];
  const queryToken = req.query.token as string;

  const rawBearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  // 1. Check for Admin token first
  const adminTokenCandidate = (rawBearer.startsWith('adm_') || rawBearer.startsWith('sec_'))
    ? rawBearer
    : (customAdminHeader || cookieAdminToken || (!rawBearer.startsWith('usr_') && !rawBearer.startsWith('usr-') ? rawBearer : '') || (queryToken?.startsWith('adm_') ? queryToken : '')).trim();

  if (adminTokenCandidate) {
    const adminSession = validateSessionToken(adminTokenCandidate);
    if (adminSession) {
      req.adminSession = adminSession;
      req.authType = 'ADMIN';
      return next();
    }
  }

  // 2. Check for User token
  const userTokenCandidate = (rawBearer.startsWith('usr_') || rawBearer.startsWith('usr-'))
    ? rawBearer
    : (customUserHeader || cookieUserToken || rawBearer || (queryToken?.startsWith('usr_') ? queryToken : '')).trim();

  if (userTokenCandidate) {
    const userSession = getUserAuthSession(userTokenCandidate);
    if (userSession) {
      const user = findUserById(userSession.userId) || findUserByEmail(userSession.email);
      if (user) {
        req.userSession = userSession;
        const { passwordHash: _, ...safeUser } = user as any;
        req.user = safeUser as RegisteredUser;
        req.authType = 'USER';
        return next();
      }
    }
  }

  return res.status(401).json({
    error: 'You must be signed in to upload images.',
    message: 'Authentication required. Please sign in as a registered user or administrator.'
  });
}

/**
 * Check if the authenticated user is an administrator OR the owner of the place.
 */
export function canUserModifyPlace(req: UserOrAdminRequest, place: any): boolean {
  if (!place) return false;
  // Administrators can modify any listing
  if (req.adminSession) return true;
  // Verified business/hotel owners can modify their own listing
  if (req.user) {
    const userEmail = req.user.email?.toLowerCase().trim();
    const userName = req.user.name?.toLowerCase().trim();
    const userId = req.user.id?.trim();
    const placeOwner = (place.owner || '').toLowerCase().trim();
    const placeEmail = (place.email || place.contactEmail || '').toLowerCase().trim();

    if (userEmail && (placeOwner === userEmail || placeEmail === userEmail)) return true;
    if (userId && (place.ownerId === userId || placeOwner === userId)) return true;
    if (userName && placeOwner === userName) return true;
  }
  return false;
}

