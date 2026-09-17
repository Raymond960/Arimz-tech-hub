import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandingConfig } from '../types';

interface BrandingContextType {
  branding: BrandingConfig;
  updateBranding: (newBranding: BrandingConfig) => void;
  refreshBranding: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_BRANDING: BrandingConfig = {
  splashLogo: null,
  homepageLogo: null
};

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  updateBranding: () => {},
  refreshBranding: async () => {},
  loading: false
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    if (typeof window !== 'undefined') {
      const splash = localStorage.getItem('scSplashLogo');
      const header = localStorage.getItem('scHeaderLogo');
      if (splash || header) {
        return {
          splashLogo: splash || null,
          homepageLogo: header || null
        };
      }
      const cached = localStorage.getItem('shendam_branding_v1');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return DEFAULT_BRANDING;
        }
      }
    }
    return DEFAULT_BRANDING;
  });
  const [loading, setLoading] = useState(false);

  const fetchBranding = async () => {
    // Check localStorage keys first
    if (typeof window !== 'undefined') {
      const splash = localStorage.getItem('scSplashLogo');
      const header = localStorage.getItem('scHeaderLogo');
      if (splash || header) {
        setBranding({
          splashLogo: splash || null,
          homepageLogo: header || null
        });
        return;
      }
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const updateBranding = (newBranding: BrandingConfig) => {
    setBranding(newBranding);
    if (typeof window !== 'undefined') {
      if (newBranding.splashLogo) {
        localStorage.setItem('scSplashLogo', newBranding.splashLogo);
      } else {
        localStorage.removeItem('scSplashLogo');
      }
      if (newBranding.homepageLogo) {
        localStorage.setItem('scHeaderLogo', newBranding.homepageLogo);
      } else {
        localStorage.removeItem('scHeaderLogo');
      }
      localStorage.setItem('shendam_branding_v1', JSON.stringify(newBranding));
    }
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, refreshBranding: fetchBranding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
