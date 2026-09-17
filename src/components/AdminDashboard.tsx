import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Place,
  Booking,
  PendingBusinessSubmission,
  AuditLogRecord,
  AdminSettings,
  AdminNotification,
  UserSessionRecord,
  AdminSectionId,
  AdminRole,
  CategoryId,
  FeedbackItem,
  FeedbackStatus,
  RevenueSummary,
  RevenueTransaction,
  Opportunity
} from '../types';
import { AdminHeader } from './AdminPortal/AdminHeader';
import { AdminSidebar } from './AdminPortal/AdminSidebar';
import { AdminLogin } from './AdminPortal/AdminLogin';
import { AdminOverview } from './AdminPortal/AdminOverview';
import { AdminRevenue } from './AdminPortal/AdminRevenue';
import { AdminAnalytics } from './AdminPortal/AdminAnalytics';
import { AdminDirectoryCMS } from './AdminPortal/AdminDirectoryCMS';
import { AdminBookings } from './AdminPortal/AdminBookings';
import { AdminUsers } from './AdminPortal/AdminUsers';
import { AdminActivityLog } from './AdminPortal/AdminActivityLog';
import { AdminSettingsView } from './AdminPortal/AdminSettingsView';
import { AdminSubmissionsQueue } from './AdminPortal/AdminSubmissionsQueue';
import { AdminFeedbackQueue } from './AdminPortal/AdminFeedbackQueue';
import { AdminOpportunities } from './AdminPortal/AdminOpportunities';
import { AdminBrandingView } from './AdminPortal/AdminBrandingView';
import { AdminManagement } from './AdminPortal/AdminManagement';
import { AdminEvents } from './AdminPortal/AdminEvents';
import { AdminAdvertisements } from './AdminPortal/AdminAdvertisements';
import { AdminModalPlaceForm } from './AdminPortal/AdminModalPlaceForm';
import { AdminPlaceDetailModal } from './AdminPortal/AdminPlaceDetailModal';
import { AdminDeleteConfirmModal } from './AdminPortal/AdminDeleteConfirmModal';
import { AdminBroadcastModal } from './AdminPortal/AdminBroadcastModal';
import {
  INITIAL_BOOKINGS,
  INITIAL_PENDING_SUBMISSIONS,
  INITIAL_ADMIN_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FEEDBACK_QUEUE,
  INITIAL_REVENUE_DATA
} from '../data/mockData';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onPlacesUpdated?: (places: Place[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onPlacesUpdated
}) => {
  // Authentication State
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('shendam_admin_token') || localStorage.getItem('shendam_admin_token') || null;
  });
  const [adminUser, setAdminUser] = useState<{ email: string; role: AdminRole; title: string; name?: string } | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);

  // Navigation & UI State
  const [currentSection, setCurrentSection] = useState<AdminSectionId>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data State (Loaded exclusively from persistent storage API)
  const [places, setPlaces] = useState<Place[]>([]);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [submissions, setSubmissions] = useState<PendingBusinessSubmission[]>(INITIAL_PENDING_SUBMISSIONS);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(INITIAL_FEEDBACK_QUEUE);
  const [revenue, setRevenue] = useState<RevenueSummary>(INITIAL_REVENUE_DATA);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<AdminSettings>(INITIAL_ADMIN_SETTINGS);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(1);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Modal States
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [defaultPlaceCategory, setDefaultPlaceCategory] = useState<CategoryId>('hotels');
  
  // Detail Modal State
  const [selectedDetailPlace, setSelectedDetailPlace] = useState<Place | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingPlace, setIsDeletingPlace] = useState(false);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Verify Admin Session on Mount or token change
  useEffect(() => {
    if (!token) {
      setIsVerifyingAuth(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdminUser({
            email: data.email || 'domnanraymond9@gmail.com',
            role: data.role || 'SUPER_ADMIN',
            title: data.title || 'Super Admin & Platform Director',
            name: data.name || 'Administrator'
          });
        } else {
          sessionStorage.removeItem('shendam_admin_token');
          localStorage.removeItem('shendam_admin_token');
          setToken(null);
          setAdminUser(null);
        }
      } catch {
        sessionStorage.removeItem('shendam_admin_token');
        localStorage.removeItem('shendam_admin_token');
        setToken(null);
        setAdminUser(null);
      } finally {
        setIsVerifyingAuth(false);
      }
    };

    verify();
  }, [token]);

  const onPlacesUpdatedRef = useRef(onPlacesUpdated);
  useEffect(() => {
    onPlacesUpdatedRef.current = onPlacesUpdated;
  }, [onPlacesUpdated]);

  // 2. Fetch All Admin Data when authenticated
  const fetchAllData = useCallback(async () => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Places (Admin endpoint returns all places including drafts)
      const placesRes = await fetch('/api/admin/places', { headers });
      if (placesRes.ok) {
        const d = await placesRes.json();
        if (d.places) {
          const deletedIds: string[] = Array.isArray(d.deletedPlaceIds) ? d.deletedPlaceIds : [];
          const validPlaces = (d.places || []).filter((p: Place) => !deletedIds.includes(p.id));
          setPlaces(validPlaces);
          if (onPlacesUpdatedRef.current) onPlacesUpdatedRef.current(validPlaces);
        }
      } else if (placesRes.status === 401) {
        sessionStorage.removeItem('shendam_admin_token');
        localStorage.removeItem('shendam_admin_token');
        setToken(null);
        setAdminUser(null);
        showToast('Admin session expired. Please sign in again.');
        return;
      } else {
        // Fallback to public endpoint
        const fallbackRes = await fetch('/api/places');
        if (fallbackRes.ok) {
          const d = await fallbackRes.json();
          if (d.places) {
            const deletedIds: string[] = Array.isArray(d.deletedPlaceIds) ? d.deletedPlaceIds : [];
            const validPlaces = (d.places || []).filter((p: Place) => !deletedIds.includes(p.id));
            setPlaces(validPlaces);
            if (onPlacesUpdatedRef.current) onPlacesUpdatedRef.current(validPlaces);
          }
        }
      }

      // Bookings
      const bookingsRes = await fetch('/api/admin/bookings', { headers });
      if (bookingsRes.ok) {
        const d = await bookingsRes.json();
        if (d.bookings) setBookings(d.bookings);
      }

      // Submissions
      const subRes = await fetch('/api/admin/submissions', { headers });
      if (subRes.ok) {
        const d = await subRes.json();
        if (d.submissions) setSubmissions(d.submissions);
      }

      // Feedback Queue
      const fbRes = await fetch('/api/admin/feedback', { headers });
      if (fbRes.ok) {
        const d = await fbRes.json();
        if (d.feedback) setFeedbackList(d.feedback);
      }

      // Audit Logs
      const logsRes = await fetch('/api/admin/activity', { headers });
      if (logsRes.ok) {
        const d = await logsRes.json();
        if (d.activityLogs) setAuditLogs(d.activityLogs);
      }

      // Revenue & Finance
      const revRes = await fetch('/api/admin/revenue', { headers });
      if (revRes.ok) {
        const d = await revRes.json();
        if (d.revenue) setRevenue(d.revenue);
      }

      // Analytics Summary
      const analyticsRes = await fetch('/api/admin/analytics/summary', { headers });
      if (analyticsRes.ok) {
        const d = await analyticsRes.json();
        setAnalyticsData(d);
        if (d.overview?.activeUsersNow) {
          setActiveUsersCount(d.overview.activeUsersNow);
        }
      }

      // Live Users & Sessions
      const usersRes = await fetch('/api/admin/users', { headers });
      if (usersRes.ok) {
        const d = await usersRes.json();
        if (d.sessions) setSessions(d.sessions);
        if (d.activeUsersCount) setActiveUsersCount(d.activeUsersCount);
      }

      // Settings
      const settingsRes = await fetch('/api/admin/settings', { headers });
      if (settingsRes.ok) {
        const d = await settingsRes.json();
        if (d.settings) setSettings(d.settings);
      }

      // Notifications
      const notifsRes = await fetch('/api/admin/notifications', { headers });
      if (notifsRes.ok) {
        const d = await notifsRes.json();
        if (d.notifications) setNotifications(d.notifications);
      }

      // Opportunities
      const oppsRes = await fetch('/api/admin/opportunities', { headers });
      if (oppsRes.ok) {
        const d = await oppsRes.json();
        if (d.opportunities) setOpportunities(d.opportunities);
      }
    } catch (e) {
      console.warn('[AdminDashboard] Fetch error:', e);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAllData();
      // Periodically refresh active users and metrics every 30 seconds
      const timer = setInterval(() => {
        fetchAllData();
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [token, fetchAllData]);

  // Auth Handlers
  const handleLoginSuccess = (newToken: string, user: { email: string; role: string; title: string }) => {
    sessionStorage.setItem('shendam_admin_token', newToken);
    localStorage.setItem('shendam_admin_token', newToken);
    setToken(newToken);
    setAdminUser(user);
    showToast('Administrator authenticated successfully.');
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {}
    sessionStorage.removeItem('shendam_admin_token');
    localStorage.removeItem('shendam_admin_token');
    setToken(null);
    setAdminUser(null);
    showToast('Signed out of Admin Portal.');
  };

  // Place CRUD
  const handleOpenCreatePlace = (category: CategoryId = 'services') => {
    setEditingPlace(null);
    setDefaultPlaceCategory(category);
    setIsPlaceModalOpen(true);
  };

  const handleOpenEditPlace = (place: Place) => {
    setEditingPlace(place);
    setDefaultPlaceCategory(place.category);
    setIsPlaceModalOpen(true);
  };

  const handleSavePlace = async (placeData: Partial<Place>) => {
    const activeToken = token || sessionStorage.getItem('shendam_admin_token') || localStorage.getItem('shendam_admin_token');
    if (!activeToken) {
      setToken(null);
      setAdminUser(null);
      showToast('Admin session expired. Please sign in again.');
      return;
    }
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${activeToken}`,
      'x-admin-token': activeToken
    };

    if (editingPlace) {
      // Edit
      const res = await fetch(`/api/admin/places/${encodeURIComponent(editingPlace.id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(placeData)
      });
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('shendam_admin_token');
          localStorage.removeItem('shendam_admin_token');
          setToken(null);
          setAdminUser(null);
          showToast('Admin session expired. Please sign in again.');
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Failed to update listing in database (HTTP ${res.status}).`);
      }
      showToast(`"${placeData.name}" updated successfully.`);
    } else {
      // Create
      const res = await fetch('/api/admin/places', {
        method: 'POST',
        headers,
        body: JSON.stringify(placeData)
      });
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('shendam_admin_token');
          localStorage.removeItem('shendam_admin_token');
          setToken(null);
          setAdminUser(null);
          showToast('Admin session expired. Please sign in again.');
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Failed to create new listing in database (HTTP ${res.status}).`);
      }
      showToast(`"${placeData.name}" created and published.`);
    }

    await fetchAllData();
  };

  // Prompt delete modal
  const handleRequestDeletePlace = (placeId: string, placeName: string) => {
    setDeleteConfirmTarget({ id: placeId, name: placeName });
  };

  // Execute confirmed delete
  const handleExecuteDeletePlace = async () => {
    if (!deleteConfirmTarget) return;
    const activeToken = token || sessionStorage.getItem('shendam_admin_token') || localStorage.getItem('shendam_admin_token');
    if (!activeToken) {
      setToken(null);
      setAdminUser(null);
      showToast('Admin session expired. Please sign in again.');
      return;
    }

    setIsDeletingPlace(true);
    const targetId = deleteConfirmTarget.id;
    try {
      const res = await fetch(`/api/admin/places/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
          'x-admin-token': activeToken
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('shendam_admin_token');
          localStorage.removeItem('shendam_admin_token');
          setToken(null);
          setAdminUser(null);
          showToast('Admin session expired. Please sign in again.');
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Failed to delete listing (HTTP ${res.status}).`);
      }

      // 1. Immediately update dashboard local state
      const updatedPlaces = places.filter((p) => p.id !== targetId);
      setPlaces(updatedPlaces);

      // 2. Propagate state update to parent App component
      if (onPlacesUpdated) {
        onPlacesUpdated(updatedPlaces);
      }

      // 3. Immediately update localStorage
      try {
        const sanitized = updatedPlaces.map((p) => ({
          ...p,
          image: p.image?.startsWith('data:') ? '' : p.image,
          logo: p.logo?.startsWith('data:') ? '' : p.logo,
          gallery: (p.gallery || []).filter((g) => !g.startsWith('data:'))
        }));
        localStorage.setItem('shendam_places_v2', JSON.stringify(sanitized));
      } catch (stErr) {
        console.warn('[Storage Warning] LocalStorage sync on deletion:', stErr);
      }

      // 4. Close detail modal if open for this deleted place
      if (selectedDetailPlace && selectedDetailPlace.id === targetId) {
        setSelectedDetailPlace(null);
      }

      setDeleteConfirmTarget(null);
      showToast('Listing deleted successfully.');

      // 5. Re-sync all background metrics & lists from server DB
      await fetchAllData();
    } catch (e: any) {
      console.error('[Delete Listing Error]', e);
      showToast(`Error deleting listing: ${e.message}`);
    } finally {
      setIsDeletingPlace(false);
    }
  };

  // Toggle Status (Active / Published vs Draft / Inactive)
  const handleTogglePlaceStatus = async (place: Place) => {
    if (!token) return;
    const newStatus = place.status === 'draft' ? 'published' : 'draft';
    try {
      const res = await fetch(`/api/admin/places/${place.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to toggle status.');
      showToast(`Listing is now ${newStatus === 'published' ? 'Active / Published' : 'Inactive / Draft'}.`);
      await fetchAllData();
    } catch (e: any) {
      showToast(`Error updating status: ${e.message}`);
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (place: Place) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/places/${place.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ featured: !place.featured })
      });
      if (!res.ok) throw new Error('Failed to update featured state.');
      showToast(`${place.name} is now ${!place.featured ? 'Featured' : 'Standard'}.`);
      await fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // Booking Actions
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update reservation.');
      showToast(`Booking marked as ${newStatus}.`);
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete reservation.');
      showToast('Booking deleted.');
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // Place Reviews Deletion
  const handleDeletePlaceReview = async (placeId: string, reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    const activeToken = token || sessionStorage.getItem('shendam_admin_token') || localStorage.getItem('shendam_admin_token');
    if (!activeToken) return;

    try {
      const res = await fetch(`/api/admin/places/${encodeURIComponent(placeId)}/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'x-admin-token': activeToken
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete review');
      }
      const data = await res.json();
      if (data.place) {
        setSelectedDetailPlace(data.place);
        const updated = places.map((p) => (p.id === data.place.id ? data.place : p));
        setPlaces(updated);
        if (onPlacesUpdatedRef.current) {
          onPlacesUpdatedRef.current(updated);
        }
      }
      showToast('Customer review deleted permanently.');
      await fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // Submissions (Merchant Verifications)
  const handleApproveSubmission = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Approval failed.');
      showToast('Business submission approved & published.');
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRejectSubmission = async (id: string, reason?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason || 'Information could not be verified' })
      });
      if (!res.ok) throw new Error('Rejection failed.');
      showToast('Business submission rejected.');
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleSuspendSubmission = async (id: string, reason?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Suspension failed.');
      showToast('Business listing suspended from public directory.');
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleEditSubmission = async (id: string, updates: Partial<PendingBusinessSubmission>) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Update failed.');
      showToast('Submitted business details updated successfully.');
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // Feedback Actions
  const handleUpdateFeedbackStatus = async (id: string, status: FeedbackStatus, adminNotes?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminNotes })
      });
      if (!res.ok) throw new Error('Failed to update feedback item.');
      showToast(`Feedback updated to ${status}.`);
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete feedback item.');
      showToast('Feedback item removed.');
      fetchAllData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  // Record Manual Financial Transaction
  const handleRecordTransaction = async (txData: Partial<RevenueTransaction>) => {
    if (!token) return;
    const res = await fetch('/api/admin/revenue/transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(txData)
    });
    if (!res.ok) throw new Error('Failed to record revenue.');
    showToast('Transaction logged in Shendam revenue ledger.');
    fetchAllData();
  };

  // Notification read
  const handleMarkNotificationRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch {}
  };

  // Broadcast Alert
  const handleBroadcastAlert = async (broadcastData: { title: string; category: string; content: string }) => {
    if (!token) return;
    const res = await fetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(broadcastData)
    });
    if (!res.ok) throw new Error('Broadcast failed.');
    showToast('Official notice broadcasted to all users.');
    fetchAllData();
  };

  // Settings Save
  const handleSaveSettings = async (newSettings: AdminSettings) => {
    if (!token) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newSettings)
    });
    if (!res.ok) throw new Error('Failed to save settings.');
    setSettings(newSettings);
    showToast('Settings saved successfully.');
    fetchAllData();
  };



  // Render Login if unauthorized
  if (!token || !adminUser) {
    return (
      <div className={`fixed inset-0 z-50 overflow-y-auto bg-[#04142F] ${!isOpen ? 'hidden' : 'block animate-in fade-in duration-200'}`}>
        <AdminLogin onLoginSuccess={handleLoginSuccess} onBackToApp={onClose} />
      </div>
    );
  }

  const counts = {
    hotels: places.filter((p) => p.category === 'hotels').length,
    restaurants: places.filter((p) => p.category === 'restaurants').length,
    businesses: places.filter((p) => p.category === 'businesses' || p.category === 'more').length,
    attractions: places.filter((p) => p.category === 'tourist_spots').length,
    services: places.filter((p) => p.category === 'services').length,
    transport: places.filter((p) => p.category === 'transport').length,
    shopping: places.filter((p) => p.category === 'shopping').length,
    health: places.filter((p) => p.category === 'health').length,
    emergency: places.filter((p) => p.category === 'emergency').length,
    all_listings: places.length,
    bookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    pendingSubmissions: submissions.filter((s) => s.status === 'pending').length,
    pendingFeedback: feedbackList.filter((f) => f.status === 'pending').length,
    activeUsers: activeUsersCount
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[#04142F] text-white flex flex-col overflow-hidden font-brand-sans ${!isOpen ? 'hidden' : 'block animate-in fade-in duration-200'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFC928] text-[#04142F] font-bold text-xs px-4 py-2.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Layout: Sidebar + Main Content */}
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          currentSection={currentSection}
          onNavigateSection={(sec) => {
            setCurrentSection(sec);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          counts={counts}
          adminEmail={adminUser.email}
          adminRole={adminUser.role}
          adminTitle={adminUser.title}
          adminName={adminUser.name}
          onLogout={handleLogout}
          onReturnToApp={onClose}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col h-full overflow-hidden lg:pl-64">
          {/* Header */}
          <AdminHeader
            currentSection={currentSection}
            activeUsersCount={activeUsersCount}
            notifications={notifications}
            adminEmail={adminUser.email}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onNavigateSection={setCurrentSection}
            onMarkNotificationRead={handleMarkNotificationRead}
            onLogout={handleLogout}
            onReturnToApp={onClose}
            searchTerm={searchTerm}
            onSearchChange={(term) => {
              setSearchTerm(term);
              if (term.trim().length > 0 && currentSection === 'overview') {
                setCurrentSection('all_listings');
              }
            }}
          />

          {/* Main Scrollable View */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-[#04142F]">
            <div className="max-w-7xl mx-auto">
              {/* 1. OVERVIEW */}
              {currentSection === 'overview' && (
                <AdminOverview
                  analytics={analyticsData}
                  places={places}
                  bookings={bookings}
                  opportunities={opportunities}
                  feedbackList={feedbackList}
                  pendingSubmissionsCount={counts.pendingSubmissions}
                  auditLogs={auditLogs}
                  revenue={revenue}
                  onNavigateSection={setCurrentSection}
                  onOpenCreatePlace={(cat) => handleOpenCreatePlace(cat as CategoryId)}
                  onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
                />
              )}

              {/* 2. ALL LISTINGS CMS */}
              {currentSection === 'all_listings' && (
                <AdminDirectoryCMS
                  categoryFilter="all"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={handleOpenCreatePlace}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 3. HOTELS CMS */}
              {currentSection === 'hotels' && (
                <AdminDirectoryCMS
                  categoryFilter="hotels"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('hotels')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 4. RESTAURANTS CMS */}
              {currentSection === 'restaurants' && (
                <AdminDirectoryCMS
                  categoryFilter="restaurants"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('restaurants')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 5. BUSINESSES CMS */}
              {currentSection === 'businesses' && (
                <AdminDirectoryCMS
                  categoryFilter="businesses"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('businesses')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 6. TOURIST SPOTS & ATTRACTIONS CMS */}
              {(currentSection === 'tourist_spots' || currentSection === 'attractions') && (
                <AdminDirectoryCMS
                  categoryFilter="tourist_spots"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('tourist_spots')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 7. SERVICES CMS (TECH, PHONE REPAIR, ARTISANS) */}
              {currentSection === 'services' && (
                <AdminDirectoryCMS
                  categoryFilter="services"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('services')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 8. TRANSPORT CMS */}
              {currentSection === 'transport' && (
                <AdminDirectoryCMS
                  categoryFilter="transport"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('transport')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 9. SHOPPING CMS */}
              {currentSection === 'shopping' && (
                <AdminDirectoryCMS
                  categoryFilter="shopping"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('shopping')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 10. HEALTH CMS */}
              {currentSection === 'health' && (
                <AdminDirectoryCMS
                  categoryFilter="health"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('health')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 11. EMERGENCY SERVICES CMS */}
              {currentSection === 'emergency' && (
                <AdminDirectoryCMS
                  categoryFilter="emergency"
                  places={places}
                  searchTerm={searchTerm}
                  onAddPlace={() => handleOpenCreatePlace('emergency')}
                  onEditPlace={handleOpenEditPlace}
                  onDeletePlace={handleRequestDeletePlace}
                  onViewPlace={(p) => setSelectedDetailPlace(p)}
                  onToggleStatus={handleTogglePlaceStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              )}

              {/* 12. BOOKINGS & RESERVATIONS */}
              {currentSection === 'bookings' && (
                <AdminBookings
                  bookings={bookings}
                  onUpdateStatus={handleUpdateBookingStatus}
                  onDeleteBooking={handleDeleteBooking}
                />
              )}

              {/* 13. BUSINESS SUBMISSIONS QUEUE */}
              {currentSection === 'submissions' && (
                <AdminSubmissionsQueue
                  submissions={submissions}
                  onApprove={handleApproveSubmission}
                  onReject={handleRejectSubmission}
                  onSuspend={handleSuspendSubmission}
                  onEdit={handleEditSubmission}
                />
              )}

              {/* 14. CITIZEN FEEDBACK */}
              {currentSection === 'feedback' && (
                <AdminFeedbackQueue
                  feedbackList={feedbackList}
                  onUpdateStatus={handleUpdateFeedbackStatus}
                  onDeleteFeedback={handleDeleteFeedback}
                />
              )}

              {/* 15. REVENUE & FINANCIAL AUDIT */}
              {currentSection === 'revenue' && (
                <AdminRevenue
                  revenue={revenue}
                  onRecordTransaction={handleRecordTransaction}
                  onRefresh={fetchAllData}
                />
              )}

              {/* 16. LIVE USERS & SESSIONS */}
              {(currentSection === 'live_users' || currentSection === 'users') && (
                <AdminUsers
                  sessions={sessions}
                  activeCount={activeUsersCount}
                  onRefresh={fetchAllData}
                />
              )}

              {/* 17. ANALYTICS */}
              {currentSection === 'analytics' && (
                <AdminAnalytics analyticsData={analyticsData} />
              )}

              {/* 18. OPPORTUNITIES & GRANTS */}
              {currentSection === 'opportunities' && (
                <AdminOpportunities authToken={token || ''} />
              )}

              {/* 18b. EVENTS & FESTIVALS CMS */}
              {currentSection === 'events' && (
                <AdminEvents
                  authToken={token || ''}
                  onSessionExpired={() => {
                    setToken(null);
                    setAdminUser(null);
                    showToast('Admin session expired. Please sign in again.');
                  }}
                />
              )}

              {/* 18c. ADVERTISEMENTS & ADS CMS */}
              {currentSection === 'ads' && (
                <AdminAdvertisements
                  authToken={token || ''}
                  onSessionExpired={() => {
                    setToken(null);
                    setAdminUser(null);
                    showToast('Admin session expired. Please sign in again.');
                  }}
                />
              )}

              {/* 19. AUDIT & ACTIVITY LOG */}
              {currentSection === 'activity_log' && (
                <AdminActivityLog logs={auditLogs} />
              )}

              {/* 20. BRANDING & LOGOS */}
              {currentSection === 'branding' && (
                <AdminBrandingView
                  token={token || ''}
                  onSessionExpired={() => {
                    setToken(null);
                    setAdminUser(null);
                    showToast('Admin session expired. Please sign in again.');
                  }}
                />
              )}

              {/* 21. ADMIN MANAGEMENT & RBAC */}
              {currentSection === 'admin_management' && (
                <AdminManagement
                  authToken={token || ''}
                  currentAdminEmail={adminUser.email}
                  onSessionExpired={() => {
                    setToken(null);
                    setAdminUser(null);
                    showToast('Admin session expired. Please sign in again.');
                  }}
                />
              )}

              {/* 22. SETTINGS & DB CONTROLS */}
              {currentSection === 'settings' && (
                <AdminSettingsView
                  settings={settings}
                  adminRole={adminUser.role}
                  onSaveSettings={handleSaveSettings}
                  onNavigateToAdmins={() => setCurrentSection('admin_management')}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Place Modal (Add / Edit Listing) */}
      <AdminModalPlaceForm
        isOpen={isPlaceModalOpen}
        onClose={() => {
          setIsPlaceModalOpen(false);
          setEditingPlace(null);
        }}
        onSave={handleSavePlace}
        initialData={editingPlace}
        defaultCategory={defaultPlaceCategory}
        authToken={token}
        onPlaceUpdated={(updatedPlace) => {
          const next = places.map((p) => (p.id === updatedPlace.id ? updatedPlace : p));
          setPlaces(next);
          if (onPlacesUpdated) onPlacesUpdated(next);
          setEditingPlace(updatedPlace);
        }}
      />

      {/* Place Detail Modal (View Full Listing Details) */}
      <AdminPlaceDetailModal
        isOpen={Boolean(selectedDetailPlace)}
        onClose={() => setSelectedDetailPlace(null)}
        place={selectedDetailPlace}
        onEdit={(p) => {
          setSelectedDetailPlace(null);
          handleOpenEditPlace(p);
        }}
        onDelete={(pId, pName) => {
          handleRequestDeletePlace(pId, pName);
        }}
        onToggleStatus={handleTogglePlaceStatus}
        onToggleFeatured={handleToggleFeatured}
        onDeleteReview={handleDeletePlaceReview}
      />

      {/* Delete Confirmation Modal */}
      <AdminDeleteConfirmModal
        isOpen={Boolean(deleteConfirmTarget)}
        onClose={() => setDeleteConfirmTarget(null)}
        onConfirm={handleExecuteDeletePlace}
        itemName={deleteConfirmTarget?.name || 'Listing'}
        itemType="directory listing"
        isDeleting={isDeletingPlace}
      />

      {/* Broadcast Alert Modal */}
      <AdminBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onBroadcast={handleBroadcastAlert}
      />
    </div>
  );
};

export default AdminDashboard;
