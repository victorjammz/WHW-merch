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
      
      // Hide background content for full camera view
      document.body.classList.add('scanner-active');
      await BarcodeScanner.hideBackground();
      
      console.log('Starting camera scan...');
      
      const result = await BarcodeScanner.startScan();
      
      console.log('Scan result:', result);
      
      // Show background content again
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      
      setIsScanning(false);
      
      if (result.hasContent) {
        toast({
          title: "Barcode scanned!",
          description: `Found: ${result.content}`,
        });
        return result;
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
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
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
      await BarcodeScanner.stopScan();
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.showBackground();
      setIsScanning(false);
      
      toast({
        title: "Scan cancelled",
        description: "Barcode scanning was stopped.",
      });
    } catch (error) {
      console.error('Failed to stop scan:', error);
      document.body.classList.remove('scanner-active');
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