import React, { useState } from 'react';
import { Place, CategoryId } from '../types';
import { X, Check } from 'lucide-react';

interface ListBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: Place) => void;
}

export const ListBusinessModal: React.FC<ListBusinessModalProps> = ({
  isOpen,
  onClose,
  onAddPlace
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId>('businesses');
  const [area, setArea] = useState('Shendam Main Town');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [priceRange, setPriceRange] = useState<'₦' | '₦₦' | '₦₦₦' | 'Free'>('₦');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const sampleImages = [
    { label: 'Shop / Commerce', url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80' },
    { label: 'Dining & Grill', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' },
    { label: 'Suites & Lodge', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80' },
    { label: 'Tourist & Nature', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80' }
  ];

  const getCategoryLabel = (cat: CategoryId): string => {
    switch (cat) {
      case 'hotels': return 'Hotel';
      case 'restaurants': return 'Restaurant';
      case 'tourist_spots': return 'Tourist Spot';
      case 'shopping': return 'Shopping Center';
      case 'transport': return 'Transport';
      case 'services': return 'Services';
      case 'health': return 'Health';
      default: return 'Business';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) return;

    const newPlace: Place = {
      id: `place-custom-${Date.now()}`,
      name: name.trim(),
      category,
      categoryLabel: getCategoryLabel(category),
      rating: 5.0,
      reviewsCount: 1,
      image: selectedImage,
      gallery: [selectedImage],
      address: address.trim(),
      area: area.trim(),
      description: description.trim() || 'Verified enterprise serving Shendam community.',
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      priceRange,
      openingHours: '8:00 AM - 8:00 PM Daily',
      featured: false,
      popular: true,
      amenities: ['Customer Parking', 'POS Payments', 'Friendly Staff'],
      coordinates: { lat: 8.876, lng: 9.504 },
      mapPosition: { x: Math.floor(Math.random() * 50) + 25, y: Math.floor(Math.random() * 50) + 25 },
      reviews: [
        {
          id: `rev-${Date.now()}`,
          author: 'Shendam Connect Verified',
          rating: 5,
          date: 'Just now',
          comment: 'Registered and listed on Shendam Connect directory.'
        }
      ]
    };

    onAddPlace(newPlace);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B2D5C] border border-white/16 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0B2D5C]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFC928] text-[#061B3A] flex items-center justify-center font-bold">
              ✦
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-brand-sans">
                List Your Business
              </h3>
              <p className="text-[11px] text-[#9BAABD]">
                Grow your customer reach across Shendam LGA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#FFC928] text-[#061B3A] mx-auto flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <h4 className="text-lg font-bold text-white">Business Successfully Listed!</h4>
            <p className="text-xs text-[#9BAABD]">
              &quot;{name}&quot; is now live on the Shendam Connect map & directory.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                Business / Place Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Goemai Kitchen, Apex Gadgets..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryId)}
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                >
                  <option value="businesses">Business</option>
                  <option value="hotels">Hotel</option>
                  <option value="restaurants">Restaurant</option>
                  <option value="shopping">Shopping</option>
                  <option value="services">Services</option>
                  <option value="transport">Transport</option>
                  <option value="health">Health</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                  Area *
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                >
                  <option value="Shendam Main Town">Shendam Main Town</option>
                  <option value="Shendam GRA">Shendam GRA</option>
                  <option value="Kwolla District">Kwolla District</option>
                  <option value="Shimankar">Shimankar District</option>
                  <option value="Expressway Corridor">Expressway Corridor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Opposite Central Mosque, Jos Road"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+234 803 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                  WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+234 803 000 0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Describe your dishes, products, or services..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#04142F] border border-white/16 rounded-xl p-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928] resize-none"
              />
            </div>

            {/* Select Image */}
            <div>
              <label className="block text-xs font-bold text-[#9BAABD] uppercase tracking-wider mb-1.5">
                Photo Style
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {sampleImages.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative rounded-lg overflow-hidden h-14 border-2 transition cursor-pointer ${
                      selectedImage === img.url ? 'border-[#FFC928]' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 text-[#061B3A] font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer mt-2"
            >
              Publish Business Listing
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
