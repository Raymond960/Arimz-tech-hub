import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ng.gov.plateau.shendamconnect',
  appName: 'Shendam Connect',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
