import { useState, useEffect } from 'react';
import { QrCode, Camera, X, Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  image_url?: string | null;
}

interface BarcodeScannerInventoryProps {
  onInventoryUpdate?: () => void;
}

export function BarcodeScannerInventory({ onInventoryUpdate }: BarcodeScannerInventoryProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [operationType, setOperationType] = useState<'add' | 'subtract'>('add');
  
  const { isScanning, startScan, stopScan } = useBarcodeScanner();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const handleStartScan = async () => {
    setIsDialogOpen(true);
    const result = await startScan();
    
    if (result && result.hasContent) {
      await searchInventoryBySKU(result.content);
    } else {
      setIsDialogOpen(false);
    }
  };

  const searchInventoryBySKU = async (scannedCode: string) => {
    try {
      console.log('Searching for barcode/SKU:', scannedCode);
      
      // Search using both barcode_text and SKU fields for maximum compatibility
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`sku.eq.${scannedCode},barcode_text.eq.${scannedCode}`)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        // No item found - show a helpful message
        toast({
          title: "Item not found",
          description: `No inventory item found with barcode/SKU: ${scannedCode}. Make sure the item exists in your inventory and the barcode matches the SKU or barcode_text field.`,
          variant: "destructive"
        });
        setIsDialogOpen(false);
        return;
      }

      console.log('Found item:', data);
      setScannedItem(data as InventoryItem);
    } catch (error) {
      console.error('Error searching inventory:', error);
      toast({
        title: "Search failed",
        description: "Failed to search for inventory item. Please try again.",
        variant: "destructive"
      });
      setIsDialogOpen(false);
    }
  };

  const updateInventoryQuantity = async () => {
    if (!scannedItem) return;

    setIsUpdating(true);
    try {
      const changeAmount = operationType === 'add' ? quantityToAdd : -quantityToAdd;
      const newQuantity = Math.max(0, scannedItem.quantity + changeAmount);
      
      console.log('Updating inventory:', { id: scannedItem.id, newQuantity });
      
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', scannedItem.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      const actionText = operationType === 'add' ? 'Added' : 'Removed';
      toast({
        title: "Inventory updated",
        description: `${actionText} ${quantityToAdd} units ${operationType === 'add' ? 'to' : 'from'} ${scannedItem.name}. New total: ${newQuantity}`,
      });

      // Call the callback to refresh inventory
      onInventoryUpdate?.();
      
      setIsDialogOpen(false);
      setScannedItem(null);
      setQuantityToAdd(1);
      setOperationType('add');
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Update failed",
        description: `Failed to update inventory quantity: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDialogClose = () => {
    if (isScanning) {
      stopScan();
    }
    setIsDialogOpen(false);
    setScannedItem(null);
    setQuantityToAdd(1);
    setOperationType('add');
  };

  return (
    <>
      <Button onClick={handleStartScan} className="flex items-center gap-2">
        <QrCode className="h-4 w-4" />
        Scan Barcode
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Barcode Scanner
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {isScanning ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium">Scanner Active</p>
                      <p className="text-sm text-muted-foreground">
                        Point your camera at a barcode to scan
                      </p>
                    </div>
                    <Button variant="outline" onClick={stopScan}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel Scan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : scannedItem ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Item Found!</CardTitle>
                  <CardDescription>
                    Confirm quantity to add to inventory
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    {scannedItem.image_url ? (
                      <img 
                        src={scannedItem.image_url} 
                        alt={scannedItem.name}
                        className="h-16 w-16 rounded-md object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                        <QrCode className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <h3 className="font-medium">{scannedItem.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {scannedItem.sku}</p>
                      <Badge variant="secondary">{scannedItem.category}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Stock:</span>
                      <p className="font-medium">{scannedItem.quantity} units</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="font-medium">{formatPrice(scannedItem.price)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        variant={operationType === 'add' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOperationType('add')}
                        className="flex-1"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Stock
                      </Button>
                      <Button 
                        variant={operationType === 'subtract' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOperationType('subtract')}
                        className="flex-1"
                      >
                        <Minus className="mr-1 h-3 w-3" />
                        Remove Stock
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Quantity to {operationType === 'add' ? 'Add' : 'Remove'}:
                      </label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                        >
                          -
                        </Button>
                        <span className="flex-1 text-center font-medium">{quantityToAdd}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setQuantityToAdd(quantityToAdd + 1)}
                        >
                          +
                        </Button>
                      </div>
                      {operationType === 'subtract' && quantityToAdd > scannedItem.quantity && (
                        <p className="text-xs text-destructive">
                          Warning: This will reduce stock below zero
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDialogClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={updateInventoryQuantity} 
                      disabled={isUpdating}
                      className="flex-1"
                      variant={operationType === 'subtract' ? 'destructive' : 'default'}
                    >
                      {isUpdating ? (
                        <>{operationType === 'add' ? 'Adding' : 'Removing'}...</>
                      ) : (
                        <>
                          {operationType === 'add' ? (
                            <Plus className="mr-2 h-4 w-4" />
                          ) : (
                            <Minus className="mr-2 h-4 w-4" />
                          )}
                          {operationType === 'add' ? 'Add Stock' : 'Remove Stock'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">No item found</p>
                      <p className="text-sm text-muted-foreground">
                        The scanned barcode doesn't match any inventory items
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleDialogClose}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}