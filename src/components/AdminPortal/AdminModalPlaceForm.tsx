import React, { useState, useEffect, useRef } from 'react';
import { Place, CategoryId, HotelRoom, MenuItem } from '../../types';
import { compressAndValidateImage } from '../../utils/imageCompressor';
import {
  X,
  Building2,
  Upload,
  Sparkles,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Check,
  Image as ImageIcon,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  ShieldCheck,
  Tag,
  Plus,
  Compass,
  FileCheck,
  AlertCircle,
  ExternalLink,
  User,
  ShoppingBag,
  Wrench,
  DollarSign,
  Utensils,
  BedDouble,
  HeartHandshake,
  CheckCircle2,
  Loader2,
  CreditCard,
  Copy,
  Info
} from 'lucide-react';

interface AdminModalPlaceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (placeData: Partial<Place>) => Promise<void>;
  initialData?: Place | null;
  defaultCategory?: CategoryId;
  authToken?: string | null;
  onPlaceUpdated?: (place: Place) => void;
}

const CATEGORY_OPTIONS: Array<{ id: CategoryId; label: string; icon: string }> = [
  { id: 'hotels', label: 'Hotels & Lodging', icon: '🏨' },
  { id: 'restaurants', label: 'Restaurants, Food & Dining', icon: '🍲' },
  { id: 'businesses', label: 'Local Businesses & Commercial', icon: '🏪' },
  { id: 'tourist_spots', label: 'Tourist Attractions & Heritage', icon: '🏞️' },
  { id: 'services', label: 'Tech & Professional Services', icon: '🔧' },
  { id: 'transport', label: 'Transport, Logistics & Motor Parks', icon: '🚗' },
  { id: 'shopping', label: 'Shopping, Markets & Retail', icon: '🛍️' },
  { id: 'health', label: 'Healthcare & Pharmacy', icon: '💊' },
  { id: 'emergency', label: 'Emergency & Safety Services', icon: '🚨' },
  { id: 'events', label: 'Entertainment & Event Centers', icon: '🎉' },
  { id: 'more', label: 'Other Enterprises', icon: '🏢' }
];

const SHENDAM_AREAS = [
  'Shendam Central',
  'Texas Area',
  'Kalong Road',
  'Yelwa Road',
  'Central Market Area',
  'Shimankar Axis',
  'Mass Transit Hub',
  'Angwan Rogo',
  'Dokan Tofa',
  'Pankshin Road Axis',
  'Lafia Bypass',
  'Ngas Junction'
];

const PRESET_COORDINATES = [
  { label: 'Shendam Central', lat: 8.877, lng: 9.506 },
  { label: 'Texas Hub', lat: 8.882, lng: 9.512 },
  { label: 'Central Market', lat: 8.875, lng: 9.503 },
  { label: 'Mass Transit Park', lat: 8.871, lng: 9.498 },
  { label: 'Kalong Road Junction', lat: 8.889, lng: 9.521 },
  { label: 'Shimankar District', lat: 8.910, lng: 9.540 }
];

const HOTEL_DEFAULT_AMENITIES = [
  'Standby 24/7 Power Generator',
  'Clean Towels & Toiletries',
  'Air Conditioning (AC)',
  'Microwave in Suite',
  'Coffee & Tea Maker',
  'Mini Bar / Fridge',
  'High-Speed Wi-Fi',
  'Secured Parking Space',
  'Private Balcony',
  'Swimming Pool Access',
  'Flat Screen Cable TV (DSTV)',
  '24-Hour Security Patrol'
];

const TECH_DEFAULT_BRANDS = [
  'Samsung',
  'Apple iPhone',
  'Tecno',
  'Infinix',
  'Xiaomi / Redmi',
  'itel',
  'Oppo',
  'Vivo',
  'Nokia',
  'Huawei'
];

