import React from 'react';
import { Hotel, UtensilsCrossed, Store, Camera, LayoutGrid } from 'lucide-react';
import { CategoryId } from '../types';

interface CategoryButtonsRow1Props {
  selectedCategory?: CategoryId | 'all';
  onSelectCategory: (cat: CategoryId | 'more') => void;
}

export const CategoryButtonsRow1: React.FC<CategoryButtonsRow1Props> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const categories: { id: CategoryId | 'more'; label: string; icon: React.ReactNode }[] = [
    {
      id: 'hotels',
      label: 'Hotels',
      icon: <Hotel className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'restaurants',
      label: 'Restaurants',
      icon: <UtensilsCrossed className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'businesses',
      label: 'Businesses',
      icon: <Store className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'tourist_spots',
      label: 'Tourist Spots',
      icon: <Camera className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    },
    {
      id: 'more',
      label: 'More',
      icon: <LayoutGrid className="w-5 h-5 text-[#FFC928] stroke-[2]" />
    }
  ];

  return (
    <div className="w-full px-5 mt-4 z-10">
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center justify-center group cursor-pointer"
            >
              {/* Rounded Square Card */}
              <div
                className={`w-full aspect-square rounded-2xl border flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 ${
                  isSelected
                    ? 'border-[#FFC928] bg-[#08254D] shadow-[0_0_12px_rgba(255,201,40,0.35)]'
                    : 'bg-[#0B2D5C] border-white/16 hover:border-[#FFC928]/60 hover:bg-[#08254D]'
                }`}
              >
                {cat.icon}
              </div>

              {/* Text Label Below */}
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#D5DCE8] group-hover:text-white mt-1.5 text-center leading-tight">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
