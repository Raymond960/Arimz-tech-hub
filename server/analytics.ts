import { getDb, saveDatabase } from './db';
import { AnalyticsEventRecord, UserSessionRecord } from '../src/types';
import crypto from 'crypto';

const ACTIVE_TIMEOUT_MS = parseInt(process.env.ACTIVE_USER_TIMEOUT_MS || '90000', 10); // 90 seconds

export function recordHeartbeat(data: {
  sessionId: string;
  currentPage: string;
  deviceCategory?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
}) {
  const db = getDb();
  const now = Date.now();
  const sessionId = data.sessionId || `anon-${crypto.randomBytes(6).toString('hex')}`;

  const existing = db.sessions[sessionId];
  if (existing) {
    existing.lastSeen = now;
    existing.currentPage = data.currentPage || existing.currentPage;
    if (data.deviceCategory) existing.deviceCategory = data.deviceCategory;
    if (data.browser) existing.browser = data.browser;
    existing.isActive = true;
  } else {
    db.sessions[sessionId] = {
      sessionId,
      firstSeen: now,
      lastSeen: now,
      currentPage: data.currentPage || '/',
      deviceCategory: data.deviceCategory || 'mobile',
      browser: data.browser || 'Browser',
      eventCount: 1,
      pageViewsCount: 1,
      isActive: true
    };
  }

  saveDatabase();
  return { sessionId, activeUsersCount: getActiveUsersCount() };
}

export function recordEvent(eventData: {
  sessionId: string;
  eventType: AnalyticsEventRecord['eventType'];
  entityId?: string;
  entityTitle?: string;
  category?: AnalyticsEventRecord['category'];
  page?: string;
  deviceCategory?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
}) {
  const db = getDb();
  const now = Date.now();
  const sessionId = eventData.sessionId || `anon-${crypto.randomBytes(6).toString('hex')}`;

  const record: AnalyticsEventRecord = {
    id: `ev-${now}-${crypto.randomBytes(3).toString('hex')}`,
    sessionId,
    eventType: eventData.eventType,
    entityId: eventData.entityId,
    entityTitle: eventData.entityTitle,
    category: eventData.category,
    page: eventData.page || '/',
    deviceCategory: eventData.deviceCategory || 'mobile',
    browser: eventData.browser || 'Unknown',
    timestamp: now,
    dateStr: new Date(now).toISOString()
  };

  db.analyticsEvents.push(record);

  // Update session counters
  const session = db.sessions[sessionId];
  if (session) {
    session.lastSeen = now;
    session.eventCount = (session.eventCount || 0) + 1;
    if (eventData.eventType === 'page_viewed' || eventData.eventType === 'app_opened') {
      session.pageViewsCount = (session.pageViewsCount || 0) + 1;
    }
  } else {
    db.sessions[sessionId] = {
      sessionId,
      firstSeen: now,
      lastSeen: now,
      currentPage: eventData.page || '/',
      deviceCategory: eventData.deviceCategory || 'mobile',
      browser: eventData.browser || 'Browser',
      eventCount: 1,
      pageViewsCount: 1,
      isActive: true
    };
  }

  saveDatabase();
  return record;
}

export function getActiveUsersCount(): number {
  const db = getDb();
  const now = Date.now();
  const threshold = now - ACTIVE_TIMEOUT_MS;

  let activeCount = 0;
  for (const sess of Object.values(db.sessions)) {
    if (sess.lastSeen >= threshold) {
      sess.isActive = true;
      activeCount++;
    } else {
      sess.isActive = false;
    }
  }

  return activeCount;
}

export function getLiveUsersList() {
  const db = getDb();
  const now = Date.now();
  const threshold = now - ACTIVE_TIMEOUT_MS;

  const liveSessions: Array<{
    sessionId: string;
    lastSeenAgoSec: number;
    currentPage: string;
    deviceCategory: string;
    browser: string;
    eventsCount: number;
  }> = [];

  for (const sess of Object.values(db.sessions)) {
    if (sess.lastSeen >= threshold) {
      liveSessions.push({
        sessionId: sess.sessionId.slice(0, 12) + '...',
        lastSeenAgoSec: Math.floor((now - sess.lastSeen) / 1000),
        currentPage: sess.currentPage,
        deviceCategory: sess.deviceCategory,
        browser: sess.browser,
        eventsCount: sess.eventCount
      });
    }
  }

  return {
    count: liveSessions.length,
    sessions: liveSessions.sort((a, b) => a.lastSeenAgoSec - b.lastSeenAgoSec)
  };
}

