import React, { useState } from 'react';
import { Place, CategoryId } from '../../types';
import {
  Building2,
  Utensils,
  Store,
  Compass,
  Wrench,
  Car,
  ShoppingBag,
  HeartPulse,
  ShieldAlert,
  CalendarDays,
  PlusCircle,
  Search,
  Star,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  Grid,
  List
} from 'lucide-react';

export interface AdminDirectoryCMSProps {
  categoryFilter?: CategoryId | 'all';
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  places: Place[];
  searchTerm?: string;
  onAddPlace: (category?: CategoryId) => void;
  onEditPlace: (place: Place) => void;
  onDeletePlace: (placeId: string, placeName: string) => void;
  onViewPlace: (place: Place) => void;
  onToggleStatus: (place: Place) => void;
  onToggleFeatured: (place: Place) => void;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: any; color: string; defaultCat: CategoryId; desc: string }
> = {
  all: {
    label: 'All Directory Listings',
    icon: Layers,
    color: 'text-[#FFC928]',
    defaultCat: 'services',
    desc: 'Master Content Management System for all categories in Shendam Connect.'
  },
  hotels: {
    label: 'Hotels & Hospitality',
    icon: Building2,
    color: 'text-sky-400',
    defaultCat: 'hotels',
    desc: 'Manage hotels, suites, lodges, room categories, pricing, and amenities in Shendam.'
  },
  restaurants: {
    label: 'Restaurants & Dining',
    icon: Utensils,
    color: 'text-amber-400',
    defaultCat: 'restaurants',
    desc: 'Manage local restaurants, Goemai food delicacies, grills, menus, and dining hours.'
  },
  businesses: {
    label: 'Local Businesses & Enterprises',
    icon: Store,
    color: 'text-emerald-400',
    defaultCat: 'businesses',
    desc: 'Manage local trade, markets, retail shops, and commercial ventures in Shendam LGA.'
  },
  tourist_spots: {
    label: 'Tourist Attractions & Heritage',
    icon: Compass,
    color: 'text-indigo-400',
    defaultCat: 'tourist_spots',
    desc: 'Manage waterfalls, cultural sites, historical landmarks, and visitor guides.'
  },
  services: {
    label: 'Tech & Professional Services',
    icon: Wrench,
    color: 'text-teal-400',
    defaultCat: 'services',
    desc: 'Manage phone repair (e.g. Paul GSM), solar, electrical, tailors, and technical artisans.'
  },
  transport: {
    label: 'Transport & Motor Parks',
    icon: Car,
    color: 'text-orange-400',
    defaultCat: 'transport',
    desc: 'Manage mass transit terminals, interstate motor parks, logistics, and taxi hubs.'
  },
  shopping: {
    label: 'Shopping, Markets & Retail',
    icon: ShoppingBag,
    color: 'text-purple-400',
    defaultCat: 'shopping',
    desc: 'Manage central market stalls, supermarkets, electronics, and fashion outlets.'
  },
  health: {
    label: 'Healthcare & Pharmacies',
    icon: HeartPulse,
    color: 'text-rose-400',
    defaultCat: 'health',
    desc: 'Manage general hospitals, clinics, maternity centers, and 24/7 pharmacies.'
  },
  emergency: {
    label: 'Emergency & Safety Services',
    icon: ShieldAlert,
    color: 'text-red-400',
    defaultCat: 'emergency',
    desc: 'Manage police stations, fire service, emergency health response, and security hotlines.'
  }
};

