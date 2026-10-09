import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bsh.carpetcontrol.am',
  appName: 'Carpet Control AM',
  webDir: '../../dist/am-app/browser',
  server: {
    url: 'https://proloom-am.web.app',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
