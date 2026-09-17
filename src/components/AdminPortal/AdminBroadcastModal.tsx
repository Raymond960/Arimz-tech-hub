import React, { useState } from 'react';
import { Megaphone, X, Send, Sparkles } from 'lucide-react';

interface AdminBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (broadcastData: { title: string; category: string; content: string }) => Promise<void>;
}

export const AdminBroadcastModal: React.FC<AdminBroadcastModalProps> = ({
  isOpen,
  onClose,
  onBroadcast
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('LGA Announcement');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please enter both announcement title and message content.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);

    try {
      await onBroadcast({
        title: title.trim(),
        category,
        content: content.trim()
      });
      setTitle('');
      setContent('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send broadcast announcement.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#08254D] border border-white/16 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#08254D] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-brand-sans">
                Broadcast Public Notice
              </h3>
              <p className="text-xs text-[#9BAABD]">
                Publish official advisory directly to public app notification feed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-3 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Notice Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
            >
              <option value="LGA Announcement">LGA Official Announcement</option>
              <option value="Tourism & Culture">Tourism & Cultural Event</option>
              <option value="Weather & Climate">Weather & Harmattan Advisory</option>
              <option value="Security & Safety">Security & Public Safety</option>
              <option value="Commercial Market">Market & Trade Update</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Headline Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Goemai Cultural Festival Dates Announced"
              className="w-full bg-[#04142F] border border-white/14 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9BAABD] mb-1">
              Broadcast Message Content *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed information, venue instructions, dates, or emergency advisory for Shendam residents and visitors..."
              className="w-full bg-[#04142F] border border-white/14 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928] resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/16 hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Broadcasting...' : 'Broadcast to App'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
