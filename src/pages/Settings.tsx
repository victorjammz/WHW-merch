import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, User, Bell, Shield, Upload, Trash2, Camera, Globe, Palette, Key, Download, Upload as UploadIcon, RefreshCw, Calendar, MapPin, Plus, Edit, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from "@/contexts/CurrencyContext";
import { getAvailableDateFormats, formatDateWithUserSettings } from "@/utils/dateFormatting";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Settings = () => {
  const { user } = useAuth();
  const { settings, isLoading, isSaving, updateSettings, uploadAvatar, deleteAvatar } = useUserSettings();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Events Management state
  const [events, setEvents] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    name: "",
    location: "",
    event_date: ""
  });
  const [activeEventsTab, setActiveEventsTab] = useState("events");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "notifications", "security", "regional", "appearance", "events"].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (tab === "events") {
      fetchEvents();
      fetchEventLogs();
    }
  }, [searchParams]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const avatarUrl = await uploadAvatar(avatarFile);
    if (avatarUrl) {
      await updateSettings({ avatar_url: avatarUrl });
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleDeleteAvatar = async () => {
    await deleteAvatar();
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const getInitials = () => {
    if (user?.email) {
      return user.email.split('@')[0].charAt(0).toUpperCase();
    }
    return "U";
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Password changed successfully"
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to change password: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportSettings = () => {
    if (!settings) return;
    
    const settingsToExport = {
      ...settings,
      user_id: undefined,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    };
    
    const dataStr = JSON.stringify(settingsToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'settings-export.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings exported",
      description: "Your settings have been exported successfully"
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        await updateSettings(importedSettings);
        toast({
          title: "Settings imported",
          description: "Your settings have been imported successfully"
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import settings. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      return;
    }

    const defaultSettings = {
      company_name: 'Warehouse Worship',
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      low_stock_alerts: true,
      order_updates: true,
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en',
      date_format: 'MM/dd/yyyy',
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry: 90,
      theme: 'light',
      sidebar_collapsed: false
    };

    await updateSettings(defaultSettings);
  };

  // Events Management functions
  const fetchEvents = async () => {
    setIsEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_created_by_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setIsEventsLoading(false);
    }
  };

  const fetchEventLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('event_logs')
        .select(`
          *,
          events(name),
          profiles!event_logs_performed_by_fkey(first_name, last_name, email)
        `)
        .order('performed_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setEventLogs(data || []);
    } catch (error) {
      console.error('Error fetching event logs:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.name || !eventForm.location || !eventForm.event_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: eventForm.name,
          location: eventForm.location,
          event_date: eventForm.event_date,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully"
      });

      setEventForm({ name: "", location: "", event_date: "" });
      setIsCreateEventOpen(false);
      fetchEvents();
      fetchEventLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create event: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });

      fetchEvents();
      fetchEventLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete event: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your application settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="profile" className="text-xs md:text-sm p-2">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs md:text-sm p-2">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="text-xs md:text-sm p-2">Security</TabsTrigger>
          <TabsTrigger value="regional" className="text-xs md:text-sm p-2">Regional</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs md:text-sm p-2">Appearance</TabsTrigger>
          <TabsTrigger value="events" className="text-xs md:text-sm p-2">Events</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal and company information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24">
                    <AvatarImage src={avatarPreview || settings?.avatar_url || ""} />
                    <AvatarFallback className="text-lg md:text-xl bg-primary/10 text-primary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                          <Camera className="h-4 w-4" />
                          <span className="text-xs md:text-sm">Change Avatar</span>
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                      {(settings?.avatar_url || avatarPreview) && (
                        <Button variant="outline" size="sm" onClick={handleDeleteAvatar} className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {avatarFile && (
                      <Button size="sm" onClick={handleAvatarUpload} disabled={isSaving} className="w-full sm:w-auto">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed here
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings?.company_name || ""}
                      onChange={(e) => updateSettings({ company_name: e.target.value })}
                      placeholder="Enter company name"
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings?.phone || ""}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={settings?.address || ""}
                    onChange={(e) => updateSettings({ address: e.target.value })}
                    placeholder="Enter company address"
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings?.email_notifications || false}
                    onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via text message
                    </p>
                  </div>
                  <Switch
                    checked={settings?.sms_notifications || false}
                    onCheckedChange={(checked) => updateSettings({ sms_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings?.push_notifications || false}
                    onCheckedChange={(checked) => updateSettings({ push_notifications: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when inventory runs low
                    </p>
                  </div>
                  <Switch
                    checked={settings?.low_stock_alerts || false}
                    onCheckedChange={(checked) => updateSettings({ low_stock_alerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about order status changes
                    </p>
                  </div>
                  <Switch
                    checked={settings?.order_updates || false}
                    onCheckedChange={(checked) => updateSettings({ order_updates: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your security preferences and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={settings?.two_factor_auth || false}
                  onCheckedChange={(checked) => updateSettings({ two_factor_auth: checked })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select 
                    value={settings?.session_timeout?.toString() || "30"} 
                    onValueChange={(value) => updateSettings({ session_timeout: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                  <Select 
                    value={settings?.password_expiry?.toString() || "90"} 
                    onValueChange={(value) => updateSettings({ password_expiry: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Password Change Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Change Password
                </h4>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="w-fit"
                  >
                    {isChangingPassword ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Settings Management */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Settings Management</h4>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportSettings}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Settings
                  </Button>
                  
                  <label htmlFor="import-settings" className="cursor-pointer">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <UploadIcon className="h-4 w-4" />
                      Import Settings
                    </Button>
                    <input
                      id="import-settings"
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                    />
                  </label>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetSettings}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset to Default
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Export your settings as a backup, import previous settings, or reset to default values.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Settings */}
        <TabsContent value="regional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Configure language, currency, and date formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={settings?.currency || "GBP"} 
                    onValueChange={(value) => updateSettings({ currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settings?.language || "en"} 
                    onValueChange={(value) => updateSettings({ language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={settings?.date_format || "MM/dd/yyyy"} 
                    onValueChange={(value) => updateSettings({ date_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDateFormats().map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          <div className="flex justify-between items-center w-full">
                            <span>{format.label}</span>
                            <span className="text-muted-foreground ml-4">{format.example}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select 
                  value={settings?.timezone || "America/New_York"} 
                  onValueChange={(value) => updateSettings({ timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  value={settings?.theme || "light"} 
                  onValueChange={(value) => updateSettings({ theme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred theme or sync with your system
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Collapsed Sidebar</Label>
                  <p className="text-sm text-muted-foreground">
                    Start with sidebar collapsed by default
                  </p>
                </div>
                <Switch
                  checked={settings?.sidebar_collapsed || false}
                  onCheckedChange={(checked) => updateSettings({ sidebar_collapsed: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Management */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events Management
              </CardTitle>
              <CardDescription>
                Create and manage events for order categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeEventsTab} onValueChange={setActiveEventsTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="logs">Event Log</TabsTrigger>
                </TabsList>

                {/* Events List Tab */}
                <TabsContent value="events" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Events</h3>
                    <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Event</DialogTitle>
                          <DialogDescription>
                            Add a new event that can be used as a category in orders
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="event-name">Event Name *</Label>
                            <Input
                              id="event-name"
                              value={eventForm.name}
                              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                              placeholder="Enter event name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="event-location">Location *</Label>
                            <Input
                              id="event-location"
                              value={eventForm.location}
                              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                              placeholder="Enter event location"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="event-date">Event Date *</Label>
                            <Input
                              id="event-date"
                              type="date"
                              value={eventForm.event_date}
                              onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateEvent}>
                            Create Event
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {isEventsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No events found. Create your first event to get started.
                              </TableCell>
                            </TableRow>
                          ) : (
                            events.map((event) => (
                              <TableRow key={event.id}>
                                <TableCell className="font-medium">{event.name}</TableCell>
                                <TableCell className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  {event.location}
                                </TableCell>
                                <TableCell>
                                  {formatDateWithUserSettings(new Date(event.event_date), settings?.date_format)}
                                </TableCell>
                                <TableCell>
                                  {event.profiles?.first_name && event.profiles?.last_name 
                                    ? `${event.profiles.first_name} ${event.profiles.last_name}`
                                    : event.profiles?.email || 'Unknown'
                                  }
                                </TableCell>
                                <TableCell>
                                  {formatDateWithUserSettings(new Date(event.created_at), settings?.date_format)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewEvent(event)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteEvent(event.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Event Logs Tab */}
                <TabsContent value="logs" className="space-y-4">
                  <h3 className="text-lg font-medium">Event Activity Log</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Performed By</TableHead>
                          <TableHead>Date & Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No event activity found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          eventLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">
                                {log.events?.name || 'Deleted Event'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  log.action === 'created' ? 'default' :
                                  log.action === 'updated' ? 'secondary' :
                                  'destructive'
                                }>
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {log.profiles?.first_name && log.profiles?.last_name 
                                  ? `${log.profiles.first_name} ${log.profiles.last_name}`
                                  : log.profiles?.email || 'Unknown'
                                }
                              </TableCell>
                              <TableCell className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {formatDateWithUserSettings(new Date(log.performed_at), settings?.date_format)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label className="text-sm font-medium">Event Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEvent.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedEvent.location}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Event Date</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDateWithUserSettings(new Date(selectedEvent.event_date), settings?.date_format)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedEvent.profiles?.first_name && selectedEvent.profiles?.last_name 
                      ? `${selectedEvent.profiles.first_name} ${selectedEvent.profiles.last_name}`
                      : selectedEvent.profiles?.email || 'Unknown'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDateWithUserSettings(new Date(selectedEvent.created_at), settings?.date_format)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;