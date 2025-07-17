import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "lucide-react";

export function Barcodes() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <QrCode className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Barcode Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate Barcode</CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeGenerator />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barcode List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No barcodes generated yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}