import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  Trash2,
  Edit,
  UserX,
  UserCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  Mail,
  User,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { AdminRole, AdminUser } from '../../types';

interface AdminManagementProps {
  authToken: string;
  currentAdminEmail: string;
  onSessionExpired?: () => void;
}

const ROLE_DEFINITIONS: Record<
  AdminRole,
  {
    title: string;
    description: string;
    badgeColor: string;
    permissions: string[];
  }
> = {
  SUPER_ADMIN: {
    title: 'Super Admin',
    description: 'Full unrestricted platform access. Can create, edit, disable, and remove administrators and manage all system configurations.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    permissions: [
      'Manage Administrators & RBAC',
      'Full Listings & Directory CMS',
      'Bookings & Reservations',
      'Revenue & Financial Audits',
      'Merchant Submissions & Feedback',
      'Branding, Logs & System Settings'
    ]
  },
  CONTENT_ADMIN: {
    title: 'Content Admin',
    description: 'Manages all directory listings, hotels, businesses, attractions, services, upcoming events, and merchant submissions.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    permissions: [
      'Create, Edit, Delete Listings',
      'Verify & Feature Businesses',
      'Manage Community Events',
      'Review Merchant Submissions Queue',
      'Manage Opportunities & Grants'
    ]
  },
  BOOKING_ADMIN: {
    title: 'Booking Admin',
    description: 'Specialized in customer reservations, stay bookings, and reservation status workflows.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    permissions: [
      'View All Customer Reservations',
      'Confirm, Cancel, or Complete Stays',
      'Access Customer Phone & WhatsApp Details',
      'Update Room / Service Pricing'
    ]
  },
  ADVERTISING_ADMIN: {
    title: 'Advertising Admin',
    description: 'Oversees monetization, sponsored listing tags, affiliate referral opportunities, and revenue records.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    permissions: [
      'Manage Opportunities & Referral Links',
      'Record Financial Transactions',
      'Manage Sponsored & Featured Tags',
      'View Revenue Audits & Summaries'
    ]
  },
  SUPPORT_ADMIN: {
    title: 'Support Admin',
    description: 'Handles citizen feedback, bug reports, feature suggestions, and customer communication queues.',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    permissions: [
      'Review Citizen Feedback Queue',
      'Resolve or Dismiss Reports',
      'Process Merchant Submission Inquiries',
      'View Public Business Contacts'
    ]
  },
  VIEWER: {
    title: 'Viewer (Auditor)',
    description: 'Read-only access for monitoring telemetry, inspecting directory listings, and reviewing audit records.',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    permissions: [
      'Read-Only Directory Inspection',
      'View Analytics & Live Users',
      'Read-Only Bookings & Feedback',
      'View Audit & Activity Logs'
    ]
  }
};