export const AdminDirectoryCMS: React.FC<AdminDirectoryCMSProps> = ({
  categoryFilter = 'all',
  title,
  subtitle,
  icon: CustomIcon,
  places,
  searchTerm,
  onAddPlace,
  onEditPlace,
  onDeletePlace,
  onViewPlace,
  onToggleStatus,
  onToggleFeatured
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const meta = CATEGORY_META[categoryFilter] || CATEGORY_META['all'];
  const HeaderIcon = CustomIcon || meta.icon;

  // Filter places based on Category, Search, Status, Featured, and Area
  const categoryPlaces = places.filter((p) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'businesses') {
      return p.category === 'businesses' || p.category === 'services' || p.category === 'more';
    }
    return p.category === categoryFilter;
  });

  const activeSearchQuery = (searchTerm !== undefined && searchTerm !== '' ? searchTerm : search).toLowerCase().trim();

  const filteredPlaces = categoryPlaces.filter((p) => {
    // Search query matches name, owner, address, area, phone, services, products, description
    const q = activeSearchQuery;
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.owner && p.owner.toLowerCase().includes(q)) ||
      p.address.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q)) ||
      (p.whatsapp && p.whatsapp.includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (Array.isArray(p.services) && p.services.some((s) => s.toLowerCase().includes(q))) ||
      (Array.isArray(p.products) && p.products.some((pr) => pr.toLowerCase().includes(q)));

    // Status filter (active vs draft)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && p.status !== 'draft') ||
      (statusFilter === 'draft' && p.status === 'draft');

    // Featured filter
    const matchesFeatured = featuredFilter === 'all' || Boolean(p.featured);

    // Area filter
    const matchesArea = areaFilter === 'all' || p.area === areaFilter;

    // Sub-category filter (when in 'all' view)
    const matchesSubCat =
      selectedSubCategory === 'all' || p.category === selectedSubCategory;

    return matchesSearch && matchesStatus && matchesFeatured && matchesArea && matchesSubCat;
  });

  // Calculate live statistics
  const totalCount = categoryPlaces.length;
  const publishedCount = categoryPlaces.filter((p) => p.status !== 'draft').length;
  const draftCount = categoryPlaces.filter((p) => p.status === 'draft').length;
  const featuredCount = categoryPlaces.filter((p) => Boolean(p.featured)).length;
  const verifiedCount = categoryPlaces.filter((p) => Boolean(p.verified)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-brand-sans">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-white/10 border border-white/14 flex items-center justify-center ${meta.color} shrink-0`}>
            <HeaderIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                {title || meta.label}
              </h2>
              <span className="bg-[#FFC928]/20 text-[#FFC928] border border-[#FFC928]/40 text-xs font-black px-2.5 py-0.5 rounded-full">
                {totalCount} {totalCount === 1 ? 'Listing' : 'Listings'}
              </span>
            </div>
            <p className="text-xs text-[#9BAABD] mt-1 max-w-2xl leading-relaxed">
              {subtitle || meta.desc}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddPlace(meta.defaultCat)}
          className="flex items-center justify-center gap-2 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] px-5 py-3 rounded-2xl text-xs font-black shadow-lg transition cursor-pointer self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add New {categoryFilter === 'all' ? 'Listing' : meta.label.split(' ')[0]}</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] block">
              Total In Category
            </span>
            <span className="text-xl font-black text-white">{totalCount}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFC928]" />
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'published' ? 'all' : 'published')}
          className={`bg-[#08254D] border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition ${
            statusFilter === 'published' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-white/12'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Active / Published
            </span>
            <span className="text-xl font-black text-white">{publishedCount}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
          className={`bg-[#08254D] border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition ${
            statusFilter === 'draft' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-white/12'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
              Inactive / Drafts
            </span>
            <span className="text-xl font-black text-white">{draftCount}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        </div>

        <div
          onClick={() => setFeaturedFilter(featuredFilter === 'featured' ? 'all' : 'featured')}
          className={`bg-[#08254D] border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition ${
            featuredFilter === 'featured' ? 'border-[#FFC928] ring-2 ring-[#FFC928]/20' : 'border-white/12'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC928] block">
              Featured Listings
            </span>
            <span className="text-xl font-black text-white">{featuredCount}</span>
          </div>
          <Star className="w-4 h-4 text-[#FFC928] fill-current" />
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, owner, address, phone, services, products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#051C3D] border border-white/14 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BAABD] hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#051C3D] border border-white/14 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            >
              <option value="all">Status: All</option>
              <option value="published">● Active Only</option>
              <option value="draft">○ Inactive / Drafts</option>
            </select>

            {/* Featured Select */}
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as any)}
              className="bg-[#051C3D] border border-white/14 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            >
              <option value="all">Featured: All</option>
              <option value="featured">★ Featured Only</option>
            </select>

            {/* Area Select */}
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-[#051C3D] border border-white/14 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            >
              <option value="all">Area: All Shendam</option>
              <option value="Shendam Central">Shendam Central</option>
              <option value="Texas Area">Texas Area</option>
              <option value="Kalong Road">Kalong Road</option>
              <option value="Yelwa Road">Yelwa Road</option>
              <option value="Central Market Area">Central Market Area</option>
              <option value="Shimankar Axis">Shimankar Axis</option>
              <option value="Mass Transit Hub">Mass Transit Hub</option>
            </select>

            {/* Master Category Select (if in 'all' view) */}
            {categoryFilter === 'all' && (
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="bg-[#051C3D] border border-white/14 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
              >
                <option value="all">All Categories</option>
                <option value="hotels">Hotels</option>
                <option value="restaurants">Restaurants</option>
                <option value="businesses">Businesses</option>
                <option value="tourist_spots">Attractions</option>
                <option value="services">Services</option>
                <option value="transport">Transport</option>
                <option value="shopping">Shopping</option>
                <option value="health">Health</option>
                <option value="emergency">Emergency</option>
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#051C3D] border border-white/14 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#FFC928] text-[#04142F]' : 'text-[#9BAABD] hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listings List / Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="bg-[#08254D] border border-white/12 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9BAABD] mx-auto">
            <HeaderIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">No listings found</h3>
            <p className="text-xs text-[#9BAABD] max-w-sm mx-auto mt-1">
              {search || statusFilter !== 'all' || featuredFilter !== 'all'
                ? 'No items match your current search and filter criteria.'
                : `No listings exist in this category yet. Click "+ Add New" to create one.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAddPlace(meta.defaultCat)}
            className="inline-flex items-center gap-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add First {meta.label.split(' ')[0]} Listing</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map((place) => {
            const isDraft = place.status === 'draft';
            const galleryCount = Array.isArray(place.gallery) ? place.gallery.length : 1;

            return (
              <div
                key={place.id}
                className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden text-white flex flex-col justify-between hover:border-white/25 transition group shadow-lg"
              >
                <div>
                  {/* Photo Thumbnail + Badges */}
                  <div className="relative h-44 w-full bg-black/40 overflow-hidden">
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08254D] via-transparent to-black/60" />

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-white/10">
                        {place.categoryLabel || place.category.toUpperCase()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Status Toggle Badge */}
                        <button
                          type="button"
                          onClick={() => onToggleStatus(place)}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl backdrop-blur-md border transition cursor-pointer ${
                            isDraft
                              ? 'bg-amber-500/80 text-amber-950 border-amber-400 hover:bg-amber-400'
                              : 'bg-emerald-500/80 text-emerald-950 border-emerald-400 hover:bg-emerald-400'
                          }`}
                          title="Click to toggle Active / Inactive"
                        >
                          {isDraft ? '○ Inactive' : '● Active'}
                        </button>

                        {/* Featured Toggle Star */}
                        <button
                          type="button"
                          onClick={() => onToggleFeatured(place)}
                          className={`p-1.5 rounded-xl backdrop-blur-md border transition cursor-pointer ${
                            place.featured
                              ? 'bg-[#FFC928] text-[#04142F] border-[#FFC928]'
                              : 'bg-black/60 text-[#9BAABD] border-white/10 hover:text-white'
                          }`}
                          title="Click to toggle Featured"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom overlay: Logo & Photo Count */}
                    <div className="absolute bottom-3 inset-x-3 flex items-end justify-between">
                      {place.logo ? (
                        <img
                          src={place.logo}
                          alt="Logo"
                          className="w-10 h-10 rounded-2xl object-cover border-2 border-[#FFC928] bg-black/60 shadow"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-2xl bg-black/70 border border-white/20 flex items-center justify-center text-[#FFC928]">
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}

                      <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-lg backdrop-blur-md">
                        📷 {galleryCount} {galleryCount === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-[#FFC928] transition">
                          {place.name}
                        </h3>
                        {place.verified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="LGA Verified" />
                        )}
                      </div>

                      {place.owner && (
                        <p className="text-[11px] text-[#9BAABD] mt-0.5">
                          Owner: <span className="text-white">{place.owner}</span>
                        </p>
                      )}
                    </div>

                    {/* Location & Address */}
                    <div className="space-y-1 text-xs text-[#D5DCE8]">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0 mt-0.5" />
                        <span className="line-clamp-1 text-[11px]">{place.address}</span>
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#9BAABD] pt-0.5">
                        <span>📍 {place.area}</span>
                        <span className="font-bold text-[#FFC928]">{place.priceRange || '₦₦'}</span>
                      </div>
                    </div>

                    {/* Contact Phone & WhatsApp */}
                    <div className="flex items-center gap-2 pt-1">
                      {place.phone ? (
                        <a
                          href={`tel:${place.phone}`}
                          className="flex items-center gap-1 bg-[#051C3D] hover:bg-[#06244F] border border-white/10 text-white px-2.5 py-1 rounded-xl text-[11px] transition"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span className="line-clamp-1">{place.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-[#9BAABD]">No phone</span>
                      )}

                      {place.whatsapp && (
                        <a
                          href={`https://wa.me/${place.whatsapp.replace(/[^0-9]/g, '').replace(/^0/, '234')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 bg-[#051C3D] hover:bg-[#06244F] border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-xl text-[11px] transition"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions: [VIEW] [EDIT] [DELETE] */}
                <div className="p-3 bg-[#051C3D] border-t border-white/10 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => onViewPlace(place)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/8 hover:bg-white/15 text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditPlace(place)}
                    className="flex-1 flex items-center justify-center gap-1 bg-[#FFC928]/15 hover:bg-[#FFC928]/30 text-[#FFC928] border border-[#FFC928]/30 py-2 rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeletePlace(place.id, place.name)}
                    className="p-2 rounded-xl text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-600 transition cursor-pointer"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#051C3D] border-b border-white/10 text-[#9BAABD] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Listing & Category</th>
                  <th className="py-3.5 px-4">Owner & Contact</th>
                  <th className="py-3.5 px-4">Location / Area</th>
                  <th className="py-3.5 px-4">Rates / Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredPlaces.map((place) => {
                  const isDraft = place.status === 'draft';

                  return (
                    <tr key={place.id} className="hover:bg-white/5 transition">
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-white/14 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs">{place.name}</span>
                              {place.featured && <Star className="w-3 h-3 text-[#FFC928] fill-current" />}
                            </div>
                            <span className="text-[10px] text-[#9BAABD] block">
                              {place.categoryLabel || place.category.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Phone */}
                      <td className="py-3 px-4 text-[#D5DCE8]">
                        <p className="font-medium text-white">{place.owner || '—'}</p>
                        <p className="text-[11px] text-[#9BAABD]">{place.phone || 'No phone'}</p>
                      </td>

                      {/* Area */}
                      <td className="py-3 px-4 text-[#D5DCE8]">
                        <p className="line-clamp-1">{place.address}</p>
                        <span className="text-[10px] text-[#9BAABD]">{place.area}</span>
                      </td>

                      {/* Rates */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#FFC928]">{place.priceRange || '₦₦'}</span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(place)}
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border transition cursor-pointer ${
                            isDraft
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {isDraft ? '○ Inactive' : '● Active'}
                        </button>
                      </td>

                      {/* Actions: View, Edit, Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewPlace(place)}
                            className="p-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-white transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditPlace(place)}
                            className="p-1.5 rounded-xl bg-[#FFC928]/20 hover:bg-[#FFC928]/40 text-[#FFC928] transition cursor-pointer"
                            title="Edit Listing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeletePlace(place.id, place.name)}
                            className="p-1.5 rounded-xl text-rose-400 hover:text-white bg-rose-500/20 hover:bg-rose-600 transition cursor-pointer"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
