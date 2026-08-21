import React from 'react';
import { Car, Calendar, ShoppingBag, Wrench, HeartPulse, Siren } from 'lucide-react';
import { CategoryId } from '../types';

interface CategoriesRow2Props {
  onSelectCategory: (category: CategoryId) => void;
}

export const CategoriesRow2: React.FC<CategoriesRow2Props> = ({ onSelectCategory }) => {
  const categories: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'transport',
      label: 'Transport',
      icon: <Car className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'shopping',
      label: 'Shopping',
      icon: <ShoppingBag className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Wrench className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'health',
      label: 'Health',
      icon: <HeartPulse className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: <Siren className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    }
  ];

  return (
    <div className="w-full px-5 mt-5 pb-1 z-10">
      {/* Section Header */}
      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-3">
        Categories
      </h3>

      {/* Horizontal Scrollable Circular Categories */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="flex flex-col items-center justify-center min-w-[58px] group cursor-pointer active:scale-95 transition"
          >
            {/* Circular Button */}
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#0B2D5C] border border-white/16 group-hover:border-[#FFC928] group-hover:bg-[#08254D] flex items-center justify-center transition shadow-md">
              {cat.icon}
            </div>

            {/* Label Below */}
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#D5DCE8] group-hover:text-white mt-1.5 text-center leading-tight">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
