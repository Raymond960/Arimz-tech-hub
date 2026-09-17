import React, { useEffect, useState } from 'react';
import { GoogleAdsConfig } from '../../types';
import { fetchAdSettings } from '../../services/adService';
import { isGoogleAdsActive, initializeGoogleAds, pushGoogleAd } from '../../services/googleAdsService';

interface GoogleAdSlotProps {
  placement: string;
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
}

export const GoogleAdSlot: React.FC<GoogleAdSlotProps> = ({
  placement,
  slotId: explicitSlotId,
  format = 'auto',
  className = ''
}) => {
  const [config, setConfig] = useState<GoogleAdsConfig | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkConfig() {
      const settings = await fetchAdSettings();
      if (!isMounted) return;

      const gConfig = settings?.googleAds || null;
      setConfig(gConfig);

      // Check if placement is enabled
      const isPlacementActive = gConfig?.placements ? gConfig.placements[placement] !== false : true;
      if (isGoogleAdsActive(gConfig) && isPlacementActive) {
        const initialized = initializeGoogleAds(gConfig);
        if (initialized) {
          setReady(true);
        }
      }
    }
    checkConfig();
    return () => {
      isMounted = false;
    };
  }, [placement]);

  useEffect(() => {
    if (ready) {
      pushGoogleAd();
    }
  }, [ready]);

  // If Google Ads is disabled, unconfigured, or placement is toggled off: render nothing
  if (!ready || !config) {
    return null;
  }

  const effectiveClientId = config.clientId || (import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID as string);
  const effectiveSlotId = explicitSlotId || config.slotId || (import.meta.env.VITE_GOOGLE_ADS_SLOT_ID as string) || '';

  return (
    <div className={`google-ad-slot-container my-4 overflow-hidden text-center ${className}`} id={`google-ad-${placement}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={effectiveClientId}
        data-ad-slot={effectiveSlotId}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-ad-test={config.testMode ? 'on' : undefined}
      />
    </div>
  );
};
