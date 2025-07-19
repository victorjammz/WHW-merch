import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database, TestTube } from 'lucide-react';

const sampleItems = [
  {
    sku: 'WHW-00001',
    name: 'Sample T-Shirt',
    category: 'Clothing',
    size: 'M',
    color: 'Blue',
    quantity: 50,
    price: 19.99,
    status: 'in_stock',
    barcode_text: 'WHW-00001',
    barcode_type: 'CODE128'
  },
  {
    sku: 'WHW-00002', 
    name: 'Sample Hoodie',
    category: 'Clothing',
    size: 'L',
    color: 'Black',
    quantity: 25,
    price: 39.99,
    status: 'in_stock',
    barcode_text: 'WHW-00002',
    barcode_type: 'CODE128'
  },
  {
    sku: 'WHW-00003',
    name: 'Test Merchandise',
    category: 'Accessories',
    size: 'One Size',
    color: 'Red',
    quantity: 10,
    price: 9.99,
    status: 'in_stock',
    barcode_text: 'WHW-00003',
    barcode_type: 'CODE128'
  }
];

export function TestDataHelper() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addSampleData = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .upsert(sampleItems, { 
          onConflict: 'sku',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Sample data added",
        description: "Added test items with SKUs: WHW-00001, WHW-00002, WHW-00003",
      });
    } catch (error) {
      console.error('Error adding sample data:', error);
      toast({
        title: "Failed to add sample data",
        description: error.message || "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Barcode Scanner Test
        </CardTitle>
        <CardDescription>
          Add sample inventory items to test the barcode scanner functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Click the button below to add test items with these SKUs and barcodes:
          </p>
          <ul className="text-sm space-y-1">
            <li><code className="bg-muted px-1 rounded">WHW-00001</code> - Sample T-Shirt (Barcode: WHW-00001)</li>
            <li><code className="bg-muted px-1 rounded">WHW-00002</code> - Sample Hoodie (Barcode: WHW-00002)</li>
            <li><code className="bg-muted px-1 rounded">WHW-00003</code> - Test Merchandise (Barcode: WHW-00003)</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            After adding these items, you can test the barcode scanner by:
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li><strong>On mobile:</strong> Use your camera to scan actual barcodes with these codes</li>
            <li><strong>On web:</strong> Enter any of these codes when prompted</li>
            <li>The scanner will find items by both SKU and barcode_text fields</li>
          </ul>
          <Button 
            onClick={addSampleData} 
            disabled={isLoading}
            className="w-full"
          >
            <Database className="mr-2 h-4 w-4" />
            {isLoading ? 'Adding Sample Data...' : 'Add Sample Test Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}