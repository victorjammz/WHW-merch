import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.earthtonewardrobemanager',
  appName: 'earth-tone-wardrobe-manager',
  webDir: 'dist',
  server: {
    url: 'https://206931c4-7aa8-4190-86d9-fa21e1159db8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BarcodeScanner: {
      requestPermissions: true,
      enableTorch: true,
      enablePinchZoom: true,
      enableTapFocus: true,
      preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
    }
  }
};

export default config;