import React, { useState } from 'react';
import { Place, CategoryId } from '../../types';
import {
  Store,
  PlusCircle,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  User,
  ShoppingBag,
  Wrench,
  Filter,
  ExternalLink
} from 'lucide-react';

interface AdminBusinessesProps {
  places: Place[];
  onAddBusiness: () => void;
  onEditBusiness: (place: Place) => void;
  onDeleteBusiness: (placeId: string, placeName: string) => void;
  onToggleFeatured: (place: Place) => void;
  onToggleStatus?: (place: Place) => void;
}

export const AdminBusinesses: React.FC<AdminBusinessesProps> = ({
  places,
  onAddBusiness,
  onEditBusiness,
  onDeleteBusiness,
  onToggleFeatured,
  onToggleStatus
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Filter for business listings (exclude dedicated hotel & tourist spots lists if desired, or include all commercial directory listings)
  const businesses = places.filter((p) => p.category !== 'hotels' && p.category !== 'tourist_spots');

  const publishedCount = businesses.filter((b) => b.status !== 'draft').length;
  const draftCount = businesses.filter((b) => b.status === 'draft').length;
  const verifiedCount = businesses.filter((b) => Boolean(b.verified)).length;

  const filteredBusinesses = businesses.filter((b) => {
    const term = search.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(term) ||
      b.address.toLowerCase().includes(term) ||
      b.area.toLowerCase().includes(term) ||
      (b.owner && b.owner.toLowerCase().includes(term)) ||
      (b.phone && b.phone.toLowerCase().includes(term)) ||
      (b.services && b.services.some((s) => s.toLowerCase().includes(term))) ||
      (b.products && b.products.some((p) => p.toLowerCase().includes(term)));

    const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && b.status !== 'draft') ||
      (statusFilter === 'draft' && b.status === 'draft');

    const matchesVerified =
      verifiedFilter === 'all' ||
      (verifiedFilter === 'verified' && Boolean(b.verified)) ||
      (verifiedFilter === 'unverified' && !b.verified);

    return matchesSearch && matchesCategory && matchesStatus && matchesVerified;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-brand-sans">
      {/* Top Header Card with Quick Stats & Add Business Button */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Store className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-brand-sans">
              Shendam Business Registry ({businesses.length})
            </h2>
          </div>
          <p className="text-xs text-[#9BAABD] max-w-2xl">
            Manage local shops, tech repair centers, markets, dining spots, healthcare providers, and transport parks. Upload photos directly from phone, configure pricing, and publish live to Shendam Connect.
          </p>

          {/* Quick Stat Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <span className="text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{publishedCount} Published Live</span>
            </span>

            <span className="text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{draftCount} Drafts</span>
            </span>

            <span className="text-[11px] font-bold bg-[#FFC928]/15 border border-[#FFC928]/30 text-[#FFC928] px-3 py-1 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{verifiedCount} LGA Verified</span>
            </span>
          </div>
        </div>

        {/* Big Add Business Button */}
        <button
          onClick={onAddBusiness}
          className="flex items-center justify-center gap-2.5 bg-[#FFC928] hover:bg-[#F5B800] active:scale-98 text-[#04142F] px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl transition cursor-pointer shrink-0"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>ADD NEW BUSINESS</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-[#9BAABD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by business name, owner, street, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#08254D] border border-white/14 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#08254D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
          >
            <option value="all">All Categories</option>
            <option value="services">Commercial Services</option>
            <option value="restaurants">Restaurants & Food</option>
            <option value="shopping">Shopping & Markets</option>
            <option value="health">Healthcare & Pharmacy</option>
            <option value="transport">Transport & Logistics</option>
            <option value="emergency">Emergency Services</option>
            <option value="events">Events & Centers</option>
            <option value="more">Other Businesses</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-[#08254D] border border-white/14 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
          >
            <option value="all">All Statuses ({businesses.length})</option>
            <option value="published">Published Only ({publishedCount})</option>
            <option value="draft">Drafts Only ({draftCount})</option>
          </select>
        </div>
      </div>

      {/* Business Listings Table */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl overflow-hidden shadow-2xl text-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#04142F] text-[#9BAABD] uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Business & Photo</th>
                <th className="py-3.5 px-4">Owner / Contact</th>
                <th className="py-3.5 px-4">Category & Area</th>
                <th className="py-3.5 px-4">Offerings & Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#9BAABD]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Store className="w-8 h-8 text-white/20" />
                      <p className="font-bold text-white text-sm">No businesses found</p>
                      <p className="text-xs text-[#9BAABD]">Try adjusting your search query or click "Add New Business".</p>
                      <button
                        onClick={onAddBusiness}
                        className="mt-2 bg-[#FFC928] text-[#04142F] px-4 py-2 rounded-xl text-xs font-black"
                      >
                        + Add First Business
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((b) => {
                  const isDraft = b.status === 'draft';
                  const galleryCount = b.gallery?.length || 1;

                  return (
                    <tr key={b.id} className="hover:bg-white/4 transition group">
                      {/* Business Name, Main Photo & Logo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/14 shrink-0 bg-[#04142F]">
                            <img
                              src={b.image}
                              alt={b.name}
                              className="w-full h-full object-cover"
                            />
                            {b.logo && (
                              <img
                                src={b.logo}
                                alt="Logo"
                                className="absolute bottom-0 right-0 w-5 h-5 rounded-md border border-white/30 object-cover bg-white"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-white text-xs truncate group-hover:text-[#FFC928] transition">
                                {b.name}
                              </h4>
                              {b.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="LGA Verified" />
                              )}
                            </div>
                            <p className="text-[11px] text-[#9BAABD] truncate max-w-xs flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#FFC928] shrink-0" />
                              <span>{b.address}</span>
                            </p>
                            <span className="text-[10px] text-white/50 block">
                              📸 {galleryCount} photo{galleryCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="py-3.5 px-4">
                        {b.owner && (
                          <div className="flex items-center gap-1 text-[#D5DCE8] font-bold text-xs">
                            <User className="w-3 h-3 text-[#9BAABD]" />
                            <span>{b.owner}</span>
                          </div>
                        )}
                        <span className="text-white font-medium block text-xs mt-0.5">{b.phone || 'No phone'}</span>
                        {b.whatsapp && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{b.whatsapp}</span>
                          </span>
                        )}
                      </td>

                      {/* Category & Area */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 border border-white/14 text-[#D5DCE8] inline-block">
                          {b.categoryLabel || b.category}
                        </span>
                        <p className="text-xs text-[#9BAABD] font-medium mt-1">
                          📍 {b.area}
                        </p>
                      </td>

                      {/* Offerings (Services/Products) & Price */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-black text-[#FFC928] bg-[#FFC928]/10 px-2 py-0.5 rounded-md">
                            {b.priceRange || '₦₦'}
                          </span>
                          {b.priceDetails && (
                            <span className="text-[10px] text-[#9BAABD] truncate max-w-[120px]">
                              {b.priceDetails}
                            </span>
                          )}
                        </div>

                        {/* Services / Products count chips */}
                        <div className="flex flex-wrap gap-1">
                          {b.services && b.services.length > 0 && (
                            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                              {b.services.length} services
                            </span>
                          )}
                          {b.products && b.products.length > 0 && (
                            <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-md">
                              {b.products.length} products
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Published / Draft Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onToggleStatus && onToggleStatus(b)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition cursor-pointer ${
                            isDraft
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          }`}
                          title="Click to toggle Published / Draft status"
                        >
                          {isDraft ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Draft</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Published</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Featured */}
                          <button
                            onClick={() => onToggleFeatured(b)}
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              b.featured
                                ? 'bg-[#FFC928]/20 border-[#FFC928] text-[#FFC928]'
                                : 'bg-white/6 border-white/12 text-[#9BAABD] hover:text-white'
                            }`}
                            title="Toggle featured showcase"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditBusiness(b)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-[#FFC928] hover:text-[#04142F] text-white transition cursor-pointer"
                            title="Edit Business Details & Photos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => onDeleteBusiness(b.id, b.name)}
                            className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white transition cursor-pointer"
                            title="Delete Business"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
