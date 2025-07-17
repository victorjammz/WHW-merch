import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input placeholder="Warehouse Worship" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="admin@warehouseworship.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dark Mode</Label>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <Label>Notifications</Label>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>POS Integration</Label>
              <p className="text-xs text-muted-foreground">Connect your Point of Sale system</p>
            </div>
            <Button variant="outline">Connect</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Accounting Software</Label>
              <p className="text-xs text-muted-foreground">Sync with your accounting platform</p>
            </div>
            <Button variant="outline">Connect</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}