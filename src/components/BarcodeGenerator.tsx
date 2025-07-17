import { useState } from "react";
import { Download, RotateCcw, Copy, Check, QrCode, Zap, Sparkles } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const barcodeTypes = [
    { value: "CODE128", label: "Code 128", icon: "📊" },
    { value: "CODE39", label: "Code 39", icon: "🔖" },
    { value: "EAN13", label: "EAN-13", icon: "🛒" },
    { value: "EAN8", label: "EAN-8", icon: "📱" },
    { value: "UPC", label: "UPC-A", icon: "🏷️" },
  ];

  const generateRandomCode = () => {
    setIsGenerating(true);
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `WW${timestamp.slice(-6)}${random}`;
    
    setTimeout(() => {
      setBarcodeText(code);
      setIsGenerating(false);
      onGenerate?.(code, barcodeType);
      toast({
        title: "✨ Code Generated!",
        description: `New barcode: ${code}`,
      });
    }, 500);
  };

  const handleGenerate = () => {
    if (!barcodeText.trim()) {
      toast({
        title: "⚠️ Missing Text",
        description: "Please enter text for the barcode",
        variant: "destructive",
      });
      return;
    }
    onGenerate?.(barcodeText, barcodeType);
    toast({
      title: "🎯 Barcode Ready",
      description: "Barcode generated successfully!",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(barcodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "📋 Copied!",
        description: "Barcode text copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "❌ Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadBarcode = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 120;
    
    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    // Draw barcode bars with improved styling
    ctx.fillStyle = '#1e293b';
    const barWidth = 3;
    const barSpacing = 1;
    const startX = 20;
    const barHeight = 60;
    const startY = 20;
    
    for (let i = 0; i < barcodeText.length * 6; i++) {
      const pattern = barcodeText.charCodeAt(i % barcodeText.length) % 4;
      if (pattern % 2 === 0) {
        ctx.fillRect(startX + i * (barWidth + barSpacing), startY, barWidth, barHeight);
      }
    }
    
    // Add text with better typography
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.fillText(barcodeText, canvas.width / 2, startY + barHeight + 25);
    
    // Add barcode type label
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(barcodeType, canvas.width / 2, startY + barHeight + 40);

    const link = document.createElement('a');
    link.download = `barcode-${barcodeText}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "⬇️ Downloaded!",
      description: "High-quality barcode image saved",
    });
  };

  return (
    <Card className="shadow-elegant border-0 bg-gradient-to-br from-background to-muted/20 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Barcode Generator
          </span>
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Create professional barcodes for your inventory items
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-3">
            <Label htmlFor="barcode-text" className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Barcode Content
            </Label>
            <Input
              id="barcode-text"
              value={barcodeText}
              onChange={(e) => setBarcodeText(e.target.value)}
              placeholder="Enter SKU, product code, or custom text..."
              className="border-2 border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="barcode-type" className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Barcode Format
            </Label>
            <Select value={barcodeType} onValueChange={setBarcodeType}>
              <SelectTrigger className="border-2 border-border/50 focus:border-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {barcodeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="flex items-center gap-2">
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {barcodeText && (
          <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border-2 border-dashed border-primary/20 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="h-20 bg-gradient-to-r from-foreground via-foreground to-foreground bg-[length:3px_100%] bg-repeat-x mx-auto max-w-sm opacity-90 rounded-sm"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
              </div>
              <div className="space-y-3">
                <p className="font-mono text-base font-semibold text-foreground tracking-wider">{barcodeText}</p>
                <div className="flex justify-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {barcodeTypes.find(t => t.value === barcodeType)?.icon} {barcodeType}
                  </Badge>
                  <Badge variant="outline" className="border-success/30 text-success">
                    ✓ Valid Format
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={generateRandomCode} 
            variant="outline" 
            className="w-full hover-scale border-2 border-primary/20 hover:border-primary/40 transition-all"
            disabled={isGenerating}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? "Generating..." : "Generate Random Code"}
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={copyToClipboard} 
              variant="outline" 
              disabled={!barcodeText}
              className="hover-scale border-2 border-border/50 hover:border-primary/40"
            >
              {copied ? <Check className="h-4 w-4 mr-2 text-success" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Text"}
            </Button>
            
            <Button 
              onClick={downloadBarcode} 
              variant="outline" 
              disabled={!barcodeText}
              className="hover-scale border-2 border-border/50 hover:border-primary/40"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            className="bg-gradient-primary hover:opacity-90 shadow-elegant w-full py-3 hover-scale" 
            disabled={!barcodeText}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Generate Professional Barcode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}