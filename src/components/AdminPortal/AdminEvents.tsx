import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Clock,
  Users,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Tag
} from 'lucide-react';
import { ShendamEvent } from '../../types';
import { compressAndValidateImage } from '../../utils/imageCompressor';

interface AdminEventsProps {
  authToken: string;
  onSessionExpired?: () => void;
}

export const AdminEvents: React.FC<AdminEventsProps> = ({ authToken, onSessionExpired }) => {
  const [events, setEvents] = useState<ShendamEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ShendamEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Cultural & Festivals');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTag, setFormTag] = useState('Annual Heritage');
  const [formOrganizer, setFormOrganizer] = useState('Shendam Traditional Council');
  const [formFeatured, setFormFeatured] = useState(true);
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formAttendees, setFormAttendees] = useState(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      }
    } catch {
      showToast('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormCategory('Cultural & Festivals');
    setFormDate('Nov 28 - Dec 02, 2025');
    setFormTime('10:00 AM Daily');
    setFormLocation('Shendam Township Stadium, Shendam LGA');
    setFormImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80');
    setFormDescription('Grand cultural festival celebrating Goemai heritage, royal dances, and agricultural exhibition.');
    setFormTag('Grand Festival');
    setFormOrganizer('Shendam Traditional Council');
    setFormFeatured(true);
    setFormStatus('published');
    setFormAttendees(250);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: ShendamEvent) => {
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormCategory(evt.category);
    setFormDate(evt.date);
    setFormTime(evt.time);
    setFormLocation(evt.location);
    setFormImage(evt.image);
    setFormDescription(evt.description);
    setFormTag(evt.tag || 'Community');
    setFormOrganizer(evt.organizer || 'Shendam LGA Council');
    setFormFeatured(Boolean(evt.featured));
    setFormStatus(evt.status || 'published');
    setFormAttendees(evt.attendeesCount || 100);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file too large (Max 15MB).');
      return;
    }

    setUploadingImage(true);
    try {
      let fileData: string;
      try {
        const compressed = await compressAndValidateImage(file, 1200);
        fileData = compressed.dataUrl;
      } catch {
        fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          fileData,
          filename: `event_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        })
      });

      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }

      const data = await res.json();
      if (res.ok && data.url) {
        setFormImage(data.url);
        showToast('Event banner uploaded successfully.');
      } else {
        showToast(data.error || 'Failed to upload image.');
      }
    } catch {
      showToast('Network error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate.trim() || !formLocation.trim()) {
      showToast('Please fill in title, date, and location.');
      return;
    }

    setIsSubmitting(true);
    const eventPayload: Partial<ShendamEvent> = {
      title: formTitle.trim(),
      category: formCategory,
      date: formDate.trim(),
      time: formTime.trim(),
      location: formLocation.trim(),
      image: formImage.trim() || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      description: formDescription.trim(),
      tag: formTag.trim(),
      organizer: formOrganizer.trim(),
      featured: formFeatured,
      status: formStatus,
      attendeesCount: Number(formAttendees) || 50
    };

    try {
      const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : '/api/admin/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(eventPayload)
      });

      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }

      const data = await res.json();
      if (res.ok) {
        showToast(editingEvent ? 'Event updated successfully!' : 'Event created & published!');
        setIsModalOpen(false);
        fetchEvents();
      } else {
        showToast(data.error || 'Failed to save event.');
      }
    } catch {
      showToast('Error saving event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }

      if (res.ok) {
        showToast('Event deleted successfully.');
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete event.');
      }
    } catch {
      showToast('Error deleting event.');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.organizer || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || evt.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0B2D5C] border border-[#FFC928] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-[#FFC928]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B2D5C] p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#FFC928]" />
            <h2 className="text-xl font-bold text-white font-brand-sans">
              Events & Festivals CMS
            </h2>
          </div>
          <p className="text-xs text-[#D5DCE8] mt-1">
            Manage public events, cultural celebrations, trade fairs, and religious gatherings in Shendam.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Event</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#08254D] p-3.5 rounded-xl border border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events by title, organizer, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#04142F] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FFC928]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#FFC928] shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#04142F] border border-white/10 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FFC928] w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="Cultural & Festivals">Cultural & Festivals</option>
            <option value="Trade & Commerce">Trade & Commerce</option>
            <option value="Religious & Community">Religious & Community</option>
            <option value="Music & Entertainment">Music & Entertainment</option>
            <option value="Sports & Youth">Sports & Youth</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="w-full py-16 text-center text-white/60 text-sm">
          Loading events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#08254D] p-10 rounded-2xl border border-white/10 text-center space-y-3">
          <CalendarDays className="w-12 h-12 text-white/30 mx-auto" />
          <h3 className="text-base font-bold text-white">No Events Found</h3>
          <p className="text-xs text-[#D5DCE8] max-w-sm mx-auto">
            No events match your search query. Click "Add New Event" to publish a community festival or gathering.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#08254D] border border-white/10 hover:border-[#FFC928]/40 rounded-2xl overflow-hidden shadow-lg flex flex-col transition group"
            >
              {/* Image & Badge */}
              <div className="relative h-44 w-full bg-[#04142F] overflow-hidden">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08254D] via-transparent to-black/40" />
                
                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  <span className="bg-[#04142F]/90 backdrop-blur-sm border border-white/20 text-[#FFC928] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    {evt.category}
                  </span>
                  {evt.featured && (
                    <span className="bg-[#FFC928] text-[#04142F] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 fill-[#04142F]" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      evt.status === 'draft'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {evt.status === 'draft' ? 'Draft' : 'Published'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-white font-brand-sans line-clamp-1">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-[#D5DCE8] line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-[#9BAABD]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                    <span className="font-medium text-white/90">{evt.date} • {evt.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                  {evt.organizer && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#FFC928]/90">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">Org: {evt.organizer}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/60 font-medium">
                    {evt.attendeesCount || 100}+ Expected
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(evt)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-[#FFC928] hover:text-[#04142F] text-white transition cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      disabled={isDeleting === evt.id}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#08254D] border border-white/16 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#04142F]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#FFC928]" />
                <h3 className="font-bold text-base sm:text-lg text-white font-brand-sans">
                  {editingEvent ? 'Edit Event Details' : 'Create & Publish New Event'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shendam Cultural Carnival & Royal Festival"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  >
                    <option value="Cultural & Festivals">Cultural & Festivals</option>
                    <option value="Trade & Commerce">Trade & Commerce</option>
                    <option value="Religious & Community">Religious & Community</option>
                    <option value="Music & Entertainment">Music & Entertainment</option>
                    <option value="Sports & Youth">Sports & Youth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Tag / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Festival, Free Entry"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Date & Duration *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nov 28 - Dec 02, 2025"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Daily Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM Daily"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Location / Venue *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shendam Township Stadium, Shendam LGA"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Organizer / Host
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shendam Traditional Council"
                    value={formOrganizer}
                    onChange={(e) => setFormOrganizer(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Expected Attendees
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(Number(e.target.value))}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white">
                  Event Banner Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... or upload below"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="flex-1 bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                  <label className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {formImage && (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-white/10 bg-[#04142F]">
                    <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Description & Program Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide comprehensive details about the schedule, entry requirements, performances, VIP dignitaries..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#04142F] border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FFC928] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-white">Featured on Home</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#04142F] border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formStatus === 'published'}
                    onChange={(e) => setFormStatus(e.target.checked ? 'published' : 'draft')}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-white">
                    {formStatus === 'published' ? 'Live Published' : 'Save as Draft'}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black text-[#04142F] bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
