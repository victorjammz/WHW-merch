import { useState } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

export interface BarcodeScanResult {
  hasContent: boolean;
  content: string;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  const checkPermission = async (): Promise<boolean> => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        setHasPermission(true);
        return true;
      }
      
      if (status.denied) {
        toast({
          title: "Camera permission denied",
          description: "Please enable camera access in your device settings to use barcode scanning",
          variant: "destructive"
        });
        return false;
      }
      
      return status.granted;
    } catch (error) {
      console.error('Permission check failed:', error);
      toast({
        title: "Permission error",
        description: "Failed to check camera permissions",
        variant: "destructive"
      });
      return false;
    }
  };

  const startScan = async (): Promise<BarcodeScanResult | null> => {
    // For web environment, show a mock scanner for testing
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "Web Demo Mode",
        description: "Enter a test SKU to simulate scanning. Try 'TEST001' or any existing SKU.",
        variant: "default"
      });
      
      // For demo purposes, return a test result
      const testSku = prompt("Enter SKU to simulate barcode scan (or cancel):");
      if (testSku) {
        return {
          hasContent: true,
          content: testSku.trim()
        };
      }
      return null;
    }

    const hasPermissions = await checkPermission();
    if (!hasPermissions) {
      return null;
    }

    try {
      setIsScanning(true);
      
      // Hide background content
      document.body.classList.add('scanner-active');
      BarcodeScanner.hideBackground();
      
      const result = await BarcodeScanner.startScan();
      
      // Show background content again
      document.body.classList.remove('scanner-active');
      BarcodeScanner.showBackground();
      
      setIsScanning(false);
      
      if (result.hasContent) {
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Scanning failed:', error);
      document.body.classList.remove('scanner-active');
      BarcodeScanner.showBackground();
      setIsScanning(false);
      
      toast({
        title: "Scanning failed",
        description: "Failed to scan barcode. Please try again.",
        variant: "destructive"
      });
      
      return null;
    }
  };

  const stopScan = async () => {
    try {
      await BarcodeScanner.stopScan();
      document.body.classList.remove('scanner-active');
      BarcodeScanner.showBackground();
      setIsScanning(false);
    } catch (error) {
      console.error('Failed to stop scan:', error);
    }
  };

  return {
    isScanning,
    hasPermission,
    startScan,
    stopScan,
    checkPermission
  };
};