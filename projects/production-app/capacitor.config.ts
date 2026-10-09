import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.proloom.production',
  appName: 'Factory Floor',
  webDir: '../../dist/production-app/browser',
  bundledWebRuntime: false,
  server: {
    url: 'https://proloom-production.web.app',
    cleartext: true
  }
};

export default config;
