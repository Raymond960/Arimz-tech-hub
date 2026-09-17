import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface AdminDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName: string;
  itemType?: string;
  isDeleting?: boolean;
}

export const AdminDeleteConfirmModal: React.FC<AdminDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete this listing?',
  itemName,
  itemType = 'business listing',
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-brand-sans">
      <div className="bg-[#051C3D] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#9BAABD] hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Heading */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">{title}</h3>
            <p className="text-xs text-[#9BAABD]">This action will permanently remove the business listing.</p>
          </div>
        </div>

        {/* Confirmation Detail */}
        <div className="bg-[#08254D] border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-xs text-[#D5DCE8] leading-relaxed">
            Target listing:
          </p>
          <p className="text-sm font-bold text-white bg-black/40 px-3 py-2 rounded-xl border border-white/10">
            "{itemName}"
          </p>
          <p className="text-[11px] text-rose-300/90 leading-tight">
            Once deleted, this listing will be permanently removed from the application's actual data source and public directory.
          </p>
        </div>

        {/* Actions: CANCEL vs DELETE */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-2xl border border-white/14 text-[#9BAABD] hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'DELETING...' : 'DELETE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
