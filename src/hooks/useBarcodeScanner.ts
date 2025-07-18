import { useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

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
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera access');
      }

      // For web-based scanner, we check if camera is available
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Try to use back camera first
        } 
      });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      console.log('Camera permission granted');
      return true;
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
    console.log('Starting barcode scan...');

    // Check permissions first
    const hasPermissions = await checkPermission();
    if (!hasPermissions) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        setIsScanning(true);

        // Create scanner element if it doesn't exist
        let scannerElement = document.getElementById('barcode-scanner');
        if (!scannerElement) {
          scannerElement = document.createElement('div');
          scannerElement.id = 'barcode-scanner';
          scannerElement.style.position = 'fixed';
          scannerElement.style.top = '0';
          scannerElement.style.left = '0';
          scannerElement.style.width = '100%';
          scannerElement.style.height = '100%';
          scannerElement.style.zIndex = '9999';
          scannerElement.style.backgroundColor = 'black';
          document.body.appendChild(scannerElement);
        }

        const scanner = new Html5QrcodeScanner(
          'barcode-scanner',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            console.log('Barcode scanned:', decodedText);
            
            // Stop scanner and clean up
            scanner.clear();
            const element = document.getElementById('barcode-scanner');
            if (element) {
              document.body.removeChild(element);
            }
            setIsScanning(false);
            
            toast({
              title: "Barcode scanned!",
              description: `Found: ${decodedText}`,
            });
            
            resolve({
              hasContent: true,
              content: decodedText
            });
          },
          (errorMessage) => {
            // This is called for every frame that doesn't contain a barcode
            // We don't want to log this as it's expected behavior
          }
        );

        // Add a close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕ Close Scanner';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '20px';
        closeButton.style.right = '20px';
        closeButton.style.zIndex = '10000';
        closeButton.style.padding = '10px 15px';
        closeButton.style.backgroundColor = '#ff4444';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.addEventListener('click', () => {
          scanner.clear();
          const element = document.getElementById('barcode-scanner');
          if (element) {
            document.body.removeChild(element);
          }
          setIsScanning(false);
          
          toast({
            title: "Scan cancelled",
            description: "Barcode scanning was stopped.",
          });
          
          resolve(null);
        });
        
        scannerElement.appendChild(closeButton);

      } catch (error) {
        console.error('Scanning failed:', error);
        setIsScanning(false);
        
        toast({
          title: "Scanning failed",
          description: `Camera error: ${error.message || 'Unknown error'}. Please try again.`,
          variant: "destructive"
        });
        
        resolve(null);
      }
    });
  };

  const stopScan = async () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      
      const element = document.getElementById('barcode-scanner');
      if (element) {
        document.body.removeChild(element);
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