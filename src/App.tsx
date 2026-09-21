/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Place, CategoryId, TabId, PlaceReview, NotificationItem, ShendamEvent, FeedbackType, Opportunity, PendingBusinessSubmission, HeroSlide } from './types';
import { HERO_SLIDES, NOTIFICATIONS, SHENDAM_EVENTS, INITIAL_PENDING_SUBMISSIONS } from './data/mockData';
import headerBg from './assets/images/shendam_network_lattice_exact_1787310319283.jpg';
import { cachePlacesLocally } from './utils/offlineCache';
import { initAnalyticsHeartbeat, trackPageView } from './utils/analytics';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { FestiveCelebrationBanner } from './components/FestiveCelebrationBanner';
import { ShendamWeatherCard } from './components/ShendamWeatherCard';
import { SearchBar } from './components/SearchBar';
import { CategoryButtonsRow1 } from './components/CategoryButtonsRow1';
import { HeroCarousel } from './components/HeroCarousel';
import { PopularNearYou } from './components/PopularNearYou';
import { ListBusinessBanner } from './components/ListBusinessBanner';
import { CategoriesRow2 } from './components/CategoriesRow2';
import { ExploreShendamSection } from './components/ExploreShendamSection';
import { UpcomingEventsSection } from './components/UpcomingEventsSection';
import { RecommendedSection } from './components/RecommendedSection';
import { BottomNavBar } from './components/BottomNavBar';
import { ExploreView } from './components/ExploreView';
import { SavedView } from './components/SavedView';
import { ProfileView } from './components/ProfileView';
import { JobsSection } from './components/JobsSection';
import { MapView } from './components/MapView';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { ListBusinessModal } from './components/ListBusinessModal';
import { NotificationsModal } from './components/NotificationsModal';
import { EventDetailModal } from './components/EventDetailModal';
import { SideMenuDrawer } from './components/SideMenuDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAcceptInvite } from './components/AdminPortal/AdminAcceptInvite';
import { BookingModal } from './components/BookingModal';
import { FeedbackModal } from './components/FeedbackModal';
import { StartupAdModal } from './components/ads/StartupAdModal';
import { LocalSponsoredAd } from './components/ads/LocalSponsoredAd';
import { GoogleAdMobNativeCard } from './components/ads/GoogleAdMobNativeCard';
import { UserAuthModal } from './components/UserAuthModal';

