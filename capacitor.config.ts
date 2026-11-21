import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neilkelshikar.cleats',
  appName: 'Cleats',
  webDir: 'public',
  server: {
    url: 'https://zippy-crystal-2cmj4pf.vercel.app',
    cleartext: false,
    allowNavigation: [
      'zippy-crystal-2cmj4pf.vercel.app',
      '*.youtube.com',
      '*.espncdn.com',
    ],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#090b10',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
  },
};

export default config;
