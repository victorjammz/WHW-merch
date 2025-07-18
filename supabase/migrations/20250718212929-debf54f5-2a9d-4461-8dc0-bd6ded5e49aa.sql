-- Fix infinite recursion in profiles RLS policy by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate the admin policies using the security definer function
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');