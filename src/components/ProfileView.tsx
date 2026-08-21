import React from 'react';
import {
  PhoneCall,
  Crown,
  ShieldCheck,
  PlusCircle,
  Info,
  MapPin,
  ExternalLink
} from 'lucide-react';
import shendamLogoImg from '../assets/shendam_logo.jpg';

interface ProfileViewProps {
  onOpenAddBusiness: () => void;
  savedCount: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenAddBusiness,
  savedCount
}) => {
  return (
    <div className="w-full px-5 py-4 pb-28 space-y-4 animate-in fade-in duration-200">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-[#0B2D5C] to-[#08254D] border border-white/16 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-[#FFC928]/40 shrink-0 bg-[#04142F]">
            <img
              src={shendamLogoImg}
              alt="Shendam Connect"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <span className="text-[10px] bg-[#FFC928]/20 text-[#FFC928] font-bold px-2 py-0.5 rounded border border-[#FFC928]/30 uppercase">
              Plateau State, Nigeria
            </span>
            <h2 className="text-lg font-bold text-white mt-1 font-brand-sans">
              Shendam Local Government
            </h2>
            <p className="text-xs text-[#9BAABD]">
              Headquarters of Plateau South Senatorial District
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-3 text-center">
          <span className="text-xs text-[#9BAABD] block">Saved</span>
          <span className="text-lg font-bold text-[#FFC928]">{savedCount}</span>
        </div>
        <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-3 text-center">
          <span className="text-xs text-[#9BAABD] block">Districts</span>
          <span className="text-lg font-bold text-white">6</span>
        </div>
        <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-3 text-center">
          <span className="text-xs text-[#9BAABD] block">Status</span>
          <span className="text-lg font-bold text-emerald-400">Live</span>
        </div>
      </div>

      {/* Culture & Heritage Guide */}
      <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Crown className="w-4 h-4 text-[#FFC928]" />
          <span>Goemai Heritage & Monarch</span>
        </div>
        <p className="text-xs text-[#D5DCE8] leading-relaxed">
          Shendam is the traditional seat of the <strong>Long Goemai</strong>, supreme ruler of the Goemai Kingdom. Renowned for rich agricultural produce (yam, rice, sesame) and vibrant traditional festivals including the famous <em>Bit Goemai</em> celebration.
        </p>
      </div>

      {/* Emergency Hotlines */}
      <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <PhoneCall className="w-4 h-4 text-[#FFC928]" />
            <span>Emergency Hotlines</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase">24/7 Response</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href="tel:112"
            className="p-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl flex flex-col justify-between transition"
          >
            <span className="text-white font-bold">National Emergency</span>
            <span className="text-[#FFC928] font-semibold mt-1">Dial 112</span>
          </a>

          <a
            href="tel:+2348039110000"
            className="p-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl flex flex-col justify-between transition"
          >
            <span className="text-white font-bold">General Hospital</span>
            <span className="text-[#FFC928] font-semibold mt-1">+234 803 911 0000</span>
          </a>
        </div>
      </div>

      {/* Business Listing Button */}
      <button
        onClick={onOpenAddBusiness}
        className="w-full py-3.5 bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 text-[#061B3A] font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
      >
        <PlusCircle className="w-4 h-4" />
        <span>List Your Business on Shendam Connect</span>
      </button>

      {/* App Info */}
      <div className="text-center pt-2 text-[11px] text-[#9BAABD]">
        <p className="font-bold text-white">SHENDAM CONNECT v1.0</p>
        <p>Discover. Connect. Experience.</p>
      </div>
    </div>
  );
};
