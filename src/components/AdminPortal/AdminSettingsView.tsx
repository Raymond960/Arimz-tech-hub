import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import { AdminSettings, AdminRole } from '../../types';

interface AdminSettingsViewProps {
  settings: AdminSettings;
  adminRole?: AdminRole | string;
  onSaveSettings: (settings: AdminSettings) => Promise<void>;
  onNavigateToAdmins?: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  settings,
  adminRole,
  onSaveSettings,
  onNavigateToAdmins
}) => {
  const [formData, setFormData] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      await onSaveSettings(formData);
      setSuccessMessage('Platform settings saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#FFC928]" />
            <span>Platform Configuration & Settings</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Configure LGA tourism parameters, contact channels, telemetry heartbeats, and administrative controls.
          </p>
        </div>
      </div>

      {/* Admin Management Section Link Banner */}
      {onNavigateToAdmins && (
        <div className="bg-gradient-to-r from-[#04142F] to-[#08254D] border border-[#FFC928]/30 rounded-3xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928] shrink-0 mt-0.5">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Settings → Admin Management</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FFC928] text-[#04142F] text-[10px] font-black uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-[#9BAABD] mt-1 leading-relaxed">
                Manage administrator accounts, assign Role-Based Access Control (RBAC) permissions, enable/disable accounts, and view security audit logs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToAdmins}
            className="px-4 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Open Admin Management</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-[#08254D] border border-white/12 rounded-3xl p-6 text-white space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928]">
          General LGA Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Platform Brand Name
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Support Email Address
            </label>
            <input
              type="email"
              value={formData.supportEmail}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Official Helpline / WhatsApp Phone
            </label>
            <input
              type="text"
              value={formData.supportPhone}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              LGA Office Headquarters Address
            </label>
            <input
              type="text"
              value={formData.lgaOfficeAddress}
              onChange={(e) => setFormData({ ...formData, lgaOfficeAddress: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] pt-3 border-t border-white/10">
          Telemetry & Operational Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Active User Timeout (Seconds)
            </label>
            <input
              type="number"
              value={formData.activeHeartbeatTimeoutSec}
              onChange={(e) => setFormData({ ...formData, activeHeartbeatTimeoutSec: Number(e.target.value) })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Platform Currency Symbol
            </label>
            <input
              type="text"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-white">
            <input
              type="checkbox"
              checked={formData.allowDirectBookings}
              onChange={(e) => setFormData({ ...formData, allowDirectBookings: e.target.checked })}
              className="w-4 h-4 rounded text-[#FFC928] bg-[#04142F] border-white/20"
            />
            <span>Enable Direct Guest Reservation Forms for Accommodations</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-white">
            <input
              type="checkbox"
              checked={formData.notificationEmailAlerts}
              onChange={(e) => setFormData({ ...formData, notificationEmailAlerts: e.target.checked })}
              className="w-4 h-4 rounded text-[#FFC928] bg-[#04142F] border-white/20"
            />
            <span>Send Administrator Email Notifications for New Bookings</span>
          </label>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black text-xs rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

    </div>
  );
};
