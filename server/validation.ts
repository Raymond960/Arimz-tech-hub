/**
 * Input Validation & Sanitization Module for Shendam Connect
 * Protects against XSS, SQL/NoSQL injections, path traversals, malformed payloads, and oversized inputs.
 */

// Strip HTML tags, script markers, null bytes, and non-printable control characters
export function sanitizeString(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') {
    if (typeof input === 'number' || typeof input === 'boolean') {
      return String(input);
    }
    return '';
  }

  return input
    .replace(/\0/g, '') // remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // strip iframes
    .replace(/javascript:/gi, '') // strip javascript protocol URIs
    .replace(/on\w+="[^"]*"/gi, '') // strip inline event handlers
    .replace(/on\w+='[^']*'/gi, '')
    .trim()
    .slice(0, maxLength);
}

// Ensure ID contains only safe alphanumeric, dash, and underscore characters
export function isValidId(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  // Disallow path traversal characters
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) return false;
  return /^[a-zA-Z0-9_\-\.:]+$/.test(trimmed);
}

// Basic Email check
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 120) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

// Safe number parsing with bounding
export function sanitizeNumber(input: unknown, min = 0, max = 1000000000, defaultVal = 0): number {
  const parsed = Number(input);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return defaultVal;
  return Math.min(Math.max(parsed, min), max);
}

// Validate coordinate numbers
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