export default function App() {
  // Places state with local storage persistence (initialized from cache or empty until authoritative API loads)
  const [places, setPlaces] = useState<Place[]>(() => {
    const saved = localStorage.getItem('shendam_places_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: Place) => ({
            ...p,
            image: p.image && (p.image.includes('unsplash.com') || p.image.includes('/images/paul_gsm_')) ? '' : (p.image || ''),
            gallery: Array.isArray(p.gallery) ? p.gallery.filter((g: string) => g && !g.includes('unsplash.com') && !g.includes('/images/paul_gsm_')) : []
          }));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Events state with local storage persistence (initialized from cache or empty until authoritative API loads)
  const [events, setEvents] = useState<ShendamEvent[]>(() => {
    const saved = localStorage.getItem('shendam_events_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Opportunities state for search
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  useEffect(() => {
    fetch('/api/opportunities')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.opportunities) {
          setOpportunities(data.opportunities);
        }
      })
      .catch((err) => console.error('Failed to load opportunities:', err));
  }, []);

  // Hero slides state with local storage persistence
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    const saved = localStorage.getItem('shendam_hero_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: HeroSlide) => ({
            ...s,
            image: s.image && s.image.includes('unsplash.com') ? '' : (s.image || '')
          }));
        }
      } catch (e) {
        return HERO_SLIDES;
      }
    }
    return HERO_SLIDES;
  });

  // Fetch hero slides from server and listen for branding updates
  useEffect(() => {
    const fetchSlides = () => {
      fetch('/api/hero-slides')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.slides)) {
            setHeroSlides(data.slides);
            try {
              localStorage.setItem('shendam_hero_v2', JSON.stringify(data.slides));
            } catch {}
          }
        })
        .catch((err) => console.warn('Could not load hero slides from server:', err));
    };

    fetchSlides();
    window.addEventListener('sc-branding-updated', fetchSlides);
    return () => {
      window.removeEventListener('sc-branding-updated', fetchSlides);
    };
  }, []);

  // Pending Submissions queue state with local storage persistence
  const [pendingSubmissions, setPendingSubmissions] = useState(() => {
    const saved = localStorage.getItem('shendam_pending_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PENDING_SUBMISSIONS;
      }
    }
    return INITIAL_PENDING_SUBMISSIONS;
  });

  // Saved bookmark IDs
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('shendam_saved_ids_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('shendam_notifs_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return NOTIFICATIONS;
      }
    }
    return NOTIFICATIONS;
  });

  // Helper to determine initial tab from window.location.pathname
  const getInitialTabFromLocation = (): TabId => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin-dashboard' || path.startsWith('/admin/')) {
        return 'admin';
      }
      if (path === '/explore') return 'explore';
      if (path === '/map') return 'map';
      if (path === '/saved') return 'saved';
      if (path === '/profile' || path === '/culture') return 'profile';
    }
    return 'home';
  };

  // Active state
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTabFromLocation);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Sync activeTab with URL pathname and history popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin-dashboard' || path.startsWith('/admin/')) {
        setActiveTab('admin');
      } else if (path === '/explore') {
        setActiveTab('explore');
      } else if (path === '/map') {
        setActiveTab('map');
      } else if (path === '/saved') {
        setActiveTab('saved');
      } else if (path === '/profile' || path === '/culture') {
        setActiveTab('profile');
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL history when tab changes smoothly
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.history) {
      const targetPath = tab === 'home' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  // Memoized callback for places updates from Admin Dashboard
  const handlePlacesUpdated = useCallback((updatedPlaces: Place[]) => {
    setPlaces(updatedPlaces);
  }, []);

  // Modals state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ShendamEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [bookingPlace, setBookingPlace] = useState<Place | null>(null);
  const [bookingRoom, setBookingRoom] = useState<string | undefined>(undefined);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType>('feature_request');

  const handleOpenFeedback = (type: FeedbackType = 'feature_request') => {
    setFeedbackInitialType(type);
    setIsFeedbackModalOpen(true);
  };

  // Splash Screen state (2.5s launch display on app start)
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Telemetry Heartbeat & Pageview Tracker
  useEffect(() => {
    const cleanup = initAnalyticsHeartbeat(activeTab);
    trackPageView(activeTab);
    return () => {
      if (cleanup) cleanup();
    };
  }, [activeTab]);

  // Sync places, events, and notifications from authoritative backend API on mount
  useEffect(() => {
    fetch('/api/places')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.places && Array.isArray(data.places)) {
          const deletedIds: string[] = Array.isArray(data.deletedPlaceIds) ? data.deletedPlaceIds : [];
          const validPlaces = data.places.filter((p: Place) => !deletedIds.includes(p.id));
          setPlaces(validPlaces);
          if (deletedIds.length > 0) {
            setSavedPlaceIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
          }
        }
      })
      .catch(() => {});

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.events && Array.isArray(data.events)) {
          const deletedIds: string[] = Array.isArray(data.deletedEventIds) ? data.deletedEventIds : [];
          const validEvents = data.events.filter((e: ShendamEvent) => !deletedIds.includes(e.id));
          setEvents(validEvents);
        }
      })
      .catch(() => {});

    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      })
      .catch(() => {});
  }, []);

  // Sync to local storage & offline cache layer safely
  useEffect(() => {
    try {
      const sanitizedPlaces = places.map((p) => ({
        ...p,
        image: p.image?.startsWith('data:') ? '' : p.image,
        logo: p.logo?.startsWith('data:') ? '' : p.logo,
        gallery: (p.gallery || []).filter((g) => !g.startsWith('data:'))
      }));
      localStorage.setItem('shendam_places_v2', JSON.stringify(sanitizedPlaces));
      cachePlacesLocally(sanitizedPlaces, savedPlaceIds);
    } catch (e) {
      console.warn('[Storage Warning] Quota exceeded for shendam_places_v2, skipped local storage update:', e);
    }
  }, [places, savedPlaceIds]);

  useEffect(() => {
    try {
      localStorage.setItem('shendam_saved_ids_v2', JSON.stringify(savedPlaceIds));
    } catch (e) {
      console.warn('[Storage Warning] Quota exceeded for shendam_saved_ids_v2:', e);
    }
  }, [savedPlaceIds]);

  useEffect(() => {
    try {
      localStorage.setItem('shendam_notifs_v2', JSON.stringify(notifications));
    } catch (e) {
      console.warn('[Storage Warning] Quota exceeded for shendam_notifs_v2:', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('shendam_events_v2', JSON.stringify(events));
    } catch (e) {
      console.warn('[Storage Warning] Quota exceeded for shendam_events_v2:', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('shendam_hero_v2', JSON.stringify(heroSlides));
    } catch (e) {
      console.warn('[Storage Warning] Quota exceeded for shendam_hero_v2:', e);
    }
  }, [heroSlides]);

  useEffect(() => {
    try {
      localStorage.setItem('shendam_pending_v2', JSON.stringify(pendingSubmissions));
    } catch (e) {
      console.warn('[Storage Warning] Quota exceeded for shendam_pending_v2:', e);
    }
  }, [pendingSubmissions]);

  const handleResetDefaults = () => {
    fetch('/api/places')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.places) {
          const deletedIds: string[] = Array.isArray(data.deletedPlaceIds) ? data.deletedPlaceIds : [];
          setPlaces(data.places.filter((p: Place) => !deletedIds.includes(p.id)));
        }
      })
      .catch(() => {});
    setEvents(SHENDAM_EVENTS);
    setHeroSlides(HERO_SLIDES);
    setNotifications(NOTIFICATIONS);
    setPendingSubmissions(INITIAL_PENDING_SUBMISSIONS);
    localStorage.removeItem('shendam_places_v2');
    localStorage.removeItem('shendam_events_v2');
    localStorage.removeItem('shendam_hero_v2');
    localStorage.removeItem('shendam_notifs_v2');
    localStorage.removeItem('shendam_pending_v2');
  };

  // Handlers
  const handleToggleSave = (placeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedPlaceIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId]
    );
  };

  const handleOpenPlace = (place: Place) => {
    setSelectedPlace(place);
    setIsPlaceModalOpen(true);
  };

  const handleOpenEvent = (event: ShendamEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSelectCategoryFromHome = (cat: CategoryId | 'more' | 'all') => {
    if (cat === 'more') {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(cat);
    }
    handleTabChange('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmissionSuccess = (submission: PendingBusinessSubmission) => {
    setPendingSubmissions((prev) => [submission, ...prev]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Listing Submitted: ${submission.businessName}`,
      category: 'Business',
      time: 'Just now',
      content: `Your proposal for ${submission.businessName} has been submitted (Ref: ${submission.id}). Status: PENDING ADMIN APPROVAL. Our team will verify your real photos before publishing to Shendam Connect.`,
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleAddReview = async (placeId: string, reviewData: Omit<PlaceReview, 'id' | 'date'>) => {
    try {
      const response = await fetch('/api/places/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          author: reviewData.author,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.updatedPlace) {
          setPlaces((prev) => prev.map((p) => (p.id === placeId ? data.updatedPlace : p)));
          if (selectedPlace?.id === placeId) {
            setSelectedPlace(data.updatedPlace);
          }
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Check for invitation token in URL query string or hash
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('invite_token') || urlParams.get('token');
      if (token) return token;

      if (window.location.hash.includes('token=')) {
        const hashParts = window.location.hash.split('?');
        if (hashParts[1]) {
          const hashParams = new URLSearchParams(hashParts[1]);
          return hashParams.get('token') || hashParams.get('invite_token');
        }
      }
    }
    return null;
  });

  if (inviteToken) {
    return (
      <AdminAcceptInvite
        token={inviteToken}
        onSuccess={(authToken) => {
          setInviteToken(null);
          handleTabChange('admin');
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState(null, '', '/admin');
          }
        }}
        onBackToApp={() => {
          setInviteToken(null);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState(null, '', '/');
          }
        }}
      />
    );
  }

  return (
    <>
      {/* 1. App Launch / Splash Screen (1.8s display, then smooth fade/scale into Home screen) */}
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="shendam-splash" />}
      </AnimatePresence>

      <div className="min-h-[100dvh] w-full bg-[#020B18] text-white flex flex-col selection:bg-[#FFC928] selection:text-[#061B3A]">
        {/* Mobile App Container - 100% viewport width, native mobile feel */}
        <div className="w-full min-h-[100dvh] flex flex-col relative pb-24 sm:pb-28 overflow-x-hidden">
        
        {/* [BLUE GEOMETRIC HEADER BACKGROUND] - Illuminated top fading downward into deep dark navy */}
        <div 
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))' }}
          className="relative w-full overflow-hidden shrink-0 pb-4 sm:pb-5 min-h-[300px] flex flex-col justify-between bg-gradient-to-b from-[#05234D] via-[#031836] to-[#020B18]"
        >
          {/* Subtle electric blue ambient glow (#0878D1, #0A5DB5) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-b from-[#0878D1]/30 to-transparent blur-2xl pointer-events-none z-0" />
          <div className="absolute top-4 right-0 w-48 h-48 bg-[#0A5DB5]/20 blur-3xl pointer-events-none z-0" />

          {/* Background image layer with geometric lattice asset */}
          <div
            className="absolute inset-0 pointer-events-none z-0 mix-blend-screen opacity-90"
            style={{
              backgroundImage: `url(${headerBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              backgroundRepeat: 'no-repeat',
              filter: 'brightness(1.0) contrast(1.2)'
            }}
          />

          {/* Multi-stop gradient overlay for smooth dark fade downward */}
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(3, 18, 42, 0.15) 0%, rgba(3, 18, 42, 0.30) 35%, rgba(2, 12, 29, 0.65) 70%, rgba(2, 11, 24, 0.98) 100%)'
            }}
          />

          {/* 1. HEADER (Hamburger, SHENDAM CONNECT Logo, Tagline, Notification) */}
          <div className="relative z-20">
            <Header
              onOpenMenu={() => setIsSideMenuOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              unreadCount={unreadNotifCount}
            />
          </div>

          {/* 2. SEARCH BAR inside the Blue Geometric Header */}
          <div className="relative z-20">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
              }}
              places={places}
              events={events}
              opportunities={opportunities}
              onSelectPlace={handleOpenPlace}
              onSelectEvent={handleOpenEvent}
              onSelectOpportunity={(opp) => {
                handleTabChange('jobs');
              }}
              onSubmitSearch={() => {
                handleTabChange('explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
        {/* [END OF BLUE GEOMETRIC HEADER] */}

        {/* MAIN BODY CONTENT (Deep Navy #020B18 Background) */}
        <main className="flex-1 w-full min-w-0 overflow-x-hidden flex flex-col bg-[#020B18]">
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-150">
              {/* Weather Indicator */}
              <ShendamWeatherCard />

              {/* Festive / Seasonal Theme Banner (Shown during active festive campaigns) */}
              <FestiveCelebrationBanner />

              {/* 3. QUICK CATEGORIES ROW 1 */}
              <CategoryButtonsRow1
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategoryFromHome}
              />

              {/* 4. GOOGLE ADMOB NATIVE ADVANCED AD (In Hero Position with Hero Fallback) */}
              <GoogleAdMobNativeCard
                placement="home"
                fallback={
                  <HeroCarousel
                    slides={heroSlides}
                    onExplore={(target) => handleSelectCategoryFromHome(target || 'tourist_spots')}
                  />
                }
              />

              {/* 5. POPULAR NEAR YOU */}
              <PopularNearYou
                places={places}
                savedPlaceIds={savedPlaceIds}
                onToggleSave={handleToggleSave}
                onSelectPlace={handleOpenPlace}
                onSeeAll={() => {
                  setSelectedCategory('all');
                  setActiveTab('explore');
                }}
              />

              {/* Promoted / Local Sponsored Ads (Admin Controlled - Separate from Google AdMob) */}
              <div className="px-4 py-2">
                <LocalSponsoredAd
                  placement="homepage_banner"
                  variant="banner"
                  onSelectPlace={(placeId) => {
                    const p = places.find((item) => item.id === placeId);
                    if (p) handleOpenPlace(p);
                  }}
                />
              </div>

              {/* 7. LIST YOUR BUSINESS BANNER */}
              <ListBusinessBanner
                onOpenAddBusiness={() => setIsAddBusinessOpen(true)}
              />

              {/* 8. CATEGORIES ROW 2 (Transport, Events, Shopping, Services, Health, Emergency) */}
              <CategoriesRow2
                onSelectCategory={handleSelectCategoryFromHome}
              />

              {/* 9. EXPLORE SHENDAM (Attractions, Places to Stay, Local Food, Culture) */}
              <ExploreShendamSection
                onSelectCategory={(cat, q) => {
                  if (q) setSearchQuery(q);
                  handleSelectCategoryFromHome(cat);
                }}
              />

              {/* 10. UPCOMING EVENTS (Horizontally Scrollable) */}
              <UpcomingEventsSection
                events={events}
                onSelectEvent={handleOpenEvent}
                onSeeAllEvents={() => handleSelectCategoryFromHome('events')}
              />

              {/* 11. RECOMMENDED FOR YOU (Curated Stays, Food, Attractions) */}
              <RecommendedSection
                places={places}
                savedPlaceIds={savedPlaceIds}
                onToggleSave={handleToggleSave}
                onSelectPlace={handleOpenPlace}
                onSeeAll={() => {
                  setSelectedCategory('all');
                  setActiveTab('explore');
                }}
              />
            </div>
          )}

          {activeTab === 'explore' && (
            <ExploreView
              places={places}
              events={events}
              opportunities={opportunities}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              savedPlaceIds={savedPlaceIds}
              onToggleSave={handleToggleSave}
              onSelectPlace={handleOpenPlace}
              onSelectEvent={handleOpenEvent}
              onSelectOpportunity={(opp) => {
                setActiveTab('jobs');
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {activeTab === 'map' && (
            <Suspense fallback={
              <div className="w-full h-80 flex items-center justify-center text-white/70 text-sm font-semibold">
                Loading Map...
              </div>
            }>
              <MapView
                places={places}
                onSelectPlace={handleOpenPlace}
                selectedPlace={selectedPlace}
                savedPlaceIds={savedPlaceIds}
                onToggleSave={handleToggleSave}
              />
            </Suspense>
          )}

          {activeTab === 'saved' && (
            <SavedView
              places={places}
              savedPlaceIds={savedPlaceIds}
              onToggleSave={(id) => handleToggleSave(id)}
              onSelectPlace={handleOpenPlace}
              onExploreMore={() => {
                setSelectedCategory('all');
                setActiveTab('explore');
              }}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsSection />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              onOpenAddBusiness={() => setIsAddBusinessOpen(true)}
              onOpenFeedback={handleOpenFeedback}
              savedCount={savedPlaceIds.length}
              onOpenAdmin={() => handleTabChange('admin')}
            />
          )}

          <div className={activeTab === 'admin' ? 'block animate-in fade-in duration-200' : 'hidden'}>
            <Suspense fallback={
              <div className="w-full h-80 flex items-center justify-center text-white/70 text-sm font-semibold">
                Loading Admin Portal...
              </div>
            }>
              <AdminDashboard
                isOpen={activeTab === 'admin'}
                onClose={() => handleTabChange('home')}
                onPlacesUpdated={handlePlacesUpdated}
              />
            </Suspense>
          </div>
        </main>

        {/* 9. BOTTOM NAVIGATION BAR */}
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            handleTabChange(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          savedCount={savedPlaceIds.length}
        />
      </div>

      {/* MODALS & DRAWERS (Lazy Loaded with Suspense) */}
      <Suspense fallback={null}>
        <PlaceDetailModal
          place={selectedPlace}
          isOpen={isPlaceModalOpen}
          onClose={() => setIsPlaceModalOpen(false)}
          isSaved={selectedPlace ? savedPlaceIds.includes(selectedPlace.id) : false}
          onToggleSave={(id) => handleToggleSave(id)}
          onAddReview={handleAddReview}
          onViewOnMap={(p) => {
            setSelectedPlace(p);
            setActiveTab('map');
          }}
          onOpenBooking={(p, room) => {
            setIsPlaceModalOpen(false);
            setBookingPlace(p);
            setBookingRoom(room);
            setIsBookingModalOpen(true);
          }}
        />

        <BookingModal
          place={bookingPlace}
          initialRoomType={bookingRoom}
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingRoom(undefined);
          }}
          onBookingSuccess={(b) => {
            const newNotif: NotificationItem = {
              id: `notif-book-${Date.now()}`,
              title: `Reservation Submitted: ${b.placeName}`,
              category: 'Booking',
              time: 'Just now',
              content: `Your booking ref ${b.id} for ${b.roomOrServiceType} at ${b.placeName} has been received.`,
              read: false
            };
            setNotifications((prev) => [newNotif, ...prev]);
          }}
        />

        <ListBusinessModal
          isOpen={isAddBusinessOpen}
          onClose={() => setIsAddBusinessOpen(false)}
          onSubmissionSuccess={handleSubmissionSuccess}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllNotifsRead}
        />

        <EventDetailModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
        />

        <SideMenuDrawer
          isOpen={isSideMenuOpen}
          onClose={() => setIsSideMenuOpen(false)}
          onSelectTab={(tab) => {
            handleTabChange(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAddBusiness={() => setIsAddBusinessOpen(true)}
          onOpenFeedback={handleOpenFeedback}
          savedCount={savedPlaceIds.length}
        />

        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          initialType={feedbackInitialType}
        />

        {/* Startup Promotional Ad Modal (Frequency controlled, admin managed) */}
        <StartupAdModal
          onSelectPlace={(placeId) => {
            const p = places.find((item) => item.id === placeId);
            if (p) handleOpenPlace(p);
          }}
        />

        {/* Resident / User Authentication & Email Verification Modal */}
        <UserAuthModal />
      </Suspense>
    </div>
  </>
);
}