export const AdminManagement: React.FC<AdminManagementProps> = ({
  authToken,
  currentAdminEmail,
  onSessionExpired
}) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'invited' | 'active' | 'disabled'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('CONTENT_ADMIN');
  const [formTitle, setFormTitle] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'disabled'>('active');
  const [formSendInvite, setFormSendInvite] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Diagnostic Invitation Result Modal
  const [inviteResultModal, setInviteResultModal] = useState<{
    adminName: string;
    adminEmail: string;
    emailSent: boolean;
    emailError?: string;
    inviteUrl?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const safeJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch (err) {
        console.warn('[AdminManagement] JSON parse warning:', err);
      }
    }
    const text = await res.text().catch(() => '');
    return {
      error: text && text.length < 300 
        ? text 
        : `Server responded with HTTP status ${res.status} (${res.statusText || 'Error'}).`
    };
  };

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-admin-token': authToken
        }
      });

      if (res.status === 401 || res.status === 403) {
        if (onSessionExpired) onSessionExpired();
        return;
      }

      const data = await safeJsonResponse(res);
      if (res.ok && data.success) {
        setAdmins(data.admins || []);
      } else {
        showToast(data.error || data.message || 'Failed to load administrator accounts.');
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [authToken]);

  // Handle Add Admin
  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('CONTENT_ADMIN');
    setFormTitle('LGA Administrative Staff');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormStatus('active');
    setFormSendInvite(true);
    setShowPassword(false);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Please provide the administrator full name.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!formSendInvite) {
      if (!formPassword || formPassword.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      if (formPassword !== formConfirmPassword) {
        setFormError('Passwords do not match. Please re-type carefully.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'x-admin-token': authToken
        },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          title: formTitle.trim() || 'LGA Administrative Staff',
          password: formSendInvite ? undefined : formPassword,
          status: formStatus,
          sendInvite: formSendInvite
        })
      });

      const data = await safeJsonResponse(res);

      if (!res.ok) {
        let msg = data.error || data.message || `Server returned HTTP status ${res.status}.`;
        if (res.status === 401) {
          msg = 'Administrator session expired or invalid. Please log in again.';
          if (onSessionExpired) onSessionExpired();
        } else if (res.status === 403) {
          msg = 'Access denied: Only Super Administrators have permission to create or invite new admins.';
        }
        setFormError(msg);
        setIsSubmitting(false);
        return;
      }

      setIsAddModalOpen(false);
      fetchAdmins();

      if (data.isInviteFlow) {
        if (data.emailSent) {
          showToast(`Invitation email successfully delivered to ${data.admin.email}!`);
        } else {
          // Open diagnostic result modal showing why email wasn't delivered
          setInviteResultModal({
            adminName: data.admin.name,
            adminEmail: data.admin.email,
            emailSent: false,
            emailError: data.emailError || 'SMTP email service is not configured on the server.',
            inviteUrl: data.inviteUrl
          });
        }
      } else {
        showToast(`Administrator "${data.admin.name}" created successfully.`);
      }
    } catch (err: any) {
      console.error('[AdminManagement] Create Admin network error:', err);
      let errorMsg = 'Unable to reach the Shendam Connect API server. Please check your network connection.';
      if (err instanceof TypeError && err.message?.toLowerCase().includes('fetch')) {
        errorMsg = 'Network Error: Unable to connect to backend server endpoint (/api/admin/users). Please verify internet connection and backend server status.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (admin: AdminUser) => {
    setResendingId(admin.id);
    try {
      const res = await fetch(`/api/admin/users/${admin.id}/resend-invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-admin-token': authToken
        }
      });

      const data = await safeJsonResponse(res);
      if (res.ok && data.success) {
        fetchAdmins();
        if (data.emailSent) {
          showToast(`Invitation email re-sent to ${admin.email}!`);
        } else {
          setInviteResultModal({
            adminName: admin.name,
            adminEmail: admin.email,
            emailSent: false,
            emailError: data.emailError || 'SMTP email service is not configured on the server.',
            inviteUrl: data.inviteUrl
          });
        }
      } else {
        showToast(data.error || 'Failed to resend invitation email.');
      }
    } catch (err) {
      showToast('Network error resending invitation.');
    } finally {
      setResendingId(null);
    }
  };

  // Handle Edit Admin
  const handleOpenEditModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormName(admin.name);
    setFormEmail(admin.email);
    setFormRole(admin.role);
    setFormTitle(admin.title);
    setFormStatus(admin.status);
    setFormPassword('');
    setFormConfirmPassword('');
    setShowPassword(false);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Full name is required.');
      return;
    }

    if (formPassword && formPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }
    if (formPassword && formPassword !== formConfirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        role: formRole,
        title: formTitle.trim(),
        status: formStatus
      };
      if (formPassword) {
        payload.password = formPassword;
      }

      const res = await fetch(`/api/admin/users/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'x-admin-token': authToken
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to update administrator.');
        setIsSubmitting(false);
        return;
      }

      showToast(`Administrator "${data.admin.name}" updated successfully.`);
      setIsEditModalOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err: any) {
      setFormError(err.message || 'Network error updating administrator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle (Active / Disabled)
  const handleToggleStatus = async (admin: AdminUser) => {
    const nextStatus = admin.status === 'active' ? 'disabled' : 'active';
    const actionLabel = nextStatus === 'active' ? 'activate' : 'disable';

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} "${admin.name}" (${admin.email})?\n\n` +
        (nextStatus === 'disabled'
          ? 'Their active login sessions will be immediately terminated, and they will be barred from administrative APIs.'
          : 'They will be permitted to log in with their existing credentials.')
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${admin.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'x-admin-token': authToken
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || `Failed to ${actionLabel} administrator.`);
        return;
      }

      showToast(`Account for "${admin.name}" has been ${nextStatus === 'active' ? 're-enabled' : 'disabled'}.`);
      fetchAdmins();
    } catch (err) {
      showToast('Network error updating status.');
    }
  };

  // Handle Reset Password Modal
  const handleOpenResetPassword = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormPassword('');
    setFormConfirmPassword('');
    setShowPassword(false);
    setFormError(null);
    setIsResetPasswordOpen(true);
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setFormError(null);

    if (!formPassword || formPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }
    if (formPassword !== formConfirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'x-admin-token': authToken
        },
        body: JSON.stringify({ password: formPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to reset password.');
        setIsSubmitting(false);
        return;
      }

      showToast(`Password for "${selectedAdmin.name}" has been securely reset. Active sessions were revoked.`);
      setIsResetPasswordOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err: any) {
      setFormError(err.message || 'Network error resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Modal
  const handleOpenDelete = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setFormError(null);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedAdmin.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-admin-token': authToken
        }
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to delete administrator.');
        setIsSubmitting(false);
        return;
      }

      showToast(`Administrator "${selectedAdmin.name}" permanently removed.`);
      setIsDeleteModalOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err: any) {
      setFormError(err.message || 'Network error deleting administrator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered list
  const filteredAdmins = admins.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === 'all' || a.role === selectedRoleFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#04142F] border border-[#FFC928]/40 text-[#FFC928] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role-Based Access Control (RBAC) Engine</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-white font-brand-sans mt-1.5 flex items-center gap-2">
            <span>Admin Management & Security Roles</span>
          </h2>
          <p className="text-xs text-[#9BAABD] max-w-2xl leading-relaxed mt-1">
            Create, configure, and monitor administrative personnel with granular privilege boundaries. Manage roles, reset credentials, and revoke sessions in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchAdmins}
            className="p-2.5 bg-white/10 hover:bg-white/15 border border-white/14 rounded-2xl text-white transition cursor-pointer"
            title="Refresh administrators list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-bold text-xs rounded-2xl flex items-center gap-2 transition cursor-pointer shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Administrator</span>
          </button>
        </div>
      </div>

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {(Object.keys(ROLE_DEFINITIONS) as AdminRole[]).map((roleKey) => {
          const roleInfo = ROLE_DEFINITIONS[roleKey];
          const count = admins.filter((a) => a.role === roleKey).length;
          return (
            <div
              key={roleKey}
              className="bg-[#08254D] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleInfo.badgeColor}`}>
                    {roleInfo.title}
                  </span>
                  <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-lg">
                    {count} {count === 1 ? 'User' : 'Users'}
                  </span>
                </div>
                <p className="text-xs text-[#9BAABD] leading-relaxed mb-3">
                  {roleInfo.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/8 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Key Privileges
                </span>
                <div className="flex flex-wrap gap-1">
                  {roleInfo.permissions.slice(0, 2).map((perm, idx) => (
                    <span key={idx} className="text-[10px] bg-white/6 text-slate-300 px-2 py-0.5 rounded-md truncate max-w-full">
                      ✓ {perm}
                    </span>
                  ))}
                  {roleInfo.permissions.length > 2 && (
                    <span className="text-[10px] text-amber-300/80 px-1 py-0.5">
                      +{roleInfo.permissions.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#08254D] border border-white/10 p-3.5 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, role, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-[#04142F] text-white border border-white/14 rounded-xl px-3 py-2 outline-none cursor-pointer text-xs"
          >
            <option value="all">All Roles ({admins.length})</option>
            <option value="SUPER_ADMIN">Super Admins</option>
            <option value="CONTENT_ADMIN">Content Admins</option>
            <option value="BOOKING_ADMIN">Booking Admins</option>
            <option value="ADVERTISING_ADMIN">Advertising Admins</option>
            <option value="SUPPORT_ADMIN">Support Admins</option>
            <option value="VIEWER">Viewers (Read-only)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#04142F] text-white border border-white/14 rounded-xl px-3 py-2 outline-none cursor-pointer text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="invited">Pending Invitations</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FFC928]" />
            <h3 className="font-bold text-sm text-white">
              Configured Administrators ({filteredAdmins.length})
            </h3>
          </div>
          <span className="text-xs text-[#9BAABD]">
            System Authority: <strong className="text-amber-300">Super Admin Mode</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-[#FFC928] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Loading authorized administrators...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <UserX className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-white">No Administrators Found</p>
            <p className="text-xs text-slate-400">
              {searchTerm || selectedRoleFilter !== 'all' || statusFilter !== 'all'
                ? 'No admin users matched your filter criteria.'
                : 'No additional administrators configured.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#04142F]/70 text-[#9BAABD] uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="p-4">Administrator Profile</th>
                  <th className="p-4">Role & Privilege</th>
                  <th className="p-4">Designation / Title</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredAdmins.map((admin) => {
                  const roleConfig = ROLE_DEFINITIONS[admin.role] || ROLE_DEFINITIONS.CONTENT_ADMIN;
                  const isPrimarySuperAdmin = admin.email.toLowerCase() === 'domnanraymond9@gmail.com';
                  const isCurrentLoggedInUser = admin.email.toLowerCase() === currentAdminEmail.toLowerCase();

                  return (
                    <tr key={admin.id} className="hover:bg-white/4 transition">
                      {/* Profile / Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#04142F] border border-white/14 flex items-center justify-center font-black text-amber-300 shrink-0">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span className="truncate">{admin.name}</span>
                              {isCurrentLoggedInUser && (
                                <span className="bg-amber-500 text-[#04142F] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{admin.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${roleConfig.badgeColor}`}>
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span>{roleConfig.title}</span>
                        </span>
                      </td>

                      {/* Title */}
                      <td className="p-4 text-slate-300 font-medium">
                        <span className="truncate block max-w-[180px]">{admin.title || 'Administrative Staff'}</span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {admin.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>ACTIVE</span>
                          </span>
                        ) : admin.status === 'invited' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold inline-flex items-center gap-1" title="Invitation sent - awaiting password activation">
                            <Mail className="w-3 h-3 text-amber-300" />
                            <span>INVITED</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>DISABLED</span>
                          </span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="p-4 text-[11px] text-slate-400">
                        {admin.lastLoginAt ? (
                          <div>
                            <span className="text-slate-200 block">
                              {new Date(admin.lastLoginAt).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(admin.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : admin.status === 'invited' ? (
                          <span className="text-amber-300/80 italic text-[10px]">Invite pending</span>
                        ) : (
                          <span className="text-slate-500 italic">No login recorded</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Resend Invite */}
                          {admin.status === 'invited' && (
                            <button
                              onClick={() => handleResendInvite(admin)}
                              disabled={resendingId === admin.id}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                              title="Resend invitation email or generate token"
                            >
                              <RefreshCw className={`w-3 h-3 ${resendingId === admin.id ? 'animate-spin' : ''}`} />
                              <span>Resend Invite</span>
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEditModal(admin)}
                            className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-slate-200 hover:text-white transition cursor-pointer"
                            title="Edit Administrator Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenResetPassword(admin)}
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition cursor-pointer"
                            title="Reset Administrator Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Disable / Enable Toggle */}
                          {!isPrimarySuperAdmin && (
                            <button
                              onClick={() => handleToggleStatus(admin)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                admin.status === 'active'
                                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300'
                              }`}
                              title={admin.status === 'active' ? 'Disable Account' : 'Enable Account'}
                            >
                              {admin.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Delete Account */}
                          {!isPrimarySuperAdmin && (
                            <button
                              onClick={() => handleOpenDelete(admin)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition cursor-pointer"
                              title="Permanently Delete Administrator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD ADMINISTRATOR MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#08254D] border border-white/14 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFC928]/20 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-brand-sans">
                  Add New Administrator
                </h3>
                <p className="text-xs text-[#9BAABD]">
                  Provision credentials and designate role-based access limits.
                </p>
              </div>
            </div>

            {formError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-2xl mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenneth Dapar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Official Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. k.dapar@shendamconnect.gov.ng"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Administrative Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AdminRole)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928] cursor-pointer"
                  >
                    <option value="CONTENT_ADMIN">CONTENT_ADMIN - Listings & Events</option>
                    <option value="BOOKING_ADMIN">BOOKING_ADMIN - Reservations & Stays</option>
                    <option value="ADVERTISING_ADMIN">ADVERTISING_ADMIN - Monetization</option>
                    <option value="SUPPORT_ADMIN">SUPPORT_ADMIN - Feedback & Merchant Queue</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN - Full Platform Authority</option>
                    <option value="VIEWER">VIEWER - Read-Only Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tourism Officer"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* Role description card */}
              <div className="bg-[#04142F]/70 border border-white/10 rounded-2xl p-3 text-[11px] space-y-1">
                <span className="font-bold text-amber-300 block">
                  Permissions: {ROLE_DEFINITIONS[formRole]?.title}
                </span>
                <p className="text-slate-400">
                  {ROLE_DEFINITIONS[formRole]?.description}
                </p>
              </div>

              {/* Mode Selection */}
              <div className="bg-[#04142F] border border-white/10 rounded-xl p-3 space-y-2">
                <label className="block text-slate-300 font-semibold text-xs">Creation Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSendInvite(true)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      formSendInvite
                        ? 'bg-[#FFC928]/15 border-[#FFC928] text-white'
                        : 'bg-[#061D40] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-[#FFC928] shrink-0" />
                    <div>
                      <span className="block font-bold text-xs">Email Invitation</span>
                      <span className="text-[10px] text-slate-400 block">Sends link for admin to set password</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormSendInvite(false)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      !formSendInvite
                        ? 'bg-[#FFC928]/15 border-[#FFC928] text-white'
                        : 'bg-[#061D40] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="block font-bold text-xs">Manual Password</span>
                      <span className="text-[10px] text-slate-400 block">Super Admin sets password now</span>
                    </div>
                  </button>
                </div>
              </div>

              {formSendInvite ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Invitation Email Flow</span>
                    <p className="text-[11px] text-[#9BAABD] leading-relaxed">
                      An invitation message containing a secure password setup link valid for 48 hours will be dispatched to <strong className="text-white font-mono">{formEmail || 'the admin email'}</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Initial Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!formSendInvite}
                        placeholder="Min 6 characters"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-10 pr-9 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Confirm Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!formSendInvite}
                        placeholder="Re-enter password"
                        value={formConfirmPassword}
                        onChange={(e) => setFormConfirmPassword(e.target.value)}
                        className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black transition cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Creating...' : 'Create Administrator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT ADMINISTRATOR MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#08254D] border border-white/14 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedAdmin(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-brand-sans">
                  Edit Administrator: {selectedAdmin.name}
                </h3>
                <p className="text-xs text-[#9BAABD]">
                  {selectedAdmin.email}
                </p>
              </div>
            </div>

            {formError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-2xl mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Administrative Role
                  </label>
                  <select
                    value={formRole}
                    disabled={selectedAdmin.email.toLowerCase() === 'domnanraymond9@gmail.com'}
                    onChange={(e) => setFormRole(e.target.value as AdminRole)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928] cursor-pointer disabled:opacity-50"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN - Master Access</option>
                    <option value="CONTENT_ADMIN">CONTENT_ADMIN - Directory & Events</option>
                    <option value="BOOKING_ADMIN">BOOKING_ADMIN - Reservations & Stays</option>
                    <option value="ADVERTISING_ADMIN">ADVERTISING_ADMIN - Monetization</option>
                    <option value="SUPPORT_ADMIN">SUPPORT_ADMIN - Feedback Queue</option>
                    <option value="VIEWER">VIEWER - Read-Only Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Account Status
                  </label>
                  <select
                    value={formStatus}
                    disabled={selectedAdmin.email.toLowerCase() === 'domnanraymond9@gmail.com'}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928] cursor-pointer disabled:opacity-50"
                  >
                    <option value="active">Active (Permit Logins)</option>
                    <option value="disabled">Disabled (Revoke & Bar Logins)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Optional New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {formPassword && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black transition cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {isResetPasswordOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#08254D] border border-white/14 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => {
                setIsResetPasswordOpen(false);
                setSelectedAdmin(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-brand-sans">
                  Reset Password
                </h3>
                <p className="text-xs text-[#9BAABD]">
                  {selectedAdmin.name} ({selectedAdmin.email})
                </p>
              </div>
            </div>

            {formError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-2xl mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-10 pr-9 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-type new password"
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-[11px] text-amber-200/90 leading-relaxed">
                <Info className="w-4 h-4 text-amber-400 inline mr-1" />
                Changing this password will immediately terminate all active sessions for this administrator across all devices.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordOpen(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black transition cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Updating...' : 'Set New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08254D] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">
              Remove Administrator?
            </h3>
            <p className="text-xs text-[#9BAABD] leading-relaxed mb-4">
              Are you sure you want to permanently remove administrator{' '}
              <strong className="text-white">"{selectedAdmin.name}"</strong> ({selectedAdmin.email})?
              All associated administrative tokens will be immediately destroyed and revoked.
            </p>

            {formError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-2xl mb-4">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedAdmin(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isSubmitting ? 'Deleting...' : 'Delete Administrator'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVITATION DELIVERY DIAGNOSTIC MODAL */}
      {/* ========================================================================= */}
      {inviteResultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#08254D] border border-white/14 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setInviteResultModal(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-brand-sans">
                  Admin Created & Invitation Token Ready
                </h3>
                <p className="text-xs text-[#9BAABD]">
                  {inviteResultModal.adminName} ({inviteResultModal.adminEmail})
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Diagnostic status banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Admin account created, but invitation email could not be sent.</span>
                </div>
                <p className="text-[#9BAABD] text-[11px] leading-relaxed pl-6">
                  {inviteResultModal.emailError || 'SMTP email service is not configured on the server.'}
                </p>
              </div>

              {/* Secure invitation URL copy box */}
              {inviteResultModal.inviteUrl && (
                <div className="bg-[#04142F] border border-white/10 rounded-2xl p-4 space-y-2">
                  <label className="block text-[#9BAABD] font-bold text-[11px] uppercase tracking-wider">
                    Direct Invitation Link (Valid for 48 hours):
                  </label>
                  <div className="bg-[#061D40] border border-white/10 rounded-xl p-2.5 text-[11px] text-cyan-300 font-mono break-all select-all">
                    {inviteResultModal.inviteUrl}
                  </div>
                  <button
                    onClick={() => {
                      if (inviteResultModal.inviteUrl) {
                        navigator.clipboard.writeText(inviteResultModal.inviteUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 3000);
                      }
                    }}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#FFC928] hover:bg-[#ffe066] text-[#04142F] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                        <span>Invitation Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <span>Copy Invitation Link to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#9BAABD] text-[11px] leading-relaxed space-y-1">
                <span className="font-bold text-blue-300 block">💡 Server Email Configuration:</span>
                <span>
                  To enable automatic email delivery to Gmail addresses, set <code className="text-amber-300">SMTP_HOST</code>, <code className="text-amber-300">SMTP_USER</code>, and <code className="text-amber-300">SMTP_PASS</code> in your environment settings.
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInviteResultModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
