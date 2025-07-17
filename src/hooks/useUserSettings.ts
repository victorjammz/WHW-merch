import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  id?: string;
  user_id?: string;
  
  // Company Information
  company_name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  
  // Notification Settings
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  low_stock_alerts?: boolean;
  order_updates?: boolean;
  
  // Regional Settings
  currency?: string;
  timezone?: string;
  language?: string;
  date_format?: string;
  
  // Security Settings
  two_factor_auth?: boolean;
  session_timeout?: number;
  password_expiry?: number;
  
  // System Preferences
  theme?: string;
  sidebar_collapsed?: boolean;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user settings
  const fetchSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings found, create default ones
        await createDefaultSettings();
        return;
      }

      if (error) throw error;

      setSettings(data);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      toast({
        title: "Error loading settings",
        description: "Failed to load your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create default settings for new users
  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
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

      const { data, error } = await supabase
        .from('user_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
    } catch (error) {
      console.error('Error creating default settings:', error);
      toast({
        title: "Error creating settings",
        description: "Failed to create default settings.",
        variant: "destructive"
      });
    }
  };

  // Update user settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(newSettings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      // Delete existing avatar if it exists
      if (settings?.avatar_url) {
        const oldFileName = settings.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('user-profiles')
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('user-profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete avatar
  const deleteAvatar = async () => {
    if (!user || !settings?.avatar_url) return;

    try {
      const fileName = settings.avatar_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('user-profiles')
          .remove([`${user.id}/${fileName}`]);
      }

      await updateSettings({ avatar_url: null });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete avatar. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    uploadAvatar,
    deleteAvatar,
    refetchSettings: fetchSettings
  };
};