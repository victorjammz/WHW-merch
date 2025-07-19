import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, User, Bell, Shield, Upload, Trash2, Camera, Globe, Palette, Key, Download, Upload as UploadIcon, RefreshCw, Calendar, MapPin, Plus, Edit, Trash, QrCode, Copy, CheckCircle } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from "@/contexts/CurrencyContext";
import { getAvailableDateFormats, formatDateWithUserSettings } from "@/utils/dateFormatting";

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
  const [events, setEvents] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({
    name: '',
    location: '',
    event_date: undefined as Date | undefined
  });
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // 2FA state
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["profile", "notifications", "security", "regional", "appearance", "events"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents();
      fetchCurrentUserRole();
      fetchProfiles();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "profile") {
      fetchUserProfile();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === "security") {
      check2FAStatus();
    }
  }, [activeTab, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      setProfileData({
        first_name: data?.first_name || '',
        last_name: data?.last_name || ''
      });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCurrentUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      setCurrentUserRole(data?.role || '');
    } catch (error: any) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch events: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.name || !eventForm.location || !eventForm.event_date) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate event name
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id')
      .eq('name', eventForm.name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      toast({
        title: "Error",
        description: "Failed to check for duplicate events: " + checkError.message,
        variant: "destructive"
      });
      return;
    }

    if (existingEvent) {
      toast({
        title: "Error",
        description: "An event with this name already exists",
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
          event_date: eventForm.event_date.toISOString().split('T')[0],
          created_by: user?.id
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully"
      });

      setEventForm({ name: '', location: '', event_date: undefined });
      setIsEventDialogOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create event: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      location: event.location,
      event_date: new Date(event.event_date)
    });
    setIsEditEventDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!eventForm.name || !eventForm.location || !eventForm.event_date || !editingEvent) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate event name (excluding current event)
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id')
      .eq('name', eventForm.name)
      .neq('id', editingEvent.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      toast({
        title: "Error",
        description: "Failed to check for duplicate events: " + checkError.message,
        variant: "destructive"
      });
      return;
    }

    if (existingEvent) {
      toast({
        title: "Error",
        description: "An event with this name already exists",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: eventForm.name,
          location: eventForm.location,
          event_date: eventForm.event_date.toISOString().split('T')[0]
        })
        .eq('id', editingEvent.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully"
      });

      setEventForm({ name: '', location: '', event_date: undefined });
      setIsEditEventDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update event: " + error.message,
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete event: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getCreatorName = (createdBy: string) => {
    const profile = profiles.find(p => p.id === createdBy);
    if (profile) {
      return profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile.email;
    }
    return 'Unknown';
  };

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

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2FA Functions
  const check2FAStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data.totp.find(factor => factor.status === 'verified');
      setIs2FAEnabled(!!totpFactor);
    } catch (error: any) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const initiate2FASetup = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Warehouse Worship',
        friendlyName: user?.email || 'Account'
      });

      if (error) throw error;

      setTotpSecret(data.totp.secret);
      setQrCodeUrl(data.totp.uri);
      setIs2FADialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to setup 2FA: " + error.message,
        variant: "destructive"
      });
    }
  };

  const verify2FASetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying2FA(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.data.totp[0];

      // Create a challenge first
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });

      if (challengeError) throw challengeError;

      const { error } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: verificationCode
      });

      if (error) throw error;

      // Generate backup codes
      const codes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(codes);

      await updateSettings({ two_factor_auth: true });
      setIs2FAEnabled(true);
      
      toast({
        title: "Success",
        description: "Two-factor authentication has been enabled successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const totpFactor = data.totp.find(factor => factor.status === 'verified');
      
      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id
        });
        
        if (error) throw error;
      }

      await updateSettings({ two_factor_auth: false });
      setIs2FAEnabled(false);
      setIs2FADialogOpen(false);
      setVerificationCode('');
      setBackupCodes([]);

      toast({
        title: "Success",
        description: "Two-factor authentication has been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to disable 2FA: " + error.message,
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
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
                    <Label htmlFor="firstName" className="text-sm">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter your first name"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter your last name"
                      className="text-sm"
                    />
                  </div>
                </div>

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

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </Button>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      {is2FAEnabled 
                        ? "2FA is enabled on your account" 
                        : "Add an extra layer of security to your account"
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {is2FAEnabled ? (
                      <Button variant="destructive" size="sm" onClick={disable2FA}>
                        Disable 2FA
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={initiate2FASetup}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Enable 2FA
                      </Button>
                    )}
                  </div>
                </div>
                
                {is2FAEnabled && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Two-factor authentication is active
                    </div>
                  </div>
                )}
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
                Create and manage your events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Events</h4>
                <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                      <DialogDescription>
                        Enter the event details below
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventName">Event Name</Label>
                        <Input
                          id="eventName"
                          value={eventForm.name}
                          onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter event name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eventLocation">Location</Label>
                        <Input
                          id="eventLocation"
                          value={eventForm.location}
                          onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter event location"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Event Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !eventForm.event_date && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {eventForm.event_date ? format(eventForm.event_date, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={eventForm.event_date}
                              onSelect={(date) => setEventForm(prev => ({ ...prev, event_date: date }))}
                              className="p-3 pointer-events-auto"
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateEvent}>
                        Create Event
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              {/* Events List */}
              <div className="space-y-4">
                {isLoadingEvents ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events created yet</p>
                    <p className="text-sm">Create your first event to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h5 className="font-medium">{event.name}</h5>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(event.event_date), "PPP")}
                              </div>
                              {currentUserRole === 'admin' && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Created by: {getCreatorName(event.created_by)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(currentUserRole === 'admin' || event.created_by === user?.id) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditEvent(event)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Edit Event Dialog */}
              <Dialog open={isEditEventDialogOpen} onOpenChange={setIsEditEventDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                    <DialogDescription>
                      Update the event details below
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editEventName">Event Name</Label>
                      <Input
                        id="editEventName"
                        value={eventForm.name}
                        onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter event name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEventLocation">Location</Label>
                      <Input
                        id="editEventLocation"
                        value={eventForm.location}
                        onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter event location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !eventForm.event_date && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {eventForm.event_date ? format(eventForm.event_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={eventForm.event_date}
                            onSelect={(date) => setEventForm(prev => ({ ...prev, event_date: date }))}
                            className="p-3 pointer-events-auto"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setIsEditEventDialogOpen(false);
                      setEditingEvent(null);
                      setEventForm({ name: '', location: '', event_date: undefined });
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateEvent}>
                      Update Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </DialogDescription>
          </DialogHeader>
          
          {!backupCodes.length ? (
            <div className="space-y-4">
              {qrCodeUrl && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-lg">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                  
                  <div className="space-y-2 w-full">
                    <Label className="text-sm">Or enter this secret manually:</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={totpSecret} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(totpSecret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Enter verification code from your authenticator app:</Label>
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">2FA Successfully Enabled!</span>
                </div>
                <p className="text-sm text-green-700">
                  Please save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Backup Codes</Label>
                  <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm text-center p-2 bg-background rounded">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {!backupCodes.length ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIs2FADialogOpen(false);
                    setVerificationCode('');
                    setQrCodeUrl('');
                    setTotpSecret('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={verify2FASetup}
                  disabled={verificationCode.length !== 6 || isVerifying2FA}
                >
                  {isVerifying2FA ? "Verifying..." : "Verify & Enable"}
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  setIs2FADialogOpen(false);
                  setVerificationCode('');
                  setQrCodeUrl('');
                  setTotpSecret('');
                  setBackupCodes([]);
                }}
                className="w-full"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;