export function getAnalyticsSummary() {
  const db = getDb();
  const now = Date.now();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekMs = startOfWeek.getTime();

  const startOfMonth = new Date();
  startOfMonth.setDate(startOfMonth.getDate() - 30);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfMonthMs = startOfMonth.getTime();

  // Calculate unique sessions
  const allSessions = Object.values(db.sessions);
  const totalVisitors = allSessions.length;
  const visitorsToday = allSessions.filter((s) => s.lastSeen >= startOfTodayMs).length;
  const visitorsWeek = allSessions.filter((s) => s.lastSeen >= startOfWeekMs).length;
  const visitorsMonth = allSessions.filter((s) => s.lastSeen >= startOfMonthMs).length;

  // Counts from events
  const events = db.analyticsEvents || [];
  let totalPageViews = 0;
  let todayPageViews = 0;
  let todayHotelViews = 0;
  let todayBusinessViews = 0;
  let todayAttractionViews = 0;
  let todayBookingEvents = 0;

  const hotelViewCounts: Record<string, { title: string; count: number }> = {};
  const businessViewCounts: Record<string, { title: string; count: number }> = {};
  const attractionViewCounts: Record<string, { title: string; count: number }> = {};

  for (const ev of events) {
    if (ev.eventType === 'page_viewed' || ev.eventType === 'app_opened') {
      totalPageViews++;
      if (ev.timestamp >= startOfTodayMs) todayPageViews++;
    }

    if (ev.eventType === 'hotel_viewed') {
      if (ev.timestamp >= startOfTodayMs) todayHotelViews++;
      const key = ev.entityId || ev.entityTitle || 'Hotel';
      if (!hotelViewCounts[key]) hotelViewCounts[key] = { title: ev.entityTitle || key, count: 0 };
      hotelViewCounts[key].count++;
    }

    if (ev.eventType === 'business_viewed') {
      if (ev.timestamp >= startOfTodayMs) todayBusinessViews++;
      const key = ev.entityId || ev.entityTitle || 'Business';
      if (!businessViewCounts[key]) businessViewCounts[key] = { title: ev.entityTitle || key, count: 0 };
      businessViewCounts[key].count++;
    }

    if (ev.eventType === 'attraction_viewed') {
      if (ev.timestamp >= startOfTodayMs) todayAttractionViews++;
      const key = ev.entityId || ev.entityTitle || 'Attraction';
      if (!attractionViewCounts[key]) attractionViewCounts[key] = { title: ev.entityTitle || key, count: 0 };
      attractionViewCounts[key].count++;
    }

    if (ev.eventType.startsWith('booking_')) {
      if (ev.timestamp >= startOfTodayMs) todayBookingEvents++;
    }
  }

  // Use actual counts, no high fallback numbers!
  const popularHotels = Object.values(hotelViewCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  const popularBusinesses = Object.values(businessViewCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  const popularAttractions = Object.values(attractionViewCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // Timeline points for last 7 days - strictly based on real data
  const last7Days: Array<{ date: string; visitors: number; pageViews: number }> = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayLabel = daysOfWeek[d.getDay()];
    // Calculate actual for this day
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const dayVis = allSessions.filter((s) => s.lastSeen >= dayStart.getTime() && s.lastSeen <= dayEnd.getTime()).length;
    const dayPV = events.filter((e) => e.timestamp >= dayStart.getTime() && e.timestamp <= dayEnd.getTime()).length;

    last7Days.push({
      date: dayLabel,
      visitors: dayVis,
      pageViews: dayPV
    });
  }

  // Device Breakdown
  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;
  for (const s of allSessions) {
    if (s.deviceCategory === 'mobile') mobileCount++;
    else if (s.deviceCategory === 'tablet') tabletCount++;
    else desktopCount++;
  }

  return {
    overview: {
      totalVisitors: totalVisitors,
      activeUsersNow: getActiveUsersCount(),
      visitorsToday: visitorsToday,
      visitorsThisWeek: visitorsWeek,
      visitorsThisMonth: visitorsMonth,
      totalPageViews: totalPageViews,
      totalHotels: db.places.filter((p) => p.category === 'hotels').length,
      totalBusinesses: db.places.filter((p) => p.category !== 'hotels' && p.category !== 'tourist_spots').length,
      totalAttractions: db.places.filter((p) => p.category === 'tourist_spots').length,
      totalBookings: db.bookings.length,
      pendingBookings: db.bookings.filter((b) => b.status === 'pending').length
    },
    today: {
      visitors: visitorsToday,
      pageViews: todayPageViews,
      hotelViews: todayHotelViews,
      businessViews: todayBusinessViews,
      attractionViews: todayAttractionViews,
      bookingActivity: todayBookingEvents
    },
    charts: {
      last7Days,
      popularHotels,
      popularBusinesses,
      popularAttractions,
      deviceBreakdown: {
        mobile: mobileCount,
        desktop: desktopCount,
        tablet: tabletCount
      }
    }
  };
}
