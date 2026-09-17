import React from 'react';
import { NotificationItem } from '../types';
import { X, CheckCheck, Bell } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B2D5C] border border-white/16 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0B2D5C]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#08254D] border border-[#FFC928]/30 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-[#FFC928] stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-brand-sans">
                Shendam Updates
              </h3>
              <p className="text-[11px] text-[#9BAABD]">
                {unreadCount} unread announcements
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

        {/* Mark All Read */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-[#08254D] flex justify-end border-b border-white/10">
            <button
              onClick={onMarkAllRead}
              className="text-[#FFC928] hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="p-4 space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition ${
                !item.read
                  ? 'bg-[#08254D] border-white/16 shadow'
                  : 'bg-[#061B3A] border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="bg-[#FFC928] text-[#061B3A] font-extrabold px-2 py-0.5 rounded uppercase">
                  {item.category}
                </span>
                <span className="text-[#9BAABD]">{item.time}</span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1.5 leading-snug">
                {item.title}
              </h4>
              <p className="text-xs text-[#D5DCE8] mt-1 leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;

