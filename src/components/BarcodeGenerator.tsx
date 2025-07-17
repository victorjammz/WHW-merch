import { useState } from "react";
import { Download, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BarcodeGeneratorProps {
  defaultValue?: string;
  onGenerate?: (code: string, type: string) => void;
}

export function BarcodeGenerator({ defaultValue = "", onGenerate }: BarcodeGeneratorProps) {
  const [barcodeText, setBarcodeText] = useState(defaultValue);
  const [barcodeType, setBarcodeType] = useState("CODE128");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const barcodeTypes = [
    { value: "CODE128", label: "Code 128" },
    { value: "CODE39", label: "Code 39" },
    { value: "EAN13", label: "EAN-13" },
    { value: "EAN8", label: "EAN-8" },
    { value: "UPC", label: "UPC-A" },
  ];

  const generateRandomCode = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `WW${timestamp.slice(-6)}${random}`;
    setBarcodeText(code);
    onGenerate?.(code, barcodeType);
  };

  const handleGenerate = () => {
    if (!barcodeText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text for the barcode",
        variant: "destructive",
      });
      return;
    }
    onGenerate?.(barcodeText, barcodeType);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(barcodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Barcode text copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadBarcode = () => {
    // Create a temporary canvas to generate barcode
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple barcode simulation (in production, use a proper barcode library)
    canvas.width = 300;
    canvas.height = 100;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw barcode bars (simplified representation)
    ctx.fillStyle = '#000000';
    for (let i = 0; i < barcodeText.length * 8; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(10 + i * 3, 10, 2, 60);
      }
    }
    
    // Add text below
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(barcodeText, canvas.width / 2, 85);

    // Download
    const link = document.createElement('a');
    link.download = `barcode-${barcodeText}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Downloaded!",
      description: "Barcode image has been downloaded",
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Barcode Generator
        </CardTitle>
        <CardDescription>
          Generate barcodes for your inventory items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode-text">Barcode Text</Label>
            <Input
              id="barcode-text"
              value={barcodeText}
              onChange={(e) => setBarcodeText(e.target.value)}
              placeholder="Enter text or SKU"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode-type">Barcode Type</Label>
            <Select value={barcodeType} onValueChange={setBarcodeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {barcodeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {barcodeText && (
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-dashed border-border">
            <div className="text-center space-y-4">
              {/* Barcode visualization placeholder */}
              <div className="h-16 bg-gradient-to-r from-foreground via-foreground to-foreground bg-[length:2px_100%] bg-repeat-x mx-auto max-w-xs opacity-80"></div>
              <div className="space-y-2">
                <p className="font-mono text-sm text-foreground">{barcodeText}</p>
                <Badge variant="outline" className="bg-background">{barcodeType}</Badge>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button onClick={generateRandomCode} variant="outline" className="w-full min-w-[150px] py-2">
            <RotateCcw className="h-4 w-4 mr-2" />
            Generate Random
          </Button>
          <Button onClick={copyToClipboard} variant="outline" disabled={!barcodeText} className="w-full">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button onClick={downloadBarcode} variant="outline" disabled={!barcodeText} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleGenerate} className="bg-gradient-primary w-full col-span-2 md:col-span-4" disabled={!barcodeText}>
            Generate Barcode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}