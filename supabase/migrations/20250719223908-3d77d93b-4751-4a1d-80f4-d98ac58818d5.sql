-- Extend user roles to include more granular options
ALTER TYPE user_role ADD VALUE 'manager';
ALTER TYPE user_role ADD VALUE 'viewer';

-- Create permissions table for granular access control
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  resource text NOT NULL, -- e.g., 'inventory', 'orders', 'users', 'customers'
  action text NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions policies (admins can manage, everyone can read)
CREATE POLICY "Admins can manage permissions" 
ON public.permissions 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Everyone can view permissions" 
ON public.permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Everyone can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (true);

-- Insert default permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
-- Inventory permissions
('inventory:create', 'Create new inventory items', 'inventory', 'create'),
('inventory:read', 'View inventory items', 'inventory', 'read'),
('inventory:update', 'Update inventory items', 'inventory', 'update'),
('inventory:delete', 'Delete inventory items', 'inventory', 'delete'),

-- Orders permissions
('orders:create', 'Create new orders', 'orders', 'create'),
('orders:read', 'View orders', 'orders', 'read'),
('orders:update', 'Update orders', 'orders', 'update'),
('orders:delete', 'Delete orders', 'orders', 'delete'),

-- Customers permissions
('customers:create', 'Create new customers', 'customers', 'create'),
('customers:read', 'View customers', 'customers', 'read'),
('customers:update', 'Update customers', 'customers', 'update'),
('customers:delete', 'Delete customers', 'customers', 'delete'),

-- Users permissions
('users:create', 'Create new users', 'users', 'create'),
('users:read', 'View users', 'users', 'read'),
('users:update', 'Update users', 'users', 'update'),
('users:delete', 'Delete users', 'users', 'delete'),

-- Analytics permissions
('analytics:read', 'View analytics and reports', 'analytics', 'read'),

-- Settings permissions
('settings:read', 'View settings', 'settings', 'read'),
('settings:update', 'Update settings', 'settings', 'update');

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