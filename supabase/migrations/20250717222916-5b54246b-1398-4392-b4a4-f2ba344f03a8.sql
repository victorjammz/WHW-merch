-- Create a more secure function for updating user roles
-- This function allows admins to update roles safely
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  user_id UUID,
  new_role user_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Check if the calling user is an admin
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can update user roles';
  END IF;
  
  -- Update the user's role
  UPDATE public.profiles 
  SET 
    role = new_role,
    updated_at = now()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;