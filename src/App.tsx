/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Place, CategoryId, TabId, PlaceReview, NotificationItem, ShendamEvent } from './types';
import { HERO_SLIDES, POPULAR_PLACES, NOTIFICATIONS, SHENDAM_EVENTS } from './data/mockData';
import headerBg from './assets/images/shendam_network_lattice_exact_1787310319283.jpg';
import { cachePlacesLocally } from './utils/offlineCache';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
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

// Code-split heavy views and modals for sub-3s TTI and high concurrency performance
const MapView = React.lazy(() => import('./components/MapView').then((m) => ({ default: m.MapView })));
const PlaceDetailModal = React.lazy(() => import('./components/PlaceDetailModal').then((m) => ({ default: m.PlaceDetailModal })));
const ListBusinessModal = React.lazy(() => import('./components/ListBusinessModal').then((m) => ({ default: m.ListBusinessModal })));
const NotificationsModal = React.lazy(() => import('./components/NotificationsModal').then((m) => ({ default: m.NotificationsModal })));
const EventDetailModal = React.lazy(() => import('./components/EventDetailModal').then((m) => ({ default: m.EventDetailModal })));
const SideMenuDrawer = React.lazy(() => import('./components/SideMenuDrawer').then((m) => ({ default: m.SideMenuDrawer })));

export default function App() {
  // Places state with local storage persistence
  const [places, setPlaces] = useState<Place[]>(() => {
    const saved = localStorage.getItem('shendam_places_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return POPULAR_PLACES;
      }
    }
    return POPULAR_PLACES;
  });

  // Saved bookmark IDs
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('shendam_saved_ids_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ['place-1', 'place-3'];
      }
    }
    return ['place-1', 'place-3'];
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

  // Active state
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Modals state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ShendamEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Splash Screen state (1.2s snappy Facebook-style launch display)
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Sync to local storage & offline cache layer
  useEffect(() => {
    localStorage.setItem('shendam_places_v2', JSON.stringify(places));
    cachePlacesLocally(places, savedPlaceIds);
  }, [places, savedPlaceIds]);

  useEffect(() => {
    localStorage.setItem('shendam_saved_ids_v2', JSON.stringify(savedPlaceIds));
  }, [savedPlaceIds]);

  useEffect(() => {
    localStorage.setItem('shendam_notifs_v2', JSON.stringify(notifications));
  }, [notifications]);

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
    setActiveTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewPlace = (newPlace: Place) => {
    setPlaces((prev) => [newPlace, ...prev]);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `New Business Listed: ${newPlace.name}`,
      category: 'Business',
      time: 'Just now',
      content: `${newPlace.name} in ${newPlace.area} is now verified and available on Shendam Connect.`,
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleAddReview = (placeId: string, reviewData: Omit<PlaceReview, 'id' | 'date'>) => {
    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id === placeId) {
          const newReview: PlaceReview = {
            id: `rev-${Date.now()}`,
            ...reviewData,
            date: 'Today'
          };
          const updatedReviews = [newReview, ...(p.reviews || [])];
          const newAvgRating =
            updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;

          const updatedPlace: Place = {
            ...p,
            reviews: updatedReviews,
            reviewsCount: updatedReviews.length,
            rating: Number(newAvgRating.toFixed(1))
          };

          if (selectedPlace?.id === placeId) {
            setSelectedPlace(updatedPlace);
          }
          return updatedPlace;
        }
        return p;
      })
    );
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

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
              onSelectPlace={handleOpenPlace}
            />
          </div>
        </div>
        {/* [END OF BLUE GEOMETRIC HEADER] */}

        {/* MAIN BODY CONTENT (Deep Navy #020B18 Background) */}
        <main className="flex-1 w-full flex flex-col bg-[#020B18]">
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-150">
              {/* Weather Indicator */}
              <ShendamWeatherCard />

              {/* 3. QUICK CATEGORIES ROW 1 */}
              <CategoryButtonsRow1
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategoryFromHome}
              />

              {/* 5. HERO BANNER / CAROUSEL */}
              <HeroCarousel
                slides={HERO_SLIDES}
                onExplore={(target) => handleSelectCategoryFromHome(target || 'tourist_spots')}
              />

              {/* 6. POPULAR NEAR YOU */}
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
                events={SHENDAM_EVENTS}
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
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              savedPlaceIds={savedPlaceIds}
              onToggleSave={handleToggleSave}
              onSelectPlace={handleOpenPlace}
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

          {activeTab === 'profile' && (
            <ProfileView
              onOpenAddBusiness={() => setIsAddBusinessOpen(true)}
              savedCount={savedPlaceIds.length}
            />
          )}
        </main>

        {/* 9. BOTTOM NAVIGATION BAR */}
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
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
        />

        <ListBusinessModal
          isOpen={isAddBusinessOpen}
          onClose={() => setIsAddBusinessOpen(false)}
          onAddPlace={handleAddNewPlace}
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
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAddBusiness={() => setIsAddBusinessOpen(true)}
          savedCount={savedPlaceIds.length}
        />
      </Suspense>
    </div>
  </>
);
}
