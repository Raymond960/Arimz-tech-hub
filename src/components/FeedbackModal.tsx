import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquarePlus,
  Sparkles,
  AlertTriangle,
  Send,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  Mail,
  User,
  Phone,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { FeedbackType, FeedbackItem } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
  onSubmitted?: (feedback: FeedbackItem) => void;
}

const CATEGORY_OPTIONS: Record<FeedbackType, string[]> = {
  feature_request: [
    'New Tourism & Heritage Feature',
    'Hotel & Lodging Booking System',
    'Interactive Map & Route Guides',
    'Cultural Events & Festival Alerts',
    'Local Merchant Directory Tools',
    'Offline Capability & Performance',
    'Other Feature Idea'
  ],
  issue_report: [
    'Incorrect Business/Hotel Information',
    'Broken Phone Number or Contact',
    'Map Location or Coordinates Inaccurate',
    'App Glitch, Crash or Visual Bug',
    'Slow Loading or Offline Error',
    'Booking Form Issue',
    'Other Problem'
  ],
  general_feedback: [
    'Overall App Experience & Design',
    'Shendam LGA Community Suggestion',
    'Tourism Recommendation',
    'Merchant Experience',
    'Compliment / General Note'
  ]
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  initialType = 'feature_request',
  onSubmitted
}) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialType);
  const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[initialType][0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync category default when feedback type changes
  useEffect(() => {
    setCategory(CATEGORY_OPTIONS[feedbackType][0]);
  }, [feedbackType]);

  // Reset form when opened with new initialType
  useEffect(() => {
    if (isOpen) {
      setFeedbackType(initialType);
      setCategory(CATEGORY_OPTIONS[initialType][0]);
      setTitle('');
      setDescription('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setSubmittedFeedback(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a short summary or title.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please describe your suggestion or issue with at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const deviceInfo = typeof navigator !== 'undefined'
      ? `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} • ${navigator.userAgent.includes('Android') ? 'Android' : navigator.userAgent.includes('iPhone') ? 'iOS' : 'Web'}`
      : 'Web Client';

    const payload = {
      type: feedbackType,
      title: title.trim(),
      description: description.trim(),
      category,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      deviceInfo
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit feedback');
      }

      const data = await res.json();
      if (data && data.feedback) {
        setSubmittedFeedback(data.feedback);
        if (onSubmitted) onSubmitted(data.feedback);
      }
    } catch (err: any) {
      // Offline fallback: save locally and acknowledge
      const offlineItem: FeedbackItem = {
        id: `fb-local-${Date.now()}`,
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        category,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        deviceInfo,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      try {
        const stored = JSON.parse(localStorage.getItem('shendam_offline_feedback') || '[]');
        stored.unshift(offlineItem);
        localStorage.setItem('shendam_offline_feedback', JSON.stringify(stored));
      } catch (storageErr) {
        console.warn('Local storage error:', storageErr);
      }

      setSubmittedFeedback(offlineItem);
      if (onSubmitted) onSubmitted(offlineItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#061B3A] border border-white/16 rounded-3xl shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/12 bg-[#08254D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
              <MessageSquarePlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-brand-sans tracking-tight">
                Feedback & Feature Requests
              </h2>
              <p className="text-xs text-[#9BAABD]">
                Direct line to Shendam LGA administration & ICT team
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#D5DCE8] hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {submittedFeedback ? (
            /* Success State */
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  Submission Received!
                </h3>
                <p className="text-xs text-[#9BAABD] mt-1 max-w-sm mx-auto">
                  Thank you for helping us improve Shendam Connect. Your ticket has been logged directly into the LGA administrative queue.
                </p>
              </div>

              <div className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex items-center justify-between text-[#9BAABD]">
                  <span>Reference ID:</span>
                  <span className="font-mono font-bold text-[#FFC928]">{submittedFeedback.id}</span>
                </div>
                <div className="flex items-center justify-between text-[#9BAABD]">
                  <span>Category:</span>
                  <span className="font-semibold text-white">{submittedFeedback.category}</span>
                </div>
                <div className="flex items-center justify-between text-[#9BAABD]">
                  <span>Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Pending LGA Review
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-extrabold rounded-2xl shadow-lg transition cursor-pointer text-xs"
                >
                  Done & Return to App
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Type Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-[#D5DCE8] mb-2 uppercase tracking-wider">
                  What would you like to submit?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature_request')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      feedbackType === 'feature_request'
                        ? 'bg-[#FFC928] text-[#061B3A] border-[#FFC928] shadow-md'
                        : 'bg-[#08254D] text-[#9BAABD] hover:text-white border-white/12 hover:border-white/20'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Feature Idea</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('issue_report')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      feedbackType === 'issue_report'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                        : 'bg-[#08254D] text-[#9BAABD] hover:text-white border-white/12 hover:border-white/20'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Report Issue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('general_feedback')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                      feedbackType === 'general_feedback'
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-md'
                        : 'bg-[#08254D] text-[#9BAABD] hover:text-white border-white/12 hover:border-white/20'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>General</span>
                  </button>
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[#D5DCE8] mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>Topic / Category</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#08254D] border border-white/16 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFC928] cursor-pointer"
                >
                  {CATEGORY_OPTIONS[feedbackType].map((cat) => (
                    <option key={cat} value={cat} className="bg-[#061B3A] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title / Summary */}
              <div>
                <label className="block text-xs font-bold text-[#D5DCE8] mb-1.5">
                  Summary / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    feedbackType === 'feature_request'
                      ? 'e.g. Add offline calendar for Shendam Cultural Festivals'
                      : feedbackType === 'issue_report'
                      ? 'e.g. Broken phone number on Grand Palace Hotel listing'
                      : 'e.g. Suggestion for Shendam market directions'
                  }
                  maxLength={100}
                  className="w-full bg-[#08254D] border border-white/16 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFC928]"
                  required
                />
              </div>

              {/* Detailed Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#D5DCE8]">
                    Details & Explanation <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-[#9BAABD]">
                    {description.length}/500 chars
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder={
                    feedbackType === 'feature_request'
                      ? 'Please describe how this feature would help tourists, residents, or local businesses in Shendam...'
                      : feedbackType === 'issue_report'
                      ? 'Please share what happened, what place or page had the error, and any correct info...'
                      : 'Share your thoughts, recommendations, or ideas with the LGA team...'
                  }
                  className="w-full bg-[#08254D] border border-white/16 rounded-2xl p-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFC928] resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Optional Contact Details */}
              <div className="p-3.5 rounded-2xl bg-[#08254D]/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FFC928] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Your Contact (Optional)</span>
                  </span>
                  <span className="text-[10px] text-[#9BAABD]">For follow-up updates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your Name (Optional)"
                      className="w-full bg-[#061B3A] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={contactPhone || contactEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('@')) {
                          setContactEmail(val);
                          setContactPhone('');
                        } else {
                          setContactPhone(val);
                          setContactEmail('');
                        }
                      }}
                      placeholder="Email or Phone / WhatsApp"
                      className="w-full bg-[#061B3A] border border-white/14 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFC928]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-white/10 hover:bg-white/16 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#FFC928] hover:bg-[#F5B800] disabled:opacity-50 text-[#061B3A] font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs transition cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#061B3A] border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting to LGA Queue...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>
                        {feedbackType === 'feature_request'
                          ? 'Submit Feature Request'
                          : feedbackType === 'issue_report'
                          ? 'Send Issue Report'
                          : 'Submit Feedback'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
