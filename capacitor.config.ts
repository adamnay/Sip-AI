import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sipai.app',
  appName: 'Sip AI',
  webDir: 'dist',
  // Set WebView background to white to match the light splash
  backgroundColor: '#ffffff',
  ios: {
    backgroundColor: '#ffffff',
  },
  server: {
    // Remove this block before production — dev only for hot reload
    // androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#f2f3f7',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
