import React from 'react';
import { Megaphone, ChevronRight } from 'lucide-react';

interface ListBusinessBannerProps {
  onOpenAddBusiness: () => void;
}

export const ListBusinessBanner: React.FC<ListBusinessBannerProps> = ({ onOpenAddBusiness }) => {
  return (
    <div className="w-full px-5 mt-5 z-10">
      <div className="w-full bg-[#0B2D5C] border border-white/16 hover:border-[#FFC928]/60 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition">
        {/* Left: Megaphone Icon in Gold Circle */}
        <div className="w-12 h-12 rounded-full border-2 border-[#FFC928]/80 bg-[#08254D] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,184,0,0.25)]">
          <Megaphone className="w-5 h-5 text-[#FFC928] -rotate-12 stroke-[2]" />
        </div>

        {/* Middle Text */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm sm:text-base text-[#FFC928] leading-tight">
            List Your Business
          </h4>
          <p className="text-[#D5DCE8] text-[11px] sm:text-xs leading-tight mt-0.5 whitespace-pre-line">
            Get discovered by thousands of locals and tourists.
          </p>
        </div>

        {/* Right Button: "Get Started >" */}
        <button
          onClick={onOpenAddBusiness}
          className="bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 text-[#061B3A] font-extrabold text-xs sm:text-sm px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl flex items-center gap-1 shrink-0 shadow-md transition cursor-pointer"
        >
          <span>Get Started</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
