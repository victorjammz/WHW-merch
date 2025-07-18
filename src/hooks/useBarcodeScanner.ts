import { useState } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
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
      const permissions = await BarcodeScanner.checkPermissions();
      
      if (permissions.camera === 'granted') {
        setHasPermission(true);
        return true;
      }
      
      // Request permissions if not granted
      const result = await BarcodeScanner.requestPermissions();
      if (result.camera === 'granted') {
        setHasPermission(true);
        return true;
      }
      
      toast({
        title: "Camera permission denied",
        description: "Please enable camera access in your device settings to use barcode scanning",
        variant: "destructive"
      });
      return false;
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
    console.log('Starting scan - Platform check:', {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent
    });

    // For web environment, show a mock scanner for testing
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "Web Demo Mode",
        description: "Enter a test SKU to simulate scanning. Try 'TEST001' or any existing SKU.",
        variant: "default"
      });
      
      // For demo purposes, return a test result
      const testSku = prompt("Enter SKU/Barcode to simulate scanning (or cancel):");
      if (testSku) {
        return {
          hasContent: true,
          content: testSku.trim()
        };
      }
      return null;
    }

    // Mobile/Native platform - use actual camera
    const hasPermissions = await checkPermission();
    if (!hasPermissions) {
      return null;
    }

    try {
      setIsScanning(true);
      
      console.log('Starting camera scan...');
      
      const { barcodes } = await BarcodeScanner.scan();
      
      console.log('Scan result:', barcodes);
      
      setIsScanning(false);
      
      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0];
        toast({
          title: "Barcode scanned!",
          description: `Found: ${barcode.displayValue}`,
        });
        return {
          hasContent: true,
          content: barcode.displayValue
        };
      } else {
        toast({
          title: "No barcode detected",
          description: "Please try scanning again with better lighting and focus.",
          variant: "destructive"
        });
        return null;
      }
      
    } catch (error) {
      console.error('Scanning failed:', error);
      setIsScanning(false);
      
      toast({
        title: "Scanning failed",
        description: `Camera error: ${error.message || 'Unknown error'}. Please try again.`,
        variant: "destructive"
      });
      
      return null;
    }
  };

  const stopScan = async () => {
    try {
      setIsScanning(false);
      
      toast({
        title: "Scan cancelled",
        description: "Barcode scanning was stopped.",
      });
    } catch (error) {
      console.error('Failed to stop scan:', error);
      setIsScanning(false);
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