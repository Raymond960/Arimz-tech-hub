import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'segmented' | 'icon-button' | 'row';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'segmented', className = '' }) => {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon-button') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer active:scale-95 shadow-sm ${
          theme === 'dark'
            ? 'bg-white/10 hover:bg-white/20 text-[#FFC928] border border-white/16'
            : 'bg-white hover:bg-[#EEF3F8] text-[#071B3A] border border-[#D8E1EC]'
        } ${className}`}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 stroke-[2.2] text-[#FFC928]" />
        ) : (
          <Moon className="w-5 h-5 stroke-[2.2] text-[#071B3A]" />
        )}
      </button>
    );
  }

  if (variant === 'row') {
    return (
      <div className={`flex items-center justify-between p-3 rounded-2xl border transition ${
        theme === 'dark'
          ? 'bg-[#0B2D5C] border-white/16 text-white'
          : 'bg-white border-[#D8E1EC] text-[#071B3A] shadow-sm'
      } ${className}`}>
        <div className="flex items-center gap-2.5">
          {theme === 'dark' ? (
            <Moon className="w-5 h-5 text-[#FFC928]" />
          ) : (
            <Sun className="w-5 h-5 text-[#F5C400]" />
          )}
          <div className="text-left">
            <div className="text-xs font-bold uppercase tracking-wider">
              Theme Mode
            </div>
            <div className="text-[11px] opacity-75">
              Currently: {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </div>
          </div>
        </div>

        <div className="flex bg-[#04142F] p-1 rounded-xl border border-white/10 dark-toggle-container">
          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-[#071B3A] shadow-md'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            <span>☀️ Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#FFC928] text-[#061B3A] shadow-md'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            <span>🌙 Dark</span>
          </button>
        </div>
      </div>
    );
  }

  // Default: Segmented toggle button
  return (
    <div className={`p-1 bg-[#04142F] dark:bg-[#04142F] border border-white/16 dark:border-white/16 rounded-2xl flex items-center gap-1 light-theme-toggle-box ${className}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-[#071B3A] shadow-lg ring-1 ring-[#D8E1EC]'
            : 'text-[#9BAABD] hover:text-white'
        }`}
      >
        <Sun className="w-4 h-4 text-[#F5C400]" />
        <span>☀️ Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
          theme === 'dark'
            ? 'bg-[#FFC928] text-[#061B3A] shadow-lg'
            : 'text-[#9BAABD] hover:text-white'
        }`}
      >
        <Moon className="w-4 h-4 text-[#061B3A]" />
        <span>🌙 Dark</span>
      </button>
    </div>
  );
};
