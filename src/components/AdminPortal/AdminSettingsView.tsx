import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Users,
  ArrowRight,
  Upload,
  Trash2,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { AdminSettings, AdminRole } from '../../types';
import { compressAndValidateImage, validateImageFile } from '../../utils/imageCompressor';

interface AdminSettingsViewProps {
  settings: AdminSettings;
  adminRole?: AdminRole | string;
  token?: string | null;
  initialFocusSection?: 'lga' | string;
  onSaveSettings: (settings: AdminSettings) => Promise<void>;
  onNavigateToAdmins?: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  settings,
  adminRole,
  token,
  initialFocusSection,
  onSaveSettings,
  onNavigateToAdmins
}) => {
  const [formData, setFormData] = useState<AdminSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // LGA Profile Image specific state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lgaImagePreview, setLgaImagePreview] = useState<string | null>(settings.lgaProfileImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData(settings);
    setLgaImagePreview(settings.lgaProfileImage || null);
    setSelectedFile(null);
    setSelectedFileDataUrl(null);
  }, [settings]);

  useEffect(() => {
    if (initialFocusSection === 'lga') {
      const el = document.getElementById('lga-content-management');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [initialFocusSection]);

  const handleLgaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMessage(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageMessage({ type: 'error', text: validation.error || 'Invalid file selected.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const result = await compressAndValidateImage(file, 800);
      setSelectedFile(file);
      setSelectedFileDataUrl(result.dataUrl);
      setLgaImagePreview(result.dataUrl);
      setImageMessage({
        type: 'success',
        text: `Selected "${file.name}" (${Math.round(result.compressedSize / 1024)} KB). Click "Save Changes" to apply.`
      });
    } catch (err: any) {
      setImageMessage({ type: 'error', text: `Failed to process image: ${err.message}` });
    }
  };

  const handleSaveLgaImageDirectly = async () => {
    if (!selectedFile || !selectedFileDataUrl) return;

    setIsUploadingImage(true);
    setImageMessage(null);

    try {
      const activeToken = token || sessionStorage.getItem('shendam_admin_token') || localStorage.getItem('shendam_admin_token');
      
      // Step 1: Upload the new image first and verify response
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}`, 'x-admin-token': activeToken } : {})
        },
        body: JSON.stringify({
          fileData: selectedFileDataUrl,
          filename: selectedFile.name,
          prefix: 'lga'
        })
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Image upload failed. Server rejected file.');
      }

      const uploadData = await uploadRes.json();
      const persistentUrl = uploadData.url;
      if (!persistentUrl) {
        throw new Error('Upload completed but no permanent URL returned.');
      }

      // Step 2: Save the new image reference to database settings
      const updatedSettings: AdminSettings = {
        ...formData,
        lgaProfileImage: persistentUrl
      };

      await onSaveSettings(updatedSettings);

      setFormData(updatedSettings);
      setLgaImagePreview(persistentUrl);
      setSelectedFile(null);
      setSelectedFileDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setImageMessage({
        type: 'success',
        text: 'Shendam Local Government profile image saved successfully and updated live!'
      });
      setTimeout(() => setImageMessage(null), 5000);
    } catch (err: any) {
      setImageMessage({
        type: 'error',
        text: `Save failed: ${err.message || 'Could not save image.'}. Previous image was not modified.`
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteLgaImage = async () => {
    if (!window.confirm('Are you sure you want to remove the custom Shendam Local Government profile image? The card will revert to the neutral placeholder.')) {
      return;
    }

    setIsUploadingImage(true);
    setImageMessage(null);

    try {
      const updatedSettings: AdminSettings = {
        ...formData,
        lgaProfileImage: null
      };

      await onSaveSettings(updatedSettings);

      setFormData(updatedSettings);
      setLgaImagePreview(null);
      setSelectedFile(null);
      setSelectedFileDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setImageMessage({
        type: 'success',
        text: 'Shendam Local Government image removed. Profile page reverted to neutral placeholder.'
      });
      setTimeout(() => setImageMessage(null), 5000);
    } catch (err: any) {
      setImageMessage({
        type: 'error',
        text: `Failed to remove image: ${err.message || 'Error occurred.'}`
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      let finalSettings = { ...formData };

      // If an image was selected but not individually saved yet, upload and persist it
      if (selectedFile && selectedFileDataUrl) {
        const activeToken = token || sessionStorage.getItem('shendam_admin_token') || localStorage.getItem('shendam_admin_token');
        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { Authorization: `Bearer ${activeToken}`, 'x-admin-token': activeToken } : {})
          },
          body: JSON.stringify({
            fileData: selectedFileDataUrl,
            filename: selectedFile.name,
            prefix: 'lga'
          })
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            finalSettings.lgaProfileImage = uploadData.url;
            setLgaImagePreview(uploadData.url);
            setSelectedFile(null);
            setSelectedFileDataUrl(null);
          }
        }
      }

      await onSaveSettings(finalSettings);
      setFormData(finalSettings);
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
          Platform & Support Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Platform Brand Name
            </label>
            <input
              type="text"
              value={formData.platformName || ''}
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
              value={formData.supportEmail || ''}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Official Helpline Phone
            </label>
            <input
              type="text"
              value={formData.supportPhone || ''}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Support WhatsApp Line
            </label>
            <input
              type="text"
              placeholder="+2348030007436"
              value={formData.supportWhatsapp || ''}
              onChange={(e) => setFormData({ ...formData, supportWhatsapp: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Support Hours / Availability
            </label>
            <input
              type="text"
              placeholder="Mon - Sat: 8:00 AM - 6:00 PM"
              value={formData.supportHours || ''}
              onChange={(e) => setFormData({ ...formData, supportHours: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Support Helpdesk Description
            </label>
            <textarea
              rows={2}
              placeholder="Need assistance with your business listing, bookings, or community inquiries? Reach our dedicated support team."
              value={formData.supportDescription || ''}
              onChange={(e) => setFormData({ ...formData, supportDescription: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928] resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              LGA Office Headquarters Address
            </label>
            <input
              type="text"
              value={formData.lgaOfficeAddress || ''}
              onChange={(e) => setFormData({ ...formData, lgaOfficeAddress: e.target.value })}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            />
          </div>
        </div>

        {/* Content Management → Shendam Local Government Public Profile & Information */}
        <div id="lga-content-management" className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC928] bg-[#FFC928]/15 px-2 py-0.5 rounded border border-[#FFC928]/30">
                  Content Management
                </span>
                <span className="text-xs text-[#9BAABD]">&rarr;</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFC928]">
                  Shendam Local Government (Public Profile & Logo)
                </h3>
              </div>
              <p className="text-[11px] text-[#9BAABD] mt-1">
                Manage all official Shendam Local Government public information, emblems, websites, heritage guides, and emergency numbers.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
              Public Profile Card
            </span>
          </div>

          {/* Current Shendam Local Government Image & Controls */}
          <div className="bg-[#04142F] border border-white/12 rounded-2xl p-4 space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Image Preview Box */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg ring-2 ring-[#FFC928]/50 bg-[#08254D] flex items-center justify-center">
                  {lgaImagePreview ? (
                    <img
                      src={lgaImagePreview}
                      alt="Current Shendam Local Government Profile"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 text-[#9BAABD] bg-[#061D40]">
                      <Building2 className="w-8 h-8 text-[#FFC928]/70 mb-1" />
                      <span className="text-[9px] font-semibold text-white/70">Neutral Placeholder</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls and descriptions */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Current Shendam Local Government Image
                  </h4>
                  {lgaImagePreview ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                      Active Image
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#FFC928] bg-[#FFC928]/15 px-2 py-0.5 rounded border border-[#FFC928]/30">
                      Neutral Placeholder
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9BAABD] leading-relaxed">
                  The image displayed beside the &quot;Shendam Local Government&quot; title on the Profile page. Upload an official emblem, seal, or photograph.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleLgaFileSelect}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3.5 py-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lgaImagePreview ? 'Replace Image' : 'Upload / Choose Image'}</span>
                  </button>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleSaveLgaImageDirectly}
                      disabled={isUploadingImage}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  )}

                  {lgaImagePreview && (
                    <button
                      type="button"
                      onClick={handleDeleteLgaImage}
                      disabled={isUploadingImage}
                      className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      title="Reset to neutral placeholder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Image</span>
                    </button>
                  )}
                </div>

                {/* Notifications & Status messages */}
                {imageMessage && (
                  <div className={`text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 mt-2 ${
                    imageMessage.type === 'success'
                      ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                      : 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                  }`}>
                    {imageMessage.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    )}
                    <span>{imageMessage.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Local Government Name / Title
                </label>
                <input
                  type="text"
                  placeholder="Shendam Local Government"
                  value={formData.lgaPublicInfoTitle || ''}
                  onChange={(e) => setFormData({ ...formData, lgaPublicInfoTitle: e.target.value })}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  State / Region Tag
                </label>
                <input
                  type="text"
                  placeholder="Plateau State, Nigeria"
                  value={formData.lgaStateRegion || ''}
                  onChange={(e) => setFormData({ ...formData, lgaStateRegion: e.target.value })}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                Public Overview & Description
              </label>
              <textarea
                rows={3}
                placeholder="Official public and community information for Shendam Local Government Area..."
                value={formData.lgaPublicInfoDescription || ''}
                onChange={(e) => setFormData({ ...formData, lgaPublicInfoDescription: e.target.value })}
                className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Official Local Government Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://shendam.plateaustate.gov.ng"
                  value={formData.lgaOfficialWebsiteUrl || ''}
                  onChange={(e) => setFormData({ ...formData, lgaOfficialWebsiteUrl: e.target.value })}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Website Button Label
                </label>
                <input
                  type="text"
                  placeholder="Official Local Government Website"
                  value={formData.lgaOfficialWebsiteLabel || ''}
                  onChange={(e) => setFormData({ ...formData, lgaOfficialWebsiteLabel: e.target.value })}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>

            {/* Culture & Heritage Section Controls */}
            <div className="p-4 bg-[#04142F] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFC928] flex items-center gap-1.5">
                <span>Culture & Heritage Guide Section</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Heritage Section Title
                  </label>
                  <input
                    type="text"
                    placeholder="Goemai Heritage & Monarch"
                    value={formData.lgaCultureTitle || ''}
                    onChange={(e) => setFormData({ ...formData, lgaCultureTitle: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Card Badge Text
                  </label>
                  <input
                    type="text"
                    placeholder="Public Info"
                    value={formData.lgaBadgeText || ''}
                    onChange={(e) => setFormData({ ...formData, lgaBadgeText: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Culture & Heritage Text
                </label>
                <textarea
                  rows={2}
                  placeholder="Shendam is the traditional seat of the Long Goemai, supreme ruler of the Goemai Kingdom..."
                  value={formData.lgaCultureDescription || ''}
                  onChange={(e) => setFormData({ ...formData, lgaCultureDescription: e.target.value })}
                  className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD]/50 outline-none focus:border-[#FFC928] resize-none"
                />
              </div>
            </div>

            {/* Emergency Hotlines Controls */}
            <div className="p-4 bg-[#04142F] border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFC928]">
                Emergency Hotlines Section
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotlines Title
                  </label>
                  <input
                    type="text"
                    placeholder="Emergency Hotlines"
                    value={formData.emergencyHotlinesTitle || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyHotlinesTitle: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotlines Badge
                  </label>
                  <input
                    type="text"
                    placeholder="24/7 Response"
                    value={formData.emergencyHotlinesBadge || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyHotlinesBadge: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* Line 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-white/8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotline 1 Name
                  </label>
                  <input
                    type="text"
                    placeholder="National Emergency"
                    value={formData.emergencyPhone1Label || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone1Label: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotline 1 Dial Number
                  </label>
                  <input
                    type="text"
                    placeholder="112"
                    value={formData.emergencyPhone1Number || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone1Number: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotline 1 Display Label
                  </label>
                  <input
                    type="text"
                    placeholder="Dial 112"
                    value={formData.emergencyPhone1Display || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone1Display: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* Line 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-white/8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotline 2 Name
                  </label>
                  <input
                    type="text"
                    placeholder="General Hospital"
                    value={formData.emergencyPhone2Label || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone2Label: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotline 2 Dial Number
                  </label>
                  <input
                    type="text"
                    placeholder="+2348039110000"
                    value={formData.emergencyPhone2Number || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone2Number: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Hotline 2 Display Label
                  </label>
                  <input
                    type="text"
                    placeholder="+234 803 911 0000"
                    value={formData.emergencyPhone2Display || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone2Display: e.target.value })}
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>
            </div>
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
