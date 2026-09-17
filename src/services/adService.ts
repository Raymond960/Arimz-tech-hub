import {
  Advertisement,
  AdvertisementPackage,
  AdvertisementPayment,
  AdvertisementSettings,
  AdvertisementApprovalStatus
} from '../types';

export interface AdAnalyticsReport {
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
}

/**
 * Public Advertisement Service
 */
export async function fetchPublicAds(placement?: string): Promise<Advertisement[]> {
  try {
    const url = placement ? `/api/advertisements?placement=${encodeURIComponent(placement)}` : '/api/advertisements';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.advertisements) ? data.advertisements : [];
  } catch (err) {
    console.warn('[AdService] Failed to fetch public advertisements:', err);
    return [];
  }
}

export async function fetchAdSettings(): Promise<AdvertisementSettings | null> {
  try {
    const res = await fetch('/api/advertisements/settings');
    if (!res.ok) return null;
    const data = await res.json();
    return data.settings || null;
  } catch (err) {
    console.warn('[AdService] Failed to fetch advertisement settings:', err);
    return null;
  }
}

export async function fetchPublicPackages(): Promise<AdvertisementPackage[]> {
  try {
    const res = await fetch('/api/advertisements/packages');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.packages) ? data.packages : [];
  } catch (err) {
    console.warn('[AdService] Failed to fetch advertisement packages:', err);
    return [];
  }
}

export async function recordAdClick(adId: string): Promise<void> {
  try {
    await fetch(`/api/advertisements/${encodeURIComponent(adId)}/click`, {
      method: 'POST'
    });
  } catch {
    // Non-blocking telemetry
  }
}

export async function recordAdImpression(adId: string): Promise<void> {
  try {
    await fetch(`/api/advertisements/${encodeURIComponent(adId)}/impression`, {
      method: 'POST'
    });
  } catch {
    // Non-blocking telemetry
  }
}

export async function initiateAdPayment(payload: {
  advertisementId?: string;
  packageId?: string;
  amount: number;
  advertiserName: string;
  advertiserEmail?: string;
  advertiserPhone?: string;
}): Promise<{ success: boolean; payment?: AdvertisementPayment; paystackPublicKey?: string; error?: string }> {
  try {
    const res = await fetch('/api/advertisements/payments/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to initiate payment' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error initiating payment' };
  }
}

export async function verifyAdPayment(reference: string): Promise<{
  success: boolean;
  payment?: AdvertisementPayment;
  activatedAd?: Advertisement;
  error?: string;
}> {
  try {
    const res = await fetch('/api/advertisements/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Payment verification failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Payment verification request failed' };
  }
}

/**
 * Protected Admin Advertisement Service
 */
export async function fetchAdminAds(authToken: string): Promise<Advertisement[]> {
  const res = await fetch('/api/admin/advertisements', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch advertisements');
  const data = await res.json();
  return data.advertisements || [];
}

export async function fetchAdminAnalytics(authToken: string, range: string = '30d'): Promise<AdAnalyticsReport> {
  const res = await fetch(`/api/admin/advertisements/analytics?range=${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (!res.ok) throw new Error('Failed to load advertisement analytics');
  const data = await res.json();
  return data.analytics;
}

export async function createAdminAd(authToken: string, adData: Partial<Advertisement>): Promise<Advertisement> {
  const res = await fetch('/api/admin/advertisements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify(adData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create advertisement');
  return data.advertisement;
}

export async function updateAdminAd(authToken: string, id: string, updates: Partial<Advertisement>): Promise<Advertisement> {
  const res = await fetch(`/api/admin/advertisements/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update advertisement');
  return data.advertisement;
}

export async function toggleAdminAdStatus(authToken: string, id: string, status: string): Promise<Advertisement> {
  const res = await fetch(`/api/admin/advertisements/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
  return data.advertisement;
}

export async function setAdminAdApproval(
  authToken: string,
  id: string,
  approvalStatus: AdvertisementApprovalStatus,
  notes?: string
): Promise<Advertisement> {
  const res = await fetch(`/api/admin/advertisements/${encodeURIComponent(id)}/approval`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ approvalStatus, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update approval');
  return data.advertisement;
}

export async function deleteAdminAd(authToken: string, id: string): Promise<void> {
  const res = await fetch(`/api/admin/advertisements/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete advertisement');
}

export async function fetchAdminPackages(authToken: string): Promise<AdvertisementPackage[]> {
  const res = await fetch('/api/admin/advertisements/packages', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch packages');
  const data = await res.json();
  return data.packages || [];
}

export async function createAdminPackage(authToken: string, pkg: Partial<AdvertisementPackage>): Promise<AdvertisementPackage> {
  const res = await fetch('/api/admin/advertisements/packages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify(pkg)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create package');
  return data.package;
}

export async function updateAdminPackage(authToken: string, id: string, updates: Partial<AdvertisementPackage>): Promise<AdvertisementPackage> {
  const res = await fetch(`/api/admin/advertisements/packages/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update package');
  return data.package;
}

export async function deleteAdminPackage(authToken: string, id: string): Promise<void> {
  const res = await fetch(`/api/admin/advertisements/packages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete package');
}

export async function fetchAdminPayments(authToken: string): Promise<AdvertisementPayment[]> {
  const res = await fetch('/api/admin/advertisements/payments', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch payments');
  const data = await res.json();
  return data.payments || [];
}

export async function reconcileAdminPayment(authToken: string, paymentId: string, notes?: string): Promise<{ payment: AdvertisementPayment; activatedAd?: Advertisement }> {
  const res = await fetch(`/api/admin/advertisements/payments/${encodeURIComponent(paymentId)}/reconcile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reconcile payment');
  return { payment: data.payment, activatedAd: data.activatedAd };
}

export async function fetchAdminSettings(authToken: string): Promise<AdvertisementSettings> {
  const res = await fetch('/api/admin/advertisements/settings', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  if (!res.ok) throw new Error('Failed to load settings');
  const data = await res.json();
  return data.settings;
}

export async function updateAdminSettings(authToken: string, settings: Partial<AdvertisementSettings>): Promise<AdvertisementSettings> {
  const res = await fetch('/api/admin/advertisements/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify(settings)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save settings');
  return data.settings;
}
