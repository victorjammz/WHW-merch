-- Create a storage bucket for user profile assets (avatars, documents, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-profiles', 'user-profiles', false);

-- Create storage policies for user profile bucket
-- Allow users to view their own profile assets
CREATE POLICY "Users can view their own profile assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to upload their own profile assets
CREATE POLICY "Users can upload their own profile assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own profile assets
CREATE POLICY "Users can update their own profile assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own profile assets
CREATE POLICY "Users can delete their own profile assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create user_settings table to store profile settings
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Company Information
    company_name TEXT,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    low_stock_alerts BOOLEAN DEFAULT true,
    order_updates BOOLEAN DEFAULT true,
    
    -- Regional Settings
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'America/New_York',
    language TEXT DEFAULT 'en',
    date_format TEXT DEFAULT 'MM/dd/yyyy',
    
    -- Security Settings
    two_factor_auth BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30, -- in minutes
    password_expiry INTEGER DEFAULT 90, -- in days
    
    -- System Preferences
    theme TEXT DEFAULT 'light', -- light, dark, auto
    sidebar_collapsed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Ensure one settings record per user
    UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_settings table
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize user settings when a user signs up
CREATE OR REPLACE FUNCTION public.initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to initialize settings for new users
CREATE TRIGGER on_user_created_initialize_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_settings();