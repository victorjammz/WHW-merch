import { useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

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
        const status = await BarcodeScanner.checkPermission({ force: true });
        
        if (status.granted) {
          setHasPermission(true);
          console.log('Native camera permission granted');
          return true;
        } else {
          toast({
            title: "Camera permission required",
            description: "Please allow camera access in your device settings to use barcode scanning",
            variant: "destructive"
          });
          return false;
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
    console.log('Starting barcode scan...');

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
        const result = await BarcodeScanner.startScan();
        
        setIsScanning(false);
        
        // Restore background
        document.body.style.background = '';
        
        if (result.hasContent) {
          console.log('Native barcode scanned successfully:', result.content);
          
          toast({
            title: "Barcode scanned!",
            description: `Found: ${result.content}`,
          });
          
          return {
            hasContent: true,
            content: result.content
          };
        } else {
          console.log('Native scan cancelled');
          return null;
        }
      } else {
        // Use web-based scanner for browser
        console.log('Using web-based barcode scanner');
        
        return new Promise((resolve) => {
          try {
            // Clean up any existing scanner first
            const existingElement = document.getElementById('barcode-scanner');
            if (existingElement) {
              console.log('Removing existing scanner element');
              document.body.removeChild(existingElement);
            }

            // Create scanner element
            const scannerElement = document.createElement('div');
            scannerElement.id = 'barcode-scanner';
            scannerElement.style.position = 'fixed';
            scannerElement.style.top = '0';
            scannerElement.style.left = '0';
            scannerElement.style.width = '100%';
            scannerElement.style.height = '100%';
            scannerElement.style.zIndex = '9999';
            scannerElement.style.backgroundColor = 'black';
            document.body.appendChild(scannerElement);
            console.log('Scanner element created and added to DOM');

            const config = {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              disableFlip: false,
              videoConstraints: {
                facingMode: 'environment'
              }
            };

            console.log('Creating Html5QrcodeScanner with config:', config);
            const scanner = new Html5QrcodeScanner(
              'barcode-scanner',
              config,
              false
            );

            scannerRef.current = scanner;

            // Add a close button first
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
            closeButton.style.fontSize = '14px';
            
            closeButton.addEventListener('click', () => {
              console.log('Close button clicked');
              try {
                scanner.clear();
              } catch (error) {
                console.error('Error clearing scanner:', error);
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
              
              resolve(null);
            });
            
            scannerElement.appendChild(closeButton);

            console.log('Starting scanner render...');
            
            try {
              scanner.render(
                (decodedText) => {
                  console.log('Web barcode scanned successfully:', decodedText);
                  
                  try {
                    scanner.clear();
                  } catch (error) {
                    console.error('Error clearing scanner after scan:', error);
                  }
                  
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
                  if (errorMessage && !errorMessage.includes('No MultiFormat Readers')) {
                    console.log('Scanner error (non-critical):', errorMessage);
                  }
                }
              );
              console.log('Scanner render initiated successfully');
            } catch (renderError) {
              console.error('Scanner render failed:', renderError);
              
              const element = document.getElementById('barcode-scanner');
              if (element) {
                document.body.removeChild(element);
              }
              setIsScanning(false);
              
              let errorMessage = "Failed to start camera. Please check camera permissions.";
              
              if (renderError.message) {
                if (renderError.message.includes('NotAllowedError')) {
                  errorMessage = "Camera access denied. Please allow camera access in your browser settings.";
                } else if (renderError.message.includes('NotFoundError')) {
                  errorMessage = "No camera found. Please ensure your device has a camera.";
                } else if (renderError.message.includes('NotReadableError')) {
                  errorMessage = "Camera is busy. Please close other apps using the camera.";
                } else if (renderError.message.includes('OverconstrainedError')) {
                  errorMessage = "Camera doesn't support the required settings. Try a different camera.";
                }
              }
              
              toast({
                title: "Camera failed to start",
                description: errorMessage,
                variant: "destructive"
              });
              
              resolve(null);
            }

          } catch (error) {
            console.error('Failed to initialize web scanner:', error);
            setIsScanning(false);
            
            const element = document.getElementById('barcode-scanner');
            if (element) {
              document.body.removeChild(element);
            }
            
            toast({
              title: "Scanner initialization failed",
              description: `Failed to initialize barcode scanner: ${error.message || 'Unknown error'}. Please try again.`,
              variant: "destructive"
            });
            
            resolve(null);
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