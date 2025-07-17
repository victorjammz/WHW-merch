import { useState } from "react";
import { Search, Download, Printer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Mock barcode data
const mockBarcodes = [
  {
    id: "1",
    sku: "WW-TSH-001",
    productName: "Worship T-Shirt",
    barcodeText: "123456789012",
    barcodeType: "CODE128",
    category: "Apparel",
    lastGenerated: "2024-01-15"
  },
  {
    id: "2",
    sku: "WW-MUG-002",
    productName: "Coffee Mug",
    barcodeText: "234567890123",
    barcodeType: "CODE128",
    category: "Accessories",
    lastGenerated: "2024-01-14"
  },
  {
    id: "3",
    sku: "WW-BK-003",
    productName: "Study Bible",
    barcodeText: "345678901234",
    barcodeType: "CODE128",
    category: "Books",
    lastGenerated: "2024-01-13"
  }
];

const Barcodes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  const filteredBarcodes = mockBarcodes.filter(barcode =>
    barcode.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barcode.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    barcode.barcodeText.includes(searchTerm)
  );

  const handlePrint = (barcode: any) => {
    window.print();
  };

  const handleDownload = (barcode: any) => {
    // This would typically generate a downloadable barcode image
    console.log("Downloading barcode for:", barcode.sku);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barcode Management</h1>
          <p className="text-muted-foreground">
            Generate and manage product barcodes
          </p>
        </div>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Barcode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate New Barcode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <BarcodeGenerator />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barcodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBarcodes.length}</div>
            <p className="text-xs text-muted-foreground">
              Generated barcodes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apparel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockBarcodes.filter(b => b.category === "Apparel").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Apparel barcodes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockBarcodes.filter(b => b.category === "Books").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Book barcodes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockBarcodes.filter(b => b.category === "Accessories").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Accessory barcodes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barcodes Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Generated Barcodes</CardTitle>
              <CardDescription>
                View and manage all generated barcodes
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search barcodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBarcodes.map((barcode) => (
                <TableRow key={barcode.id}>
                  <TableCell>
                    <div className="font-medium">{barcode.sku}</div>
                  </TableCell>
                  <TableCell>
                    <div>{barcode.productName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {barcode.barcodeText}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {barcode.barcodeType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {barcode.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{barcode.lastGenerated}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePrint(barcode)}
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Print
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(barcode)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBarcodes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No barcodes found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Barcodes;