export const AdminModalPlaceForm: React.FC<AdminModalPlaceFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCategory = 'services',
  authToken,
  onPlaceUpdated
}) => {
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId>(defaultCategory);
  const [categoryLabel, setCategoryLabel] = useState('');
  const [owner, setOwner] = useState('');
  const [area, setArea] = useState('Shendam Central');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [openingHours, setOpeningHours] = useState('8:00 AM - 6:00 PM (Mon - Sat)');
  const [description, setDescription] = useState('');
  
  // Pricing
  const [priceRange, setPriceRange] = useState<'₦' | '₦₦' | '₦₦₦' | '₦₦₦₦' | 'Free'>('₦₦');
  const [priceDetails, setPriceDetails] = useState('');

  // Location & Map
  const [lat, setLat] = useState('8.877');
  const [lng, setLng] = useState('9.506');
  const [directionsUrl, setDirectionsUrl] = useState('');

  // Status & Badges
  const [verified, setVerified] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [popular, setPopular] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  // Offerings State
  const [servicesList, setServicesList] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [productsList, setProductsList] = useState<string[]>([]);
  const [productInput, setProductInput] = useState('');
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  
  // Hotel Rooms
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomPriceInput, setRoomPriceInput] = useState('');
  const [roomDescInput, setRoomDescInput] = useState('');

  // Restaurant Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuNameInput, setMenuNameInput] = useState('');
  const [menuPriceInput, setMenuPriceInput] = useState('');
  const [menuDescInput, setMenuDescInput] = useState('');
  const [dineInAvailable, setDineInAvailable] = useState(true);
  const [takeawayAvailable, setTakeawayAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);

  // Tech & Repair
  const [supportedBrands, setSupportedBrands] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [accessories, setAccessories] = useState<string[]>([]);
  const [accessoryInput, setAccessoryInput] = useState('');

  // Tourist & Cultural Heritage
  const [culturalSignificance, setCulturalSignificance] = useState('');
  const [entryFee, setEntryFee] = useState('Free Admission');
  const [guideAvailable, setGuideAvailable] = useState(true);

  // Health & Emergency
  const [emergencyHotline, setEmergencyHotline] = useState('');
  const [ambulanceAvailable, setAmbulanceAvailable] = useState(false);

  // Photos & Media
  const [image, setImage] = useState('');
  const [logo, setLogo] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  // Direct Business / Hotel Payment Details
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [paymentReferenceFormat, setPaymentReferenceFormat] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'VERIFIED' | 'PENDING_VERIFICATION' | 'DISABLED'>('VERIFIED');

  // UI / Upload states
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'location' | 'offerings' | 'payment'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localMainPreview, setLocalMainPreview] = useState<string | null>(null);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoToDeleteTarget, setPhotoToDeleteTarget] = useState<{ url: string; type: 'main' | 'gallery'; idx?: number } | null>(null);

  // Helper to format clear upload error message with explicit reason
  const formatUploadError = (err: any): string => {
    const rawMsg = err?.message || 'Check file size or internet connection.';
    let reason = rawMsg.replace(/^Upload failed:\s*/i, '').trim();
    if (reason.endsWith('.')) {
      reason = reason.slice(0, -1);
    }
    if (!reason.toLowerCase().includes('check file size or internet')) {
      reason = `${reason}. Check file size or internet.`;
    } else {
      reason = `${reason}.`;
    }
    return `Upload failed: ${reason}`;
  };

  // Hidden File Inputs for Mobile & Desktop Pickers
  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Get Auth Token helper
  const getEffectiveToken = (): string => {
    return (
      authToken ||
      sessionStorage.getItem('shendam_admin_token') ||
      localStorage.getItem('shendam_admin_token') ||
      ''
    );
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || defaultCategory);
      setCategoryLabel(initialData.categoryLabel || '');
      setOwner(initialData.owner || '');
      setArea(initialData.area || 'Shendam Central');
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      setWhatsapp(initialData.whatsapp || '');
      setOpeningHours(initialData.openingHours || '8:00 AM - 6:00 PM');
      setDescription(initialData.description || '');
      setPriceRange((initialData.priceRange as any) || '₦₦');
      setPriceDetails(initialData.priceDetails || '');
      setImage(initialData.image || '');
      setLogo(initialData.logo || '');
      setGallery(initialData.gallery && initialData.gallery.length > 0 ? initialData.gallery : (initialData.image ? [initialData.image] : []));
      setVerified(initialData.verified !== undefined ? Boolean(initialData.verified) : true);
      setFeatured(Boolean(initialData.featured));
      setPopular(Boolean(initialData.popular));
      setStatus(initialData.status === 'draft' ? 'draft' : 'published');
      
      setServicesList(initialData.services || []);
      setProductsList(initialData.products || []);
      setAmenitiesList(initialData.amenities || (initialData.category === 'hotels' ? HOTEL_DEFAULT_AMENITIES.slice(0, 6) : []));
      setRooms(initialData.rooms || []);
      setMenuItems(initialData.menuItems || []);
      setSupportedBrands(initialData.supportedBrands || (initialData.category === 'services' || initialData.category === 'businesses' ? TECH_DEFAULT_BRANDS.slice(0, 5) : []));
      setAccessories(initialData.accessories || []);
      setCulturalSignificance(initialData.culturalSignificance || '');
      setEntryFee(initialData.entryFee || 'Free Admission');
      setGuideAvailable(initialData.guideAvailable ?? true);
      setDineInAvailable(initialData.dineInAvailable ?? true);
      setTakeawayAvailable(initialData.takeawayAvailable ?? true);
      setDeliveryAvailable(initialData.deliveryAvailable ?? false);
      setEmergencyHotline(initialData.emergencyHotline || initialData.phone || '');
      setAmbulanceAvailable(initialData.ambulanceAvailable ?? false);

      setLat(initialData.coordinates?.lat ? String(initialData.coordinates.lat) : '8.877');
      setLng(initialData.coordinates?.lng ? String(initialData.coordinates.lng) : '9.506');
      setDirectionsUrl(initialData.directionsUrl || '');

      // Load Payment Details if present
      if (initialData.paymentDetails) {
        setAccountName(initialData.paymentDetails.accountName || '');
        setAccountNumber(initialData.paymentDetails.accountNumber || '');
        setBankName(initialData.paymentDetails.bankName || '');
        setPaymentInstructions(initialData.paymentDetails.paymentInstructions || '');
        setPaymentReferenceFormat(initialData.paymentDetails.paymentReferenceFormat || '');
        setPaymentStatus(initialData.paymentDetails.status || 'VERIFIED');
      } else {
        setAccountName('');
        setAccountNumber('');
        setBankName('');
        setPaymentInstructions('');
        setPaymentReferenceFormat('');
        setPaymentStatus('VERIFIED');
      }
    } else {
      // New listing initialization
      setName('');
      setCategory(defaultCategory);
      const catObj = CATEGORY_OPTIONS.find((c) => c.id === defaultCategory);
      setCategoryLabel(catObj ? catObj.label : 'Business Listing');
      setOwner('');
      setArea('Shendam Central');
      setAddress('Shendam Town, Plateau State');
      setPhone('+234 ');
      setWhatsapp('+234 ');
      setOpeningHours('8:00 AM - 6:00 PM (Mon - Sat)');
      setDescription('');
      setPriceRange('₦₦');
      setPriceDetails('');
      setImage('');
      setLogo('');
      setGallery([]);
      setVerified(true);
      setFeatured(false);
      setPopular(false);
      setStatus('published');

      if (defaultCategory === 'hotels') {
        setRooms([
          { name: 'Standard Room', price: '₦15,000 / night', description: 'Comfortable double bed, AC, private bath & DSTV' },
          { name: 'Super Deluxe Suite', price: '₦25,000 / night', description: 'King bed, balcony, mini-bar, microwave & work desk' },
          { name: 'Presidential Suite', price: '₦35,000 / night', description: 'Luxury living room, jacuzzi, 24/7 butler support' }
        ]);
        setAmenitiesList(HOTEL_DEFAULT_AMENITIES.slice(0, 8));
        setServicesList(['24/7 Front Desk', 'Standby Power Generator', 'Laundry & Dry Cleaning', 'Airport/Transit Pickup']);
        setProductsList([]);
      } else if (defaultCategory === 'restaurants') {
        setMenuItems([
          { name: 'Special Jollof Rice & Fried Chicken', price: '₦2,500', description: 'Served with coleslaw & fried plantain' },
          { name: 'Traditional Masa & Miyan Taushe', price: '₦1,800', description: 'Authentic Goemai delicacy with goat meat' },
          { name: 'Assorted Pepper Soup / Suya Grill', price: '₦3,000', description: 'Spiced tender beef / goat meat with chilled drinks' }
        ]);
        setServicesList(['Dine-In Restaurant', 'Takeaway Pack', 'Event Catering', 'Chilled Beverages']);
        setProductsList([]);
      } else if (defaultCategory === 'services' || defaultCategory === 'businesses') {
        setServicesList(['Hardware Diagnostic', 'Screen Replacement', 'Software Flash & Unlock', 'Battery Replacement']);
        setProductsList(['Type-C Fast Chargers', 'Original Batteries', 'Tempered Glass Screen Guards', 'Power Banks']);
        setSupportedBrands(TECH_DEFAULT_BRANDS.slice(0, 6));
        setAccessories(['Earphones', 'Phone Cases', 'OTG Adapters', 'Memory Cards']);
      } else if (defaultCategory === 'tourist_spots') {
        setCulturalSignificance('Historical and cultural landmark representing Shendam LGA heritage, breathtaking landscapes, and traditional festivities.');
        setEntryFee('Free Admission');
        setGuideAvailable(true);
        setServicesList(['Guided Tours', 'Photography Points', 'Historical Briefing', 'Cultural Souvenirs']);
      } else {
        setServicesList(['Customer Support', 'Verified Shendam Service', 'Quality Guarantee']);
        setProductsList([]);
        setAmenitiesList([]);
        setRooms([]);
        setMenuItems([]);
      }

      setLat('8.877');
      setLng('9.506');
      setDirectionsUrl('');
    }
    setErrorMsg(null);
    setUploadStatus(null);
  }, [initialData, defaultCategory, isOpen]);

  if (!isOpen) return null;

  // DIRECT PHOTO UPLOAD HELPER WITH COMPRESSION, VALIDATION & SERVER PERSISTENCE
  const uploadImageFile = async (file: File): Promise<string> => {
    // 1. Validate & compress on client (Max 1600px, WebP/JPEG output, up to 30MB)
    const compressed = await compressAndValidateImage(file);
    const token = getEffectiveToken();

    if (!token) {
      throw new Error('Admin session expired. Please refresh and log in again to save photos permanently.');
    }

    // 2. Upload compressed payload to server storage (/public/uploads & shendam_db.json)
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-admin-token': token
      },
      body: JSON.stringify({
        fileData: compressed.dataUrl,
        filename: file.name
      })
    });

    if (!res.ok) {
      let errMsg = 'Failed to upload photo to server.';
      try {
        const errJson = await res.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {
        // Fallback message
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    if (!data.url) {
      throw new Error('Server upload succeeded but did not return a valid image URL.');
    }

    return data.url;
  };

  // Main Photo Upload with Preview & Immediate Persistence
  const handleMainPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploading(true);
    setUploadProgressPercent(20);
    setUploadStatus('Compressing photo on device...');

    const tempPreviewUrl = URL.createObjectURL(file);
    setLocalMainPreview(tempPreviewUrl);

    try {
      setUploadProgressPercent(50);
      setUploadStatus('Uploading photo to server storage...');
      const permanentUrl = await uploadImageFile(file);
      
      // Update main image and gallery with permanent URL (filtering out any temporary blob URLs)
      setImage(permanentUrl);
      let updatedGallery = gallery.filter((u) => u && !u.startsWith('blob:'));
      if (!updatedGallery.includes(permanentUrl)) {
        updatedGallery = [permanentUrl, ...updatedGallery];
      }
      setGallery(updatedGallery);

      // If editing an existing listing, persist image change to database immediately
      const token = getEffectiveToken();
      if (initialData?.id && token) {
        setUploadProgressPercent(85);
        setUploadStatus('Updating business record in database...');
        try {
          const updateRes = await fetch(`/api/admin/places/${encodeURIComponent(initialData.id)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'x-admin-token': token
            },
            body: JSON.stringify({
              image: permanentUrl,
              gallery: updatedGallery
            })
          });
          if (updateRes.ok) {
            const resData = await updateRes.json();
            if (resData.place && onPlaceUpdated) {
              onPlaceUpdated(resData.place);
            }
          }
        } catch (dbErr) {
          console.warn('[Main Photo DB Sync Warning]', dbErr);
        }
      }

      setUploadProgressPercent(100);
      setUploadStatus('Photo permanently saved.');
      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgressPercent(null);
      }, 3000);
    } catch (err: any) {
      console.error('[Main Photo Upload Error]', err);
      setErrorMsg(formatUploadError(err));
      setUploadStatus(null);
      setUploadProgressPercent(null);
    } finally {
      setIsUploading(false);
      setLocalMainPreview(null);
      try { URL.revokeObjectURL(tempPreviewUrl); } catch {}
      if (mainPhotoInputRef.current) mainPhotoInputRef.current.value = '';
    }
  };

  // Logo Upload with Preview & Immediate Persistence
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsUploading(true);
    setUploadProgressPercent(20);
    setUploadStatus('Compressing logo...');

    const tempPreviewUrl = URL.createObjectURL(file);
    setLocalLogoPreview(tempPreviewUrl);

    try {
      setUploadProgressPercent(50);
      setUploadStatus('Uploading logo to storage...');
      const permanentUrl = await uploadImageFile(file);
      
      setLogo(permanentUrl);

      const token = getEffectiveToken();
      if (initialData?.id && token) {
        setUploadProgressPercent(85);
        setUploadStatus('Updating business logo in database...');
        try {
          const updateRes = await fetch(`/api/admin/places/${encodeURIComponent(initialData.id)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'x-admin-token': token
            },
            body: JSON.stringify({
              logo: permanentUrl
            })
          });
          if (updateRes.ok) {
            const resData = await updateRes.json();
            if (resData.place && onPlaceUpdated) {
              onPlaceUpdated(resData.place);
            }
          }
        } catch (dbErr) {
          console.warn('[Logo DB Sync Warning]', dbErr);
        }
      }

      setUploadProgressPercent(100);
      setUploadStatus('Logo permanently saved.');
      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgressPercent(null);
      }, 3000);
    } catch (err: any) {
      console.error('[Logo Upload Error]', err);
      setErrorMsg(formatUploadError(err));
      setUploadStatus(null);
      setUploadProgressPercent(null);
    } finally {
      setIsUploading(false);
      setLocalLogoPreview(null);
      try { URL.revokeObjectURL(tempPreviewUrl); } catch {}
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Gallery Photos Upload with Sequential Execution & Immediate Persistence
  const handleGalleryPhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    setIsUploading(true);
    const fileList: File[] = Array.from(files);
    setUploadProgressPercent(10);
    setUploadStatus(`Preparing ${fileList.length} photo(s)...`);

    const uploadedUrls: string[] = [];
    let hasFailures = false;
    let lastError = '';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const stepPercent = Math.round(((i + 1) / fileList.length) * 75);
      setUploadProgressPercent(stepPercent);
      setUploadStatus(`Uploading photo ${i + 1} of ${fileList.length} to storage...`);
      try {
        const permanentUrl = await uploadImageFile(file);
        if (!uploadedUrls.includes(permanentUrl)) {
          uploadedUrls.push(permanentUrl);
        }
      } catch (err: any) {
        hasFailures = true;
        lastError = err.message;
        console.error(`Gallery upload failed for ${file.name}:`, err);
      }
    }

    if (uploadedUrls.length > 0) {
      let updatedGallery = gallery.filter((u) => u && !u.startsWith('blob:'));
      uploadedUrls.forEach((url) => {
        if (!updatedGallery.includes(url)) updatedGallery.push(url);
      });
      setGallery(updatedGallery);

      if (!image) {
        setImage(uploadedUrls[0]);
      }

      const token = getEffectiveToken();
      if (initialData?.id && token) {
        try {
          setUploadProgressPercent(90);
          setUploadStatus('Updating gallery in database...');
          const updateRes = await fetch(`/api/admin/places/${encodeURIComponent(initialData.id)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'x-admin-token': token
            },
            body: JSON.stringify({
              gallery: updatedGallery,
              image: image || uploadedUrls[0]
            })
          });
          if (updateRes.ok) {
            const resData = await updateRes.json();
            if (resData.place && onPlaceUpdated) {
              onPlaceUpdated(resData.place);
            }
          }
        } catch (dbErr: any) {
          console.warn('[Gallery DB Sync Warning]', dbErr);
        }
      }

      setUploadProgressPercent(100);
      setUploadStatus(hasFailures ? 'Some photos saved successfully.' : 'All gallery photos saved.');
      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgressPercent(null);
      }, 4000);
    }

    if (hasFailures) {
      setErrorMsg(formatUploadError(new Error(lastError || 'Could not process all gallery photos.')));
      setUploadStatus(null);
      setUploadProgressPercent(null);
    }

    setIsUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Main Photo Deletion
  const handleDeleteMainPhoto = () => {
    if (!image) return;
    setPhotoToDeleteTarget({ url: image, type: 'main' });
  };

  const executeDeleteMainPhoto = async () => {
    const photoToDelete = image;
    setPhotoToDeleteTarget(null);
    const nextPhoto = gallery.find((g) => g !== photoToDelete) || '';
    setImage(nextPhoto);
    const updatedGallery = gallery.filter((g) => g !== photoToDelete);
    setGallery(updatedGallery);

    const token = getEffectiveToken();
    if (initialData?.id && token) {
      try {
        setUploadStatus('Deleting photo from storage...');
        const res = await fetch(`/api/admin/places/${encodeURIComponent(initialData.id)}/photos`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-admin-token': token
          },
          body: JSON.stringify({ photoUrl: photoToDelete })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.place && onPlaceUpdated) {
            onPlaceUpdated(resData.place);
          }
          setUploadStatus('Photo permanently deleted.');
        }
      } catch (err) {
        console.warn('[Delete Photo Error]', err);
      }
    } else if (photoToDelete.includes('/uploads/')) {
      try {
        await fetch('/api/admin/media', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-admin-token': token
          },
          body: JSON.stringify({ mediaUrl: photoToDelete })
        });
      } catch {}
    }

    setTimeout(() => setUploadStatus(null), 3000);
  };

  // Gallery Actions with Permanent Server & Storage Sync
  const handleRemoveGalleryImage = (idxToRemove: number) => {
    const photoToRemove = gallery[idxToRemove];
    if (!photoToRemove) return;
    setPhotoToDeleteTarget({ url: photoToRemove, type: 'gallery', idx: idxToRemove });
  };

  const executeRemoveGalleryImage = async (idxToRemove: number) => {
    const photoToRemove = gallery[idxToRemove];
    if (!photoToRemove) return;
    setPhotoToDeleteTarget(null);

    const updatedGallery = gallery.filter((_, idx) => idx !== idxToRemove);
    setGallery(updatedGallery);

    if (image === photoToRemove) {
      setImage(updatedGallery.length > 0 ? updatedGallery[0] : '');
    }

    const token = getEffectiveToken();
    if (initialData?.id && token) {
      try {
        setUploadStatus('Deleting photo from server storage...');
        const res = await fetch(`/api/admin/places/${encodeURIComponent(initialData.id)}/photos`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-admin-token': token
          },
          body: JSON.stringify({ photoUrl: photoToRemove })
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.place && onPlaceUpdated) {
            onPlaceUpdated(resData.place);
          }
          setUploadStatus('Photo permanently deleted.');
        }
      } catch (err) {
        console.warn('[Delete Gallery Photo Error]', err);
      }
    } else if (photoToRemove.includes('/uploads/')) {
      try {
        await fetch('/api/admin/media', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-admin-token': token
          },
          body: JSON.stringify({ mediaUrl: photoToRemove })
        });
      } catch {}
    }

    setTimeout(() => setUploadStatus(null), 3000);
  };

  const handleSetAsMainImage = (imgUrl: string) => {
    setImage(imgUrl);
    setUploadStatus('Selected as main cover photo.');
    setTimeout(() => setUploadStatus(null), 2000);
  };

  const handleMoveGalleryImage = (index: number, direction: 'up' | 'down') => {
    setGallery((prev) => {
      const newGallery = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newGallery.length) return prev;
      const temp = newGallery[index];
      newGallery[index] = newGallery[targetIndex];
      newGallery[targetIndex] = temp;
      return newGallery;
    });
  };

  // Add Item Helpers
  const handleAddService = () => {
    if (serviceInput.trim() && !servicesList.includes(serviceInput.trim())) {
      setServicesList([...servicesList, serviceInput.trim()]);
      setServiceInput('');
    }
  };

  const handleAddProduct = () => {
    if (productInput.trim() && !productsList.includes(productInput.trim())) {
      setProductsList([...productsList, productInput.trim()]);
      setProductInput('');
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !amenitiesList.includes(amenityInput.trim())) {
      setAmenitiesList([...amenitiesList, amenityInput.trim()]);
      setAmenityInput('');
    }
  };

  const handleAddRoom = () => {
    if (roomNameInput.trim() && roomPriceInput.trim()) {
      setRooms([
        ...rooms,
        {
          name: roomNameInput.trim(),
          price: roomPriceInput.trim(),
          description: roomDescInput.trim() || undefined
        }
      ]);
      setRoomNameInput('');
      setRoomPriceInput('');
      setRoomDescInput('');
    }
  };

  const handleAddMenuItem = () => {
    if (menuNameInput.trim() && menuPriceInput.trim()) {
      setMenuItems([
        ...menuItems,
        {
          name: menuNameInput.trim(),
          price: menuPriceInput.trim(),
          description: menuDescInput.trim() || undefined
        }
      ]);
      setMenuNameInput('');
      setMenuPriceInput('');
      setMenuDescInput('');
    }
  };

  const handleAddBrand = () => {
    if (brandInput.trim() && !supportedBrands.includes(brandInput.trim())) {
      setSupportedBrands([...supportedBrands, brandInput.trim()]);
      setBrandInput('');
    }
  };

  const handleAddAccessory = () => {
    if (accessoryInput.trim() && !accessories.includes(accessoryInput.trim())) {
      setAccessories([...accessories, accessoryInput.trim()]);
      setAccessoryInput('');
    }
  };

  // Submission handler
  const handleFinalSubmit = async (forcedStatus?: 'published' | 'draft') => {
    if (isUploading) {
      setErrorMsg('Photo upload is currently in progress. Please wait a moment for it to complete.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please enter a valid listing / business name.');
      setActiveTab('info');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const selectedCategoryObj = CATEGORY_OPTIONS.find((c) => c.id === category);
      const catLabel = categoryLabel.trim() || selectedCategoryObj?.label || category.toUpperCase();

      let cleanImage = image.trim();
      if (cleanImage.startsWith('blob:')) {
        cleanImage = initialData?.image || '';
      }
      if (!cleanImage && gallery && gallery.length > 0) {
        cleanImage = (gallery || []).find((g) => g && !g.startsWith('blob:')) || '';
      }

      let cleanLogo = logo.trim();
      if (cleanLogo.startsWith('blob:')) {
        cleanLogo = initialData?.logo || '';
      }

      let cleanGallery = (gallery || [])
        .filter((g) => g && typeof g === 'string' && !g.startsWith('blob:'));
      if (cleanGallery.length === 0 && cleanImage) {
        cleanGallery = [cleanImage];
      }

      let cleanPaymentDetails = undefined;
      if (accountName.trim() && accountNumber.trim() && bankName.trim()) {
        cleanPaymentDetails = {
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          bankName: bankName.trim(),
          paymentInstructions: paymentInstructions.trim(),
          paymentReferenceFormat: paymentReferenceFormat.trim(),
          status: paymentStatus,
          verifiedAt: paymentStatus === 'VERIFIED'
            ? (initialData?.paymentDetails?.verifiedAt || new Date().toISOString())
            : undefined,
          verifiedBy: paymentStatus === 'VERIFIED'
            ? (initialData?.paymentDetails?.verifiedBy || 'Administrator')
            : undefined,
          updatedAt: new Date().toISOString()
        };
      } else if (initialData?.paymentDetails && (!accountName.trim() || !accountNumber.trim())) {
        // Explicitly cleared
        cleanPaymentDetails = null;
      }

      const finalPlaceData: Partial<Place> = {
        name: name.trim(),
        category,
        categoryLabel: catLabel,
        owner: owner.trim(),
        area: area.trim(),
        address: address.trim() || `${area}, Shendam LGA, Plateau State`,
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        openingHours: openingHours.trim(),
        description: description.trim(),
        priceRange,
        priceDetails: priceDetails.trim(),
        image: cleanImage,
        logo: cleanLogo,
        gallery: cleanGallery,
        verified,
        featured,
        popular,
        status: forcedStatus || status,
        services: servicesList,
        products: productsList,
        amenities: amenitiesList.length > 0 ? amenitiesList : servicesList,
        rooms: rooms.length > 0 ? rooms : undefined,
        menuItems: menuItems.length > 0 ? menuItems : undefined,
        supportedBrands: supportedBrands.length > 0 ? supportedBrands : undefined,
        accessories: accessories.length > 0 ? accessories : undefined,
        culturalSignificance: culturalSignificance.trim() || undefined,
        entryFee: entryFee.trim() || undefined,
        guideAvailable,
        dineInAvailable,
        takeawayAvailable,
        deliveryAvailable,
        emergencyHotline: emergencyHotline.trim() || undefined,
        ambulanceAvailable,
        coordinates: {
          lat: parseFloat(lat) || 8.877,
          lng: parseFloat(lng) || 9.506
        },
        directionsUrl: directionsUrl.trim() || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name.trim() + ' ' + address.trim())}`,
        paymentDetails: cleanPaymentDetails as any
      };

      await onSave(finalPlaceData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save listing to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto font-brand-sans">
      {/* Inline Delete Confirmation Modal */}
      {photoToDeleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-150">
          <div className="bg-[#051C3D] border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <h3 className="text-white font-black text-lg">Delete Photo?</h3>
            <p className="text-[#9BAABD] text-sm leading-relaxed">
              Are you sure you want to permanently delete this photo? This will remove it from the listing and clean up the storage file.
            </p>
            <div className="h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-black/40">
              <img src={photoToDeleteTarget.url} alt="Preview to delete" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDeleteTarget(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-[#9BAABD] hover:text-white font-bold text-xs hover:bg-white/5 transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => photoToDeleteTarget.type === 'main' ? executeDeleteMainPhoto() : executeRemoveGalleryImage(photoToDeleteTarget.idx!)}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>DELETE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={mainPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleMainPhotoChange}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGalleryPhotosChange}
      />

      <div className="bg-[#051C3D] border border-white/14 rounded-3xl max-w-3xl w-full my-auto text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#08254D] border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC928]/20 border border-[#FFC928]/40 flex items-center justify-center text-[#FFC928] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-brand-sans">
                {initialData ? `Edit Listing: ${initialData.name}` : '+ Add New Listing'}
              </h3>
              <p className="text-xs text-[#9BAABD]">
                Shendam Connect Content Management System (CMS)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-[#9BAABD] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#061F42] px-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#FFC928] text-[#FFC928]'
                : 'border-transparent text-[#9BAABD] hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Basic Info & Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'media'
                ? 'border-[#FFC928] text-[#FFC928]'
                : 'border-transparent text-[#9BAABD] hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. Photos & Direct Upload ({gallery.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'location'
                ? 'border-[#FFC928] text-[#FFC928]'
                : 'border-transparent text-[#9BAABD] hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>3. Address & Map Location</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offerings')}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'offerings'
                ? 'border-[#FFC928] text-[#FFC928]'
                : 'border-transparent text-[#9BAABD] hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>4. Specific Offerings & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`py-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'payment'
                ? 'border-[#FFC928] text-[#FFC928]'
                : 'border-transparent text-[#9BAABD] hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>5. Payment Details {accountNumber.trim() ? '(Active)' : ''}</span>
          </button>
        </div>

        {/* Status / Alert Bar */}
        {(uploadStatus || errorMsg || uploadProgressPercent !== null) && (
          <div className="px-4 py-3 bg-[#04142F] border-b border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              {uploadStatus && (
                <span className="text-[#FFC928] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{uploadStatus}</span>
                </span>
              )}
              {uploadProgressPercent !== null && (
                <span className="font-mono text-[11px] font-black text-[#FFC928] bg-[#FFC928]/15 px-2 py-0.5 rounded-full border border-[#FFC928]/30">
                  {uploadProgressPercent}%
                </span>
              )}
              {errorMsg && (
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </span>
              )}
            </div>
            {uploadProgressPercent !== null && (
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#FFC928] h-full transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(255,201,40,0.8)]"
                  style={{ width: `${uploadProgressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 no-scrollbar">
          {/* TAB 1: BASIC INFO & CONTACT */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Listing Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Listing / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dreams Hotel, Paul GSM Repair Services"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#08254D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    CMS Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value as CategoryId;
                      setCategory(newCat);
                      const catObj = CATEGORY_OPTIONS.find((c) => c.id === newCat);
                      if (catObj) setCategoryLabel(catObj.label);
                    }}
                    className="w-full bg-[#08254D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Owner & Custom Category Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Owner / Contact Person
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#9BAABD] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Raymond Paul, Manager John"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Category Display Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hotel & Suites, Phone Tech & Accessories"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    className="w-full bg-[#08254D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Phone Number (Direct Call)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+234 803 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    WhatsApp Number (Instant Chat)
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+234 803 123 4567"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Opening / Operating Hours
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-[#FFC928] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. 8:00 AM - 6:00 PM (Mon - Sat) or Open 24/7"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                  Listing Description & Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Comprehensive description of services, accommodations, food specialties, or products offered in Shendam..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#08254D] border border-white/14 rounded-2xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                />
              </div>

              {/* Toggles: Active Status, Featured, Verified */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Listing Status & Visibility Controls
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Status: Published vs Draft */}
                  <div
                    onClick={() => setStatus((prev) => (prev === 'published' ? 'draft' : 'published'))}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      status === 'published'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block">
                        {status === 'published' ? '● Active / Published' : '○ Inactive / Draft'}
                      </span>
                      <span className="text-[10px] text-[#9BAABD]">
                        {status === 'published' ? 'Visible to all users' : 'Hidden from public app'}
                      </span>
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <div
                    onClick={() => setFeatured((prev) => !prev)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      featured
                        ? 'bg-[#FFC928]/15 border-[#FFC928]/40 text-[#FFC928]'
                        : 'bg-white/5 border-white/10 text-[#9BAABD]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{featured ? '★ Featured Listing' : '☆ Standard Listing'}</span>
                      </span>
                      <span className="text-[10px]">
                        {featured ? 'Highlighted on home carousels' : 'Normal directory rank'}
                      </span>
                    </div>
                  </div>

                  {/* Verification Toggle */}
                  <div
                    onClick={() => setVerified((prev) => !prev)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      verified
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-white/5 border-white/10 text-[#9BAABD]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{verified ? 'LGA Verified' : 'Unverified'}</span>
                      </span>
                      <span className="text-[10px]">
                        {verified ? 'Official trust badge' : 'No badge'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS & DIRECT UPLOAD */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              {/* Main Photo Upload Card */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#FFC928]" />
                      <span>Main Cover Photo *</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Primary photo displayed on search cards and headers.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => mainPhotoInputRef.current?.click()}
                    className="flex items-center gap-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Phone</span>
                  </button>
                </div>

                {localMainPreview || image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 h-48 bg-black/40 group">
                    <img src={localMainPreview || image} alt="Main Cover" className="w-full h-full object-cover" />
                    {localMainPreview && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                        <Loader2 className="w-7 h-7 text-[#FFC928] animate-spin" />
                        <span className="text-xs font-bold text-white">Saving photo to permanent storage...</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-xl backdrop-blur-md">
                        Current Main Cover Photo
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => mainPhotoInputRef.current?.click()}
                          disabled={isUploading}
                          className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl backdrop-blur-md transition cursor-pointer disabled:opacity-50"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteMainPhoto}
                          disabled={isUploading}
                          className="text-xs font-bold bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 border border-rose-500/40 px-3 py-1.5 rounded-xl backdrop-blur-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          title="Delete Cover Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploading && mainPhotoInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-[#FFC928] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-[#FFC928]" />
                    <p className="text-xs font-bold text-white">Tap to upload Main Photo directly from your phone</p>
                    <p className="text-[10px] text-[#9BAABD]">JPEG, PNG, WEBP files will be permanently saved</p>
                  </div>
                )}
              </div>

              {/* Business Logo Card */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Business Logo / Avatar</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Official brand emblem or square shop logo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition cursor-pointer border border-white/14 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {localLogoPreview || logo ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#FFC928] bg-black/40 shrink-0">
                      <img src={localLogoPreview || logo} alt="Logo" className="w-full h-full object-cover" />
                      {localLogoPreview && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-10">
                          <Loader2 className="w-5 h-5 text-[#FFC928] animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        disabled={isUploading}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 rounded-full text-white transition cursor-pointer z-20 disabled:opacity-50"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploading && logoInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-[#9BAABD] hover:text-white hover:border-[#FFC928] cursor-pointer transition shrink-0"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-1">Add Logo</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                      Logo Image URL (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="https://... or /uploads/..."
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className="w-full bg-[#051C3D] border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Photos Card */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      <span>Photo Gallery ({gallery.length} photos)</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Add interior, rooms, dining, menu, workshop, and product showcase photos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex items-center gap-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-3.5 py-2 rounded-2xl text-xs font-black transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photos from Phone</span>
                  </button>
                </div>

                {gallery.length === 0 ? (
                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-[#FFC928] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="w-6 h-6 text-[#FFC928]" />
                    <span className="text-xs font-bold text-white">Tap to upload multiple gallery photos from phone</span>
                    <span className="text-[10px] text-[#9BAABD]">Select one or more photos from your device</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {gallery.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-2xl overflow-hidden border bg-black/40 group transition ${
                          imgUrl === image ? 'border-[#FFC928] ring-2 ring-[#FFC928]/30' : 'border-white/14'
                        }`}
                      >
                        <div className="h-28 w-full">
                          <img
                            src={imgUrl}
                            alt={`Gallery item ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {imgUrl === image && (
                          <div className="absolute top-2 left-2 bg-[#FFC928] text-[#04142F] text-[9px] font-black px-2 py-0.5 rounded-md shadow">
                            MAIN COVER
                          </div>
                        )}

                        {/* Photo Actions Overlay */}
                        <div className="p-2 bg-[#051C3D] border-t border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveGalleryImage(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              title="Move Left"
                            >
                              <ArrowUp className="w-3 h-3 -rotate-90" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveGalleryImage(idx, 'down')}
                              disabled={idx === gallery.length - 1}
                              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              title="Move Right"
                            >
                              <ArrowDown className="w-3 h-3 -rotate-90" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {imgUrl !== image && (
                              <button
                                type="button"
                                onClick={() => handleSetAsMainImage(imgUrl)}
                                className="px-2 py-1 text-[10px] font-bold bg-[#FFC928]/20 hover:bg-[#FFC928]/40 text-[#FFC928] rounded-lg transition cursor-pointer"
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              className="p-1 text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 rounded-lg transition cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LOCATION & MAP */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Street / Physical Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC928] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. KM 2, Kalong Road, Dungpit, Shendam"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                    Shendam District / Area *
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-[#08254D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                  >
                    {SHENDAM_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates & Presets */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#FFC928]" />
                    <span>Map Coordinates (Latitude / Longitude)</span>
                  </h4>
                  <p className="text-[11px] text-[#9BAABD]">
                    Pinpoints listing on interactive map navigation in Shendam.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      placeholder="8.877"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      placeholder="9.506"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="w-full bg-[#051C3D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1.5">
                    Quick Area Coordinate Presets:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COORDINATES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setLat(String(preset.lat));
                          setLng(String(preset.lng));
                          setArea(preset.label);
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white/8 hover:bg-[#FFC928] hover:text-[#04142F] transition border border-white/10 cursor-pointer"
                      >
                        📍 {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Directions URL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1 flex items-center justify-between">
                  <span>Google Maps "Get Directions" URL</span>
                  <span className="text-[10px] text-[#9BAABD] font-normal">Auto-generated if empty</span>
                </label>
                <div className="relative">
                  <ExternalLink className="w-3.5 h-3.5 text-[#FFC928] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://www.google.com/maps/dir/..."
                    value={directionsUrl}
                    onChange={(e) => setDirectionsUrl(e.target.value)}
                    className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORY SPECIFIC OFFERINGS & PRICING */}
          {activeTab === 'offerings' && (
            <div className="space-y-5">
              {/* Universal Price Tier & Rates */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#FFC928]" />
                  <span>General Pricing & Rates</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                      Price Range Indicator
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['Free', '₦', '₦₦', '₦₦₦', '₦₦₦₦'] as const).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setPriceRange(tier)}
                          className={`py-2 text-xs font-black rounded-xl border transition cursor-pointer ${
                            priceRange === tier
                              ? 'bg-[#FFC928] text-[#04142F] border-[#FFC928]'
                              : 'bg-[#051C3D] text-[#D5DCE8] border-white/14 hover:bg-white/10'
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                      Price Summary / Rate Details
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. From ₦15,000 / night or Meal avg ₦2,500"
                      value={priceDetails}
                      onChange={(e) => setPriceDetails(e.target.value)}
                      className="w-full bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>
              </div>

              {/* HOTEL SPECIALIZED FIELDS: ROOM TYPES & PRICES */}
              {category === 'hotels' && (
                <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-[#FFC928]" />
                      <span>Hotel Room Types & Nightly Rates ({rooms.length})</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Define standard rooms, executive suites, and presidential packages for guest bookings.
                    </p>
                  </div>

                  {/* Add Room Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#051C3D] p-3 rounded-2xl border border-white/10">
                    <input
                      type="text"
                      placeholder="Room Name (e.g. Presidential Suite)"
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      className="sm:col-span-4 bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                    <input
                      type="text"
                      placeholder="Rate (e.g. ₦35,000/night)"
                      value={roomPriceInput}
                      onChange={(e) => setRoomPriceInput(e.target.value)}
                      className="sm:col-span-3 bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                    <input
                      type="text"
                      placeholder="Features / Description"
                      value={roomDescInput}
                      onChange={(e) => setRoomDescInput(e.target.value)}
                      className="sm:col-span-3 bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                    <button
                      type="button"
                      onClick={handleAddRoom}
                      className="sm:col-span-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] py-2 rounded-xl text-xs font-black transition cursor-pointer"
                    >
                      + Add Room
                    </button>
                  </div>

                  {/* Room List */}
                  <div className="space-y-2">
                    {rooms.map((room, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#051C3D] border border-white/10 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{room.name}</span>
                            <span className="font-black text-[#FFC928]">{room.price}</span>
                          </div>
                          {room.description && (
                            <p className="text-[11px] text-[#9BAABD] mt-0.5">{room.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setRooms(rooms.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-400 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Amenities Checklist */}
                  <div className="pt-2">
                    <h5 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2">
                      Hotel Amenities (Click to toggle standard amenities):
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {HOTEL_DEFAULT_AMENITIES.map((amenity) => {
                        const isSelected = amenitiesList.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setAmenitiesList(amenitiesList.filter((a) => a !== amenity));
                              } else {
                                setAmenitiesList([...amenitiesList, amenity]);
                              }
                            }}
                            className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-[#051C3D] text-[#9BAABD] border-white/10 hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {amenity}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* RESTAURANT SPECIALIZED FIELDS: MENU ITEMS & DINING OPTIONS */}
              {category === 'restaurants' && (
                <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-[#FFC928]" />
                      <span>Menu Items & Food Specialties ({menuItems.length})</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Add local Goemai dishes, grills, breakfast packages, and beverages.
                    </p>
                  </div>

                  {/* Add Menu Item */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#051C3D] p-3 rounded-2xl border border-white/10">
                    <input
                      type="text"
                      placeholder="Dish / Drink Name (e.g. Masa & Taushe)"
                      value={menuNameInput}
                      onChange={(e) => setMenuNameInput(e.target.value)}
                      className="sm:col-span-5 bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                    <input
                      type="text"
                      placeholder="Price (e.g. ₦1,800)"
                      value={menuPriceInput}
                      onChange={(e) => setMenuPriceInput(e.target.value)}
                      className="sm:col-span-3 bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={menuDescInput}
                      onChange={(e) => setMenuDescInput(e.target.value)}
                      className="sm:col-span-2 bg-[#08254D] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                    <button
                      type="button"
                      onClick={handleAddMenuItem}
                      className="sm:col-span-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] py-2 rounded-xl text-xs font-black transition cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Menu List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {menuItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#051C3D] border border-white/10 text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <p className="font-black text-[#FFC928] text-[11px]">{item.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMenuItems(menuItems.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-400 hover:text-white bg-rose-500/20 rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Dining Options Checkboxes */}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs cursor-pointer text-white">
                      <input
                        type="checkbox"
                        checked={dineInAvailable}
                        onChange={(e) => setDineInAvailable(e.target.checked)}
                        className="rounded accent-[#FFC928]"
                      />
                      <span>Dine-In Available</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs cursor-pointer text-white">
                      <input
                        type="checkbox"
                        checked={takeawayAvailable}
                        onChange={(e) => setTakeawayAvailable(e.target.checked)}
                        className="rounded accent-[#FFC928]"
                      />
                      <span>Takeaway / Takeout</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs cursor-pointer text-white">
                      <input
                        type="checkbox"
                        checked={deliveryAvailable}
                        onChange={(e) => setDeliveryAvailable(e.target.checked)}
                        className="rounded accent-[#FFC928]"
                      />
                      <span>Home / Office Delivery</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TECH & BUSINESS FIELDS: SUPPORTED BRANDS & ACCESSORIES (e.g. Paul GSM) */}
              {(category === 'services' || category === 'businesses' || category === 'shopping' || category === 'more') && (
                <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      <span>Supported Brands & Device Ecosystem</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Specify device brands serviced or products retailed (e.g. Samsung, Apple, Tecno).
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {TECH_DEFAULT_BRANDS.map((brand) => {
                      const isSelected = supportedBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSupportedBrands(supportedBrands.filter((b) => b !== brand));
                            } else {
                              setSupportedBrands([...supportedBrands, brand]);
                            }
                          }}
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-[#051C3D] text-[#9BAABD] border-white/10 hover:text-white'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TOURIST & CULTURAL HERITAGE FIELDS */}
              {category === 'tourist_spots' && (
                <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>Cultural Significance & Visitor Details</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                      Historical / Cultural Significance
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Cultural heritage, historical relevance, traditional annual festivals..."
                      value={culturalSignificance}
                      onChange={(e) => setCulturalSignificance(e.target.value)}
                      className="w-full bg-[#051C3D] border border-white/14 rounded-2xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
                        Entry Fee / Gate Pass
                      </label>
                      <input
                        type="text"
                        placeholder="Free Admission or ₦500 / person"
                        value={entryFee}
                        onChange={(e) => setEntryFee(e.target.value)}
                        className="w-full bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs cursor-pointer text-white">
                        <input
                          type="checkbox"
                          checked={guideAvailable}
                          onChange={(e) => setGuideAvailable(e.target.checked)}
                          className="rounded accent-[#FFC928]"
                        />
                        <span>Local Tour Guides Available</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SERVICES OFFERED BUILDER */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                      <span>Services Offered ({servicesList.length})</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Add capabilities, repair offerings, laundry, guest transport, etc.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type service (e.g. Screen Replacement, Airport Pickup) and click Add..."
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                    className="flex-1 bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {servicesList.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1.5 bg-[#051C3D] border border-white/16 text-[#D5DCE8] px-3 py-1.5 rounded-xl text-xs"
                    >
                      <span>{service}</span>
                      <button
                        type="button"
                        onClick={() => setServicesList(servicesList.filter((s) => s !== service))}
                        className="hover:text-rose-400 text-[#9BAABD] transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* PRODUCTS & INVENTORY BUILDER */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-400" />
                      <span>Products / Stock for Sale ({productsList.length})</span>
                    </h4>
                    <p className="text-[11px] text-[#9BAABD]">
                      Add retail goods, spare parts, chargers, or merchandise.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type product (e.g. Type-C Fast Chargers, Power Banks)..."
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProduct();
                      }
                    }}
                    className="flex-1 bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {productsList.map((prod) => (
                    <span
                      key={prod}
                      className="inline-flex items-center gap-1.5 bg-[#051C3D] border border-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <span>{prod}</span>
                      <button
                        type="button"
                        onClick={() => setProductsList(productsList.filter((p) => p !== prod))}
                        className="hover:text-rose-400 text-indigo-300 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIRECT BUSINESS / HOTEL PAYMENT DETAILS */}
          {activeTab === 'payment' && (
            <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
              {/* Notice Card */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <span>Direct Business / Hotel Bank Settlement</span>
                </div>
                <p className="text-xs text-[#D5DCE8] leading-relaxed">
                  Shendam Connect does <strong className="text-white font-semibold">NOT</strong> hold or collect booking funds. Customers pay directly into this hotel/business account. When verified, these details are safely displayed to customers upon reservation.
                </p>
              </div>

              {/* Bank Details Form */}
              <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 sm:p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#FFC928]" />
                    <span>Approved Bank Account Details</span>
                  </h4>
                  {accountNumber && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Configured
                    </span>
                  )}
                </div>

                {/* Bank Name with Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#D5DCE8] flex items-center justify-between">
                    <span>Bank Name *</span>
                    <span className="text-[11px] text-[#9BAABD] font-normal">Choose preset or enter custom</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {['Zenith Bank', 'First Bank of Nigeria', 'UBA', 'GTBank', 'Access Bank', 'Moniepoint', 'OPay', 'FCMB'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setBankName(bank)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border text-left truncate transition cursor-pointer ${
                          bankName === bank
                            ? 'bg-[#FFC928]/20 border-[#FFC928] text-[#FFC928]'
                            : 'bg-[#051C3D] border-white/10 text-[#9BAABD] hover:text-white hover:border-white/20'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Zenith Bank Plc, First Bank, Moniepoint MFB..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>

                {/* Account Name & Number Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#D5DCE8]">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dreams Hotel Shendam Ltd"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#D5DCE8]">
                        Account Number *
                      </label>
                      <span className="text-[11px] text-[#9BAABD]">
                        {accountNumber.length}/10 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="10-digit NUBAN (e.g. 1012345678)"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>

                {/* Verification Status */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-[#D5DCE8]">
                    Account Verification Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('VERIFIED')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                        paymentStatus === 'VERIFIED'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#051C3D] border-white/10 text-[#9BAABD] hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${paymentStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-white/40'}`} />
                      <div>
                        <div className="text-xs font-bold">VERIFIED</div>
                        <div className="text-[10px] opacity-80">Visible to customers during booking</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentStatus('PENDING_VERIFICATION')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                        paymentStatus === 'PENDING_VERIFICATION'
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-[#051C3D] border-white/10 text-[#9BAABD] hover:text-white'
                      }`}
                    >
                      <Clock className={`w-4 h-4 mt-0.5 shrink-0 ${paymentStatus === 'PENDING_VERIFICATION' ? 'text-amber-400' : 'text-white/40'}`} />
                      <div>
                        <div className="text-xs font-bold">PENDING</div>
                        <div className="text-[10px] opacity-80">Awaiting admin check (Hidden)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentStatus('DISABLED')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                        paymentStatus === 'DISABLED'
                          ? 'bg-rose-500/20 border-rose-500 text-white'
                          : 'bg-[#051C3D] border-white/10 text-[#9BAABD] hover:text-white'
                      }`}
                    >
                      <X className={`w-4 h-4 mt-0.5 shrink-0 ${paymentStatus === 'DISABLED' ? 'text-rose-400' : 'text-white/40'}`} />
                      <div>
                        <div className="text-xs font-bold">DISABLED</div>
                        <div className="text-[10px] opacity-80">Deactivated for booking</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Optional Payment Instructions */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-[#D5DCE8]">
                    Optional Customer Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please transfer exact booking sum and mention your booking name in the bank narration. Send receipt screenshot to hotel WhatsApp."
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    className="w-full bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>

                {/* Optional Reference Format */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#D5DCE8]">
                    Optional Reference Format
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DH-2026-XXXX or HOTEL-NAME-ID"
                    value={paymentReferenceFormat}
                    onChange={(e) => setPaymentReferenceFormat(e.target.value)}
                    className="w-full bg-[#051C3D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                  />
                </div>

                {/* Clear Button */}
                {(accountName || accountNumber || bankName) && (
                  <div className="pt-2 border-t border-white/10 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Remove all direct payment details for this business?')) {
                          setAccountName('');
                          setAccountNumber('');
                          setBankName('');
                          setPaymentInstructions('');
                          setPaymentReferenceFormat('');
                          setPaymentStatus('DISABLED');
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Payment Details</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#08254D]/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploading}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-2xl border border-white/14 text-[#9BAABD] hover:text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleFinalSubmit('draft')}
              disabled={isSaving || isUploading}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black transition cursor-pointer disabled:opacity-50"
            >
              Save as Draft
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleFinalSubmit('published')}
            disabled={isSaving || isUploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] px-6 py-3 rounded-2xl text-xs font-black shadow-xl transition cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#04142F]" />
                <span>UPLOADING PHOTO TO STORAGE...</span>
              </>
            ) : isSaving ? (
              <span>Saving to Shendam Database...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>SAVE & PUBLISH TO DIRECTORY</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
