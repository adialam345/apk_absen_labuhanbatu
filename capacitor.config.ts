import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ola.labuhanbatukab.go.id',
  appName: 'Absensi Labuhanbatu',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Izinkan direct HTTP ke server OLA Pemkab
    allowNavigation: [
      'ola.labuhanbatukab.go.id',
      '*.supabase.co'
    ]
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    },
    Geolocation: {
      enableHighAccuracy: true
    }
  }
};

export default config;
