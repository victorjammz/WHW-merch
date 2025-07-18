-- Add approval status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approved_at and approved_by columns
ALTER TABLE public.profiles 
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN approved_by UUID NULL;

-- Create index for better performance
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Update RLS policies to handle pending users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can view their own profile regardless of status
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  )
);

-- Create policy for admin approval
CREATE POLICY "Admins can approve users" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  )
);

-- Update the handle_new_user function to set pending status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'employee',
    'pending'
  );
  RETURN NEW;
END;
$$;