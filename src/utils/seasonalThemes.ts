import { SeasonalThemeType, SeasonalConfig } from '../types';

export interface SeasonalThemePreset {
  id: SeasonalThemeType;
  name: string;
  icon: string;
  badgeLabel: string;
  defaultTitle: string;
  defaultGreeting: string;
  defaultAccent: string;
  gradientFrom: string;
  gradientTo: string;
  borderGlow: string;
}

export const SEASONAL_THEME_PRESETS: Record<SeasonalThemeType, SeasonalThemePreset> = {
  none: {
    id: 'none',
    name: 'Standard Theme',
    icon: '🏛️',
    badgeLabel: 'Shendam Connect',
    defaultTitle: '',
    defaultGreeting: '',
    defaultAccent: '#FFC928',
    gradientFrom: '#05234D',
    gradientTo: '#020B18',
    borderGlow: 'rgba(8, 120, 209, 0.3)'
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas Season',
    icon: '🎄',
    badgeLabel: 'Merry Christmas & Season Greetings',
    defaultTitle: 'Merry Christmas from Shendam Connect!',
    defaultGreeting: 'Wishing all indigenes, residents, and visitors a joyous, peaceful, and blessed Christmas celebration from Shendam Connect.',
    defaultAccent: '#EF4444',
    gradientFrom: '#3B0712',
    gradientTo: '#031024',
    borderGlow: 'rgba(239, 68, 68, 0.4)'
  },
  sallah: {
    id: 'sallah',
    name: 'Sallah (Eid Celebrations)',
    icon: '🌙',
    badgeLabel: 'Eid Mubarak Celebrations',
    defaultTitle: 'Eid Mubarak from Shendam Connect!',
    defaultGreeting: 'May the blessings, harmony, unity, and abundance of this sacred celebration fill every home from Shendam Connect.',
    defaultAccent: '#10B981',
    gradientFrom: '#062E20',
    gradientTo: '#02131F',
    borderGlow: 'rgba(16, 185, 129, 0.4)'
  },
  easter: {
    id: 'easter',
    name: 'Easter Celebrations',
    icon: '✝️',
    badgeLabel: 'Happy Easter Season',
    defaultTitle: 'Happy Easter from Shendam Connect!',
    defaultGreeting: 'Wishing you and your family renewed hope, good health, peace, and joyous blessings from Shendam Connect.',
    defaultAccent: '#F59E0B',
    gradientFrom: '#361E05',
    gradientTo: '#03142B',
    borderGlow: 'rgba(245, 158, 11, 0.4)'
  },
  new_year: {
    id: 'new_year',
    name: 'New Year Celebrations',
    icon: '🎆',
    badgeLabel: 'Happy New Year',
    defaultTitle: 'Happy New Year from Shendam Connect!',
    defaultGreeting: 'Welcoming a thriving, secure, and prosperous new year of enterprise and growth to all businesses and families from Shendam Connect.',
    defaultAccent: '#FFC928',
    gradientFrom: '#2E2002',
    gradientTo: '#020C1F',
    borderGlow: 'rgba(255, 201, 40, 0.4)'
  },
  independence_day: {
    id: 'independence_day',
    name: 'Nigeria Independence Day',
    icon: '🇳🇬',
    badgeLabel: 'Happy Independence Day',
    defaultTitle: 'Happy Independence Day from Shendam Connect!',
    defaultGreeting: 'Celebrating our rich unity, heritage, culture, and progress with Shendam Connect, the proud heartbeat of Southern Plateau.',
    defaultAccent: '#16A34A',
    gradientFrom: '#062B16',
    gradientTo: '#021321',
    borderGlow: 'rgba(22, 163, 74, 0.4)'
  },
  custom: {
    id: 'custom',
    name: 'Custom Cultural Campaign',
    icon: '⭐',
    badgeLabel: 'Festive Campaign Active',
    defaultTitle: 'Special Celebrations from Shendam Connect',
    defaultGreeting: 'Warmest greetings, cultural pride, and hearty felicitations to all residents, businesses, and visitors from Shendam Connect.',
    defaultAccent: '#FFC928',
    gradientFrom: '#1E1538',
    gradientTo: '#020B18',
    borderGlow: 'rgba(255, 201, 40, 0.4)'
  }
};

export function getSeasonalThemeDetails(seasonal?: SeasonalConfig | null): {
  isActive: boolean;
  theme: SeasonalThemePreset;
  title: string;
  greeting: string;
  accentColor: string;
  bannerUrl: string | null;
  showBadge: boolean;
} {
  const activeTheme = seasonal?.activeTheme || 'none';
  const isActive = activeTheme !== 'none';
  const preset = SEASONAL_THEME_PRESETS[activeTheme] || SEASONAL_THEME_PRESETS.none;

  const title = (seasonal?.customTitle && seasonal.customTitle.trim() !== '')
    ? seasonal.customTitle
    : preset.defaultTitle;

  const greeting = (seasonal?.customGreeting && seasonal.customGreeting.trim() !== '')
    ? seasonal.customGreeting
    : preset.defaultGreeting;

  const accentColor = seasonal?.accentColor || preset.defaultAccent;
  const bannerUrl = seasonal?.customBannerUrl || null;
  const showBadge = seasonal?.showCelebrationBadge !== false;

  return {
    isActive,
    theme: preset,
    title,
    greeting,
    accentColor,
    bannerUrl,
    showBadge
  };
}
