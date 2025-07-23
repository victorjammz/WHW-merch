import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

export const CameraButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const openCamera = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // On mobile, we'll use a simple camera interface
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Use back camera
          } 
        });
        setStream(stream);
        setIsOpen(true);
      } else {
        // On desktop, open camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        setStream(stream);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsOpen(false);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      closeCamera();
    }
  };

  return (
    <>
      <Button onClick={openCamera} variant="outline" size="sm">
        <Camera className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Camera</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Camera</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {stream && (
              <div className="relative">
                <video
                  ref={(video) => {
                    if (video && stream) {
                      video.srcObject = stream;
                      video.play();
                    }
                  }}
                  className="w-full h-64 md:h-96 bg-black rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeCamera}>
                Close Camera
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};