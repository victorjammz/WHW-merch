-- Assign default role permissions
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'admin', id FROM public.permissions; -- Admins get all permissions

INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'manager', id FROM public.permissions 
WHERE resource IN ('inventory', 'orders', 'customers', 'analytics') 
   OR (resource = 'settings' AND action = 'read'); -- Managers get most permissions except user management

INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'employee', id FROM public.permissions 
WHERE action = 'read' 
   OR (resource = 'orders' AND action IN ('create', 'update'))
   OR (resource = 'customers' AND action IN ('create', 'update')); -- Employees get read access and basic order/customer operations

INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'viewer', id FROM public.permissions 
WHERE action = 'read'; -- Viewers get read-only access

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(
  user_id uuid,
  permission_name text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles p
    JOIN public.role_permissions rp ON rp.role = p.role
    JOIN public.permissions perm ON perm.id = rp.permission_id
    WHERE p.id = user_id 
      AND perm.name = permission_name
      AND p.status = 'approved'
  );
$$;

-- Create function to check current user permissions
CREATE OR REPLACE FUNCTION public.current_user_has_permission(
  permission_name text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(auth.uid(), permission_name);
$$;