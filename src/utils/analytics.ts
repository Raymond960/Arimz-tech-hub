import { AnalyticsEventType, CategoryId } from '../types';

const SESSION_KEY = 'shendam_anon_session_id';

export function getAnonymousSessionId(): string {
  let sess = sessionStorage.getItem(SESSION_KEY);
  if (!sess) {
    sess = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sess);
  }
  return sess;
}

export function getDeviceCategory(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  return 'Mobile Browser';
}

// Track an Analytics Event to backend
export async function trackEvent(
  eventType: AnalyticsEventType,
  data?: {
    entityId?: string;
    entityTitle?: string;
    category?: CategoryId;
    page?: string;
  }
) {
  try {
    const payload = {
      sessionId: getAnonymousSessionId(),
      eventType,
      entityId: data?.entityId,
      entityTitle: data?.entityTitle,
      category: data?.category,
      page: data?.page || (typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/'),
      deviceCategory: getDeviceCategory(),
      browser: getBrowserName()
    };

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Graceful offline fallback
    });
  } catch (err) {
    // Ignore offline errors
  }
}

// Track a pageview event
export function trackPageView(pageName: string) {
  trackEvent('page_viewed', { page: pageName });
}

// Initialize Active User Heartbeat system (runs every 30s)
export function initAnalyticsHeartbeat(currentRoute: string | (() => string)) {
  if (typeof window === 'undefined') return () => {};

  const getRoute = typeof currentRoute === 'function' ? currentRoute : () => currentRoute;

  const sendHeartbeat = () => {
    try {
      fetch('/api/analytics/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getAnonymousSessionId(),
          currentPage: getRoute(),
          deviceCategory: getDeviceCategory(),
          browser: getBrowserName()
        })
      }).catch(() => {});
    } catch (e) {}
  };

  // Immediate first heartbeat
  sendHeartbeat();

  // Periodic heartbeat every 30 seconds
  const intervalId = setInterval(sendHeartbeat, 30000);

  // Resume immediately when page becomes visible
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
