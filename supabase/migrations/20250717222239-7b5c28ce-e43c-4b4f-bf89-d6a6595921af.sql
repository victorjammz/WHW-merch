-- Create user role enum type
CREATE TYPE public.user_role AS ENUM ('admin', 'employee');

-- Create profiles table to store user information and roles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  -- Prevent users from changing their role
  (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Create trigger to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create secure function to check roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id
$$;

-- Update RLS on inventory table to enforce role-based access
-- Modify existing inventory table permissions
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory" ON public.inventory;

-- Allow everyone to view inventory
CREATE POLICY "Allow all users to view inventory"
ON public.inventory
FOR SELECT
USING (true);

-- Allow only admins to insert inventory
CREATE POLICY "Allow admins to insert inventory"
ON public.inventory
FOR INSERT
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Allow only admins to update inventory
CREATE POLICY "Allow admins to update inventory"
ON public.inventory
FOR UPDATE
USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Allow only admins to delete inventory
CREATE POLICY "Allow admins to delete inventory"
ON public.inventory
FOR DELETE
USING (
  public.get_user_role(auth.uid()) = 'admin'
);