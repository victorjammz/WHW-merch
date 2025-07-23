import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  image_url?: string | null;
}

interface CameraButtonProps {
  onInventoryUpdate?: () => void;
}

export const CameraButton = ({ onInventoryUpdate }: CameraButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [operationType, setOperationType] = useState<'add' | 'subtract'>('add');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();
  const { isScanning, startScan, stopScan, hasPermission, checkPermission } = useBarcodeScanner();

  const searchInventoryBySKU = async (scannedCode: string) => {
    try {
      // Search in product_variants table by SKU or barcode
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          quantity,
          price,
          image_url,
          product:products(name, category)
        `)
        .or(`sku.eq.${scannedCode},barcode.eq.${scannedCode}`)
        .single();

      if (variantError || !variantData) {
        toast({
          title: "Item Not Found",
          description: `No inventory item found with SKU/barcode: ${scannedCode}`,
          variant: "destructive",
        });
        setScannedItem(null);
        return;
      }

      const inventoryItem: InventoryItem = {
        id: variantData.id,
        sku: variantData.sku,
        name: variantData.product?.name || 'Unknown Product',
        category: variantData.product?.category || 'Unknown Category',
        quantity: variantData.quantity,
        price: variantData.price,
        image_url: variantData.image_url
      };

      setScannedItem(inventoryItem);
      toast({
        title: "Item Found!",
        description: `Found: ${inventoryItem.name}`,
      });
    } catch (error) {
      console.error('Error searching inventory:', error);
      toast({
        title: "Search Error",
        description: "Failed to search inventory",
        variant: "destructive",
      });
    }
  };

  const handleStartScan = async () => {
    if (!hasPermission) {
      const permission = await checkPermission();
      if (!permission) {
        toast({
          title: "Camera Permission Required",
          description: "Please allow camera access to scan barcodes",
          variant: "destructive",
        });
        return;
      }
    }

    setIsOpen(true);
    setScannedItem(null);
    
    try {
      const result = await startScan();
      if (result && result.hasContent) {
        await searchInventoryBySKU(result.content);
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Error",
        description: "Failed to scan barcode",
        variant: "destructive",
      });
    }
  };

  const updateInventoryQuantity = async () => {
    if (!scannedItem) return;

    setIsUpdating(true);
    try {
      const newQuantity = operationType === 'add' 
        ? scannedItem.quantity + quantityToAdd
        : Math.max(0, scannedItem.quantity - quantityToAdd);

      const { error } = await supabase
        .from('product_variants')
        .update({ quantity: newQuantity })
        .eq('id', scannedItem.id);

      if (error) throw error;

      toast({
        title: "Inventory Updated",
        description: `${scannedItem.name} quantity updated to ${newQuantity}`,
      });

      setIsOpen(false);
      setScannedItem(null);
      setQuantityToAdd(1);
      onInventoryUpdate?.();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Update Error",
        description: "Failed to update inventory",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDialogClose = () => {
    if (isScanning) {
      stopScan();
    }
    setIsOpen(false);
    setScannedItem(null);
    setQuantityToAdd(1);
  };

  return (
    <>
      <Button onClick={handleStartScan} variant="outline" size="sm" disabled={isScanning}>
        <Camera className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Scan Barcode</span>
        <span className="sm:hidden">Scan</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Barcode Scanner</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isScanning && (
              <div className="text-center py-8">
                <p className="text-lg mb-4">Point your camera at a barcode</p>
                <div className="w-full h-64 bg-black rounded-lg flex items-center justify-center">
                  <p className="text-white">Camera scanning...</p>
                </div>
              </div>
            )}

            {scannedItem && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{scannedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {scannedItem.sku}</p>
                  <p className="text-sm text-muted-foreground">Category: {scannedItem.category}</p>
                  <p className="text-sm">Current Stock: <span className="font-medium">{scannedItem.quantity}</span></p>
                  <p className="text-sm">Price: <span className="font-medium">${scannedItem.price}</span></p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={operationType === 'add' ? 'default' : 'outline'}
                    onClick={() => setOperationType('add')}
                    className="flex-1"
                  >
                    Add Stock
                  </Button>
                  <Button
                    variant={operationType === 'subtract' ? 'default' : 'outline'}
                    onClick={() => setOperationType('subtract')}
                    className="flex-1"
                  >
                    Remove Stock
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                    disabled={quantityToAdd <= 1}
                  >
                    -
                  </Button>
                  <span className="flex-1 text-center font-medium">{quantityToAdd}</span>
                  <Button
                    variant="outline"
                    onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                  >
                    +
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDialogClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={updateInventoryQuantity} 
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? 'Updating...' : `${operationType === 'add' ? 'Add' : 'Remove'} ${quantityToAdd}`}
                  </Button>
                </div>
              </div>
            )}

            {!isScanning && !scannedItem && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Click "Scan Barcode" to start scanning</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};