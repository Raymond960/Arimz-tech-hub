import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Save, Trash2, MessageCircle, RotateCcw, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { Place } from '../types';
import { compressAndValidateImage } from '../utils/imageCompressor';

const PAUL_GSM_ID = 'place-paul-gsm';
const DEFAULT_WHATSAPP = '+234 706 728 7969';

interface EditListingProps {
  onSaved?: (place: Place) => void;
  onClose?: () => void;
}

export const EditListing: React.FC<EditListingProps> = ({ onSaved, onClose }) => {
  const [listing, setListing] = useState<Place | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>(DEFAULT_WHATSAPP);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Clear obsolete localStorage quota key
  useEffect(() => {
    try {
      localStorage.removeItem('scListing_Photos_PaulGSMRepair');
    } catch {}
  }, []);

  // Fetch listing data from real server
  useEffect(() => {
    let isMounted = true;
    const fetchListing = async () => {
      try {
        const res = await fetch('/api/places');
        if (res.ok) {
          const places: Place[] = await res.json();
          const paulPlace = places.find(
            (p) => p.id === PAUL_GSM_ID || p.name.toLowerCase().includes('paul gsm')
          );
          if (paulPlace && isMounted) {
            setListing(paulPlace);
            setCoverPhoto(paulPlace.image || '');
            setPhotos(
              paulPlace.gallery && paulPlace.gallery.length > 0
                ? paulPlace.gallery
                : (paulPlace.image ? [paulPlace.image] : [])
            );
            setWhatsapp(paulPlace.whatsapp || DEFAULT_WHATSAPP);
          }
        }
      } catch (err) {
        console.warn('Could not fetch listing from server:', err);
      }
    };
    fetchListing();
    return () => {
      isMounted = false;
    };
  }, []);

  const getAdminToken = (): string => {
    return (
      sessionStorage.getItem('shendam_admin_token') ||
      localStorage.getItem('shendam_admin_token') ||
      ''
    );
  };

  const uploadFileToServer = async (file: File): Promise<string> => {
    let base64: string;
    try {
      const compressed = await compressAndValidateImage(file, 1200);
      base64 = compressed.dataUrl;
    } catch {
      base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const token = getAdminToken();
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}`, 'x-admin-token': token } : {})
      },
      body: JSON.stringify({
        fileData: base64,
        filename: file.name
      })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || 'Photo upload failed on server.');
    }

    const data = await res.json();
    return data.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading cover photo to permanent storage...');
    setErrorMessage(null);

    try {
      const permanentUrl = await uploadFileToServer(file);
      setCoverPhoto(permanentUrl);
      if (!photos.includes(permanentUrl)) {
        setPhotos([permanentUrl, ...photos]);
      }
      setSuccessMessage('Cover photo uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Cover upload error:', err);
      setErrorMessage(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStatus(`Uploading ${files.length} photo(s) to permanent storage...`);
    setErrorMessage(null);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadStatus(`Uploading photo ${i + 1} of ${files.length}...`);
        const url = await uploadFileToServer(files[i]);
        uploadedUrls.push(url);
      }

      const updated = [...photos];
      uploadedUrls.forEach((u) => {
        if (!updated.includes(u)) updated.push(u);
      });
      setPhotos(updated);

      if (!coverPhoto && uploadedUrls.length > 0) {
        setCoverPhoto(uploadedUrls[0]);
      }

      setSuccessMessage(`${uploadedUrls.length} photo(s) uploaded successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Gallery upload error:', err);
      setErrorMessage(err.message || 'Failed to upload one or more photos.');
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const photoToRemove = photos[index];
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    if (coverPhoto === photoToRemove) {
      setCoverPhoto(newPhotos[0] || '');
    }
  };

  const handleRemoveCoverPhoto = () => {
    setCoverPhoto('');
    setSuccessMessage('Cover photo cleared.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = getAdminToken();
      const payload: Partial<Place> = {
        image: coverPhoto || '',
        gallery: photos,
        whatsapp: whatsapp.trim() || DEFAULT_WHATSAPP
      };

      const res = await fetch(`/api/admin/places/${encodeURIComponent(PAUL_GSM_ID)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}`, 'x-admin-token': token } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save updates to Shendam Connect database.');
      }

      const resData = await res.json();
      if (resData.place) {
        setListing(resData.place);
        if (onSaved) onSaved(resData.place);
      }

      setSuccessMessage('Photos & WhatsApp number saved permanently to Shendam Connect directory!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Could not save to database. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsApp = () => {
    const cleanNum = whatsapp.replace(/[^0-9]/g, '');
    const intlNum = cleanNum.startsWith('0') ? '234' + cleanNum.substring(1) : cleanNum;
    window.open(`https://wa.me/${intlNum}?text=${encodeURIComponent('Hello Paul GSM Repair Services, I am contacting you from Shendam Connect.')}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-[#08254D] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wide">
            Edit Listing: Paul GSM Repair Services
          </h1>
          <p className="text-xs text-[#9BAABD] mt-1">
            Shop No. 10, Lu'uriemdet Plaza, Along Kalong Road, Texas, Shendam LGA
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-auto text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition"
          >
            Close
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-5 py-3 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 px-5 py-3 rounded-xl flex items-center gap-3">
          <X className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {uploadStatus && (
        <div className="bg-amber-500/15 border border-amber-500/40 text-amber-200 px-5 py-3 rounded-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          <span className="text-sm font-medium">{uploadStatus}</span>
        </div>
      )}

      {/* WHATSAPP CONTACT SECTION */}
      <div className="bg-[#08254D] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <h2 className="font-bold text-white text-sm uppercase">WhatsApp Button & Number</h2>
          </div>
          <button
            type="button"
            onClick={openWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg text-xs font-bold transition"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Test Chat
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+234 706 728 7969"
            className="w-full bg-[#04142F] border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-mono focus:border-[#FFC928] outline-none"
          />
          <button
            type="button"
            onClick={() => setWhatsapp(DEFAULT_WHATSAPP)}
            className="w-full sm:w-auto shrink-0 px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
          >
            Reset to +234 706 728 7969
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Clicking the WhatsApp button anywhere in Shendam Connect opens a chat with {whatsapp}.
        </p>
      </div>

      {/* MAIN COVER PHOTO */}
      <div className="bg-[#08254D] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#FFC928]" />
            <h2 className="font-bold text-white text-sm uppercase">Main Cover Photo *</h2>
          </div>
          {coverPhoto && (
            <button
              type="button"
              onClick={handleRemoveCoverPhoto}
              className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Cover Photo
            </button>
          )}
        </div>

        {coverPhoto ? (
          <div className="relative rounded-xl overflow-hidden h-52 sm:h-64 bg-black/40 border border-white/20">
            <img src={coverPhoto} alt="Main Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
              <span className="text-xs font-bold text-white bg-black/70 px-2.5 py-1 rounded-md">
                Active Cover Photo
              </span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-white/20 rounded-xl h-48 flex items-center justify-center">
            <p className="text-slate-400 text-sm">No cover photo selected</p>
          </div>
        )}

        <input
          type="file"
          ref={coverInputRef}
          onChange={handleCoverUpload}
          accept="image/*"
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#FFC928] hover:bg-[#f5be1c] disabled:opacity-50 text-[#04142F] font-black rounded-xl cursor-pointer active:scale-98 transition text-sm"
          >
            <Upload className="w-4 h-4" /> Upload New Cover Photo
          </button>
          {coverPhoto && (
            <button
              type="button"
              onClick={handleRemoveCoverPhoto}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-rose-300 hover:text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Clear Photo
            </button>
          )}
        </div>
      </div>

      {/* PHOTO GALLERY */}
      <div className="bg-[#08254D] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-sm uppercase">
            Photo Gallery ({photos.length} Photos)
          </h2>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition"
          >
            <Upload className="w-3.5 h-3.5" /> Add Gallery Photos
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleGalleryUpload}
          multiple
          accept="image/*"
          className="hidden"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-white/20 bg-black/40">
              <img src={photo} alt={`Gallery item ${i + 1}`} className="w-full h-28 object-cover" />
              <div className="absolute top-1 right-1 flex gap-1">
                {coverPhoto !== photo && (
                  <button
                    type="button"
                    onClick={() => setCoverPhoto(photo)}
                    title="Make Main Cover"
                    className="bg-black/70 hover:bg-[#FFC928] hover:text-black text-white p-1 rounded-md text-[10px] font-bold"
                  >
                    Set Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-md"
                  title="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {coverPhoto === photo && (
                <div className="absolute bottom-1 left-1 bg-[#FFC928] text-[#04142F] text-[10px] font-black px-1.5 py-0.5 rounded">
                  MAIN COVER
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SAVE & PUBLISH ACTION */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || isUploading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#FFC928] hover:bg-[#ffe071] disabled:opacity-60 text-[#04142F] font-black text-base rounded-xl cursor-pointer active:scale-98 transition shadow-lg"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>SAVING PERMANENTLY TO SHENDAM DATABASE...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>SAVE & PUBLISH TO DIRECTORY</span>
          </>
        )}
      </button>
    </div>
  );
};

export default EditListing;
