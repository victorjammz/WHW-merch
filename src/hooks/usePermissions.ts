import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface RolePermission {
  role: 'admin' | 'manager' | 'employee' | 'viewer';
  permission: Permission;
}

export function usePermissions() {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserPermissions();
      fetchAllPermissions();
      fetchRolePermissions();
    }
  }, [user]);

  const fetchUserPermissions = async () => {
    if (!user) return;

    try {
      // Get user's role first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get permissions for that role
      const { data: rolePerms, error: permsError } = await supabase
        .from('role_permissions')
        .select(`
          permissions (
            name
          )
        `)
        .eq('role', profile.role);

      if (permsError) throw permsError;

      const permissions = rolePerms
        ?.map((rp: any) => rp.permissions.name)
        .filter((name: string) => name) || [];

      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true });

      if (error) throw error;
      setAllPermissions(data || []);
    } catch (error) {
      console.error('Error fetching all permissions:', error);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          role,
          permissions (*)
        `)
        .order('role', { ascending: true });

      if (error) throw error;
      
      const rolePerms = data?.map((rp: any) => ({
        role: rp.role,
        permission: rp.permissions
      })) || [];

      setRolePermissions(rolePerms);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permissionName: string): boolean => {
    return userPermissions.includes(permissionName);
  };

  const canCreate = (resource: string): boolean => {
    return hasPermission(`${resource}:create`);
  };

  const canRead = (resource: string): boolean => {
    return hasPermission(`${resource}:read`);
  };

  const canUpdate = (resource: string): boolean => {
    return hasPermission(`${resource}:update`);
  };

  const canDelete = (resource: string): boolean => {
    return hasPermission(`${resource}:delete`);
  };

  const updateRolePermissions = async (
    role: 'admin' | 'manager' | 'employee' | 'viewer',
    permissionIds: string[]
  ) => {
    try {
      // Remove existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role);

      // Add new permissions
      if (permissionIds.length > 0) {
        const newRolePermissions = permissionIds.map(permissionId => ({
          role,
          permission_id: permissionId
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(newRolePermissions);

        if (error) throw error;
      }

      await fetchRolePermissions();
      await fetchUserPermissions(); // Refresh user permissions if their role was updated
      
      return { success: true };
    } catch (error) {
      console.error('Error updating role permissions:', error);
      return { success: false, error };
    }
  };

  return {
    userPermissions,
    allPermissions,
    rolePermissions,
    isLoading,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    updateRolePermissions,
    refreshPermissions: () => {
      fetchUserPermissions();
      fetchRolePermissions();
    }
  };
}