import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bsh.carpetcontrol.designer',
  appName: 'Carpet Control Designer',
  webDir: '../../dist/designer-app/browser',
  server: {
    url: 'https://proloom-designer.web.app',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
