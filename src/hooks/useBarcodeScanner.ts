import { useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export interface BarcodeScanResult {
  hasContent: boolean;
  content: string;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  const checkPermission = async (): Promise<boolean> => {
    try {
      if (Capacitor.isNativePlatform()) {
        // For native platforms, check camera permission
        const status = await BarcodeScanner.checkPermissions();
        
        if (status.camera === 'granted') {
          setHasPermission(true);
          console.log('Native camera permission granted');
          return true;
        } else {
          // Request permission if not granted
          const requestResult = await BarcodeScanner.requestPermissions();
          if (requestResult.camera === 'granted') {
            setHasPermission(true);
            console.log('Native camera permission granted after request');
            return true;
          } else {
            toast({
              title: "Camera permission required",
              description: "Please allow camera access in your device settings to use barcode scanning",
              variant: "destructive"
            });
            return false;
          }
        }
      } else {
        // For web platforms, check getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser does not support camera access');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment'
          } 
        });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        console.log('Web camera permission granted');
        return true;
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      let errorMessage = "Please enable camera access to use barcode scanning";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera access was denied. Please allow camera access and try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera access is not supported in this browser.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      }
      
      toast({
        title: "Camera permission failed",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const startScan = async (): Promise<BarcodeScanResult | null> => {
    console.log('🔍 Starting barcode scan...');
    console.log('📱 Platform check - isNativePlatform:', Capacitor.isNativePlatform());

    // Check permissions first
    const hasPermissions = await checkPermission();
    if (!hasPermissions) {
      console.log('Permission check failed, aborting scan');
      return null;
    }

    setIsScanning(true);

    try {
      if (Capacitor.isNativePlatform()) {
        // Use native Capacitor barcode scanner for mobile
        console.log('Using native Capacitor barcode scanner');
        
        // Hide the background content
        document.body.style.background = 'transparent';
        
        // Start the native scanner
        const result = await BarcodeScanner.scan();
        
        setIsScanning(false);
        
        // Restore background
        document.body.style.background = '';
        
        if (result.barcodes && result.barcodes.length > 0) {
          const scannedValue = result.barcodes[0].displayValue || result.barcodes[0].rawValue;
          console.log('Native barcode scanned successfully:', scannedValue);
          
          toast({
            title: "Barcode scanned!",
            description: `Found: ${scannedValue}`,
          });
          
          return {
            hasContent: true,
            content: scannedValue
          };
        } else {
          console.log('Native scan cancelled or no barcode found');
          return null;
        }
      } else {
        // Use simplified web-based scanner for browser
        console.log('🌐 Using web-based barcode scanner');
        
        return new Promise((resolve) => {
          let isResolved = false;
          
          const cleanup = () => {
            console.log('🧹 Cleaning up scanner...');
            try {
              if (scannerRef.current) {
                scannerRef.current.clear();
                scannerRef.current = null;
              }
            } catch (e) {
              console.log('Warning: Error clearing scanner:', e);
            }
            
            try {
              const element = document.getElementById('barcode-scanner');
              if (element && element.parentNode) {
                document.body.removeChild(element);
              }
            } catch (e) {
              console.log('Warning: Error removing scanner element:', e);
            }
            
            setIsScanning(false);
          };

          const resolveOnce = (result: BarcodeScanResult | null) => {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              resolve(result);
            }
          };

          try {
            console.log('🌐 Setting up web scanner...');
            
            // Clean up any existing scanner first
            cleanup();

            // Create scanner element
            const scannerElement = document.createElement('div');
            scannerElement.id = 'barcode-scanner';
            scannerElement.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 9999;
              background-color: #000000;
              display: flex;
              flex-direction: column;
            `;
            document.body.appendChild(scannerElement);
            console.log('✅ Scanner element created');

            // Add close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '✕ Close Scanner';
            closeButton.style.cssText = `
              position: absolute;
              top: 20px;
              right: 20px;
              z-index: 10000;
              padding: 10px 15px;
              background-color: #ff4444;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              font-family: Arial, sans-serif;
            `;
            
            closeButton.addEventListener('click', () => {
              console.log('❌ Close button clicked');
              toast({
                title: "Scan cancelled",
                description: "Barcode scanning was stopped.",
              });
              resolveOnce(null);
            });
            
            scannerElement.appendChild(closeButton);

            // Simple, reliable scanner config
            const config = {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            };

            console.log('📷 Creating Html5QrcodeScanner with simplified config...');
            
            const scanner = new Html5QrcodeScanner('barcode-scanner', config, false);
            scannerRef.current = scanner;

            console.log('🎬 Starting scanner render...');
            
            scanner.render(
              (decodedText) => {
                console.log('✅ Barcode scanned:', decodedText);
                
                toast({
                  title: "Barcode scanned!",
                  description: `Found: ${decodedText}`,
                });
                
                resolveOnce({
                  hasContent: true,
                  content: decodedText
                });
              },
              (errorMessage) => {
                // Only log meaningful errors
                if (errorMessage && 
                    !errorMessage.includes('No MultiFormat Readers') && 
                    !errorMessage.includes('NotFoundException') &&
                    !errorMessage.includes('No QR code found') &&
                    !errorMessage.includes('QR code parse error')) {
                  console.log('⚠️ Scanner error:', errorMessage);
                }
              }
            );
            
            console.log('🚀 Scanner initialized successfully');
            
          } catch (error) {
            console.error('❌ Failed to set up scanner:', error);
            
            toast({
              title: "Scanner initialization failed",
              description: `Unable to initialize barcode scanner: ${error.message || 'Unknown error'}. Please try refreshing the page.`,
              variant: "destructive"
            });
            
            resolveOnce(null);
          }
        });
      }
    } catch (error) {
      console.error('Barcode scanning failed:', error);
      setIsScanning(false);
      
      toast({
        title: "Scanning failed",
        description: `Barcode scanning failed: ${error.message || 'Unknown error'}. Please try again.`,
        variant: "destructive"
      });
      
      return null;
    }
  };

  const stopScan = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Stop native scanner
        await BarcodeScanner.stopScan();
        // Restore background
        document.body.style.background = '';
      } else {
        // Stop web scanner
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        
        const element = document.getElementById('barcode-scanner');
        if (element) {
          document.body.removeChild(element);
        }
      }
      
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