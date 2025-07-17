import { useState } from "react";
import { Wifi, WifiOff, Settings, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function POSConnectionCard() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState({
    posSystem: "",
    apiKey: "",
    storeId: "",
    endpoint: ""
  });
  
  const { toast } = useToast();

  const posSystems = [
    "Square",
    "Shopify POS",
    "Clover",
    "Toast POS",
    "Lightspeed",
    "Vend",
    "Other"
  ];

  const handleConnect = async () => {
    if (!connectionConfig.posSystem || !connectionConfig.apiKey) {
      toast({
        title: "Missing Information",
        description: "Please select a POS system and enter your API key.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    // Simulate API connection
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      toast({
        title: "Successfully Connected!",
        description: `Connected to ${connectionConfig.posSystem}. Your inventory will now sync automatically.`,
      });
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionConfig({
      posSystem: "",
      apiKey: "",
      storeId: "",
      endpoint: ""
    });
    toast({
      title: "Disconnected",
      description: "POS system has been disconnected.",
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <Wifi className="h-6 w-6 text-success" />
          ) : (
            <WifiOff className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <CardTitle>POS Connection</CardTitle>
            <CardDescription>
              Connect your Point of Sale system to sync inventory automatically
            </CardDescription>
          </div>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-success" : ""}>
          {isConnected ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Connected
            </>
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pos-system">POS System</Label>
                <Select 
                  value={connectionConfig.posSystem} 
                  onValueChange={(value) => setConnectionConfig(prev => ({ ...prev, posSystem: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your POS system" />
                  </SelectTrigger>
                  <SelectContent>
                    {posSystems.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-id">Store ID (Optional)</Label>
                <Input
                  id="store-id"
                  value={connectionConfig.storeId}
                  onChange={(e) => setConnectionConfig(prev => ({ ...prev, storeId: e.target.value }))}
                  placeholder="Your store identifier"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={connectionConfig.apiKey}
                onChange={(e) => setConnectionConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Enter your POS system API key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">API Endpoint (Optional)</Label>
              <Input
                id="endpoint"
                value={connectionConfig.endpoint}
                onChange={(e) => setConnectionConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="https://api.yourpos.com/v1"
              />
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full bg-gradient-primary"
            >
              {isConnecting ? "Connecting..." : "Connect POS System"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
              <div>
                <h4 className="font-semibold text-success">Connected to {connectionConfig.posSystem}</h4>
                <p className="text-sm text-muted-foreground">
                  Last sync: {new Date().toLocaleString()}
                </p>
              </div>
              <Settings className="h-5 w-5 text-success" />
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline" onClick={handleDisconnect} className="flex-1">
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}