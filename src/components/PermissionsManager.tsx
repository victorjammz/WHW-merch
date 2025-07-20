import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, UserCog, Package, ShoppingCart, Users, BarChart3, Settings } from 'lucide-react';

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

interface PermissionsManagerProps {
  allPermissions: Permission[];
  rolePermissions: RolePermission[];
  selectedRole: 'admin' | 'manager' | 'employee' | 'viewer';
  onRoleChange: (role: 'admin' | 'manager' | 'employee' | 'viewer') => void;
  onUpdatePermissions: (permissionIds: string[]) => void;
  isLoading: boolean;
}

export default function PermissionsManager({
  allPermissions,
  rolePermissions,
  selectedRole,
  onRoleChange,
  onUpdatePermissions,
  isLoading
}: PermissionsManagerProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Get permissions for the selected role
  const currentRolePermissions = rolePermissions
    .filter(rp => rp.role === selectedRole)
    .map(rp => rp.permission.id);

  // Initialize selected permissions when role changes
  useEffect(() => {
    const rolePerms = rolePermissions
      .filter(rp => rp.role === selectedRole)
      .map(rp => rp.permission.id);
    setSelectedPermissions(new Set(rolePerms));
  }, [selectedRole, rolePermissions]);

  const groupedPermissions = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const resourceIcons = {
    inventory: Package,
    orders: ShoppingCart,
    customers: Users,
    users: User,
    analytics: BarChart3,
    settings: Settings
  };

  const roleConfig = {
    admin: { icon: Shield, label: 'Administrator', className: 'bg-red-500 text-white' },
    manager: { icon: UserCog, label: 'Manager', className: 'bg-blue-500 text-white' },
    employee: { icon: User, label: 'Employee', className: 'bg-green-500 text-white' },
    viewer: { icon: User, label: 'Viewer', className: 'bg-gray-500 text-white' }
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleResourceToggle = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const resourcePermissionIds = resourcePermissions.map(p => p.id);
    const allSelected = resourcePermissionIds.every(id => selectedPermissions.has(id));
    
    const newSelected = new Set(selectedPermissions);
    if (allSelected) {
      // Unselect all
      resourcePermissionIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all
      resourcePermissionIds.forEach(id => newSelected.add(id));
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = () => {
    onUpdatePermissions(Array.from(selectedPermissions));
  };

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Configure permissions for:</span>
          {getRoleBadge(selectedRole)}
        </div>
        <Select value={selectedRole} onValueChange={onRoleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(groupedPermissions).map(([resource, permissions]) => {
          const Icon = resourceIcons[resource as keyof typeof resourceIcons] || Package;
          const allSelected = permissions.every(p => selectedPermissions.has(p.id));
          const someSelected = permissions.some(p => selectedPermissions.has(p.id));

          return (
            <Card key={resource}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{resource}</span>
                  </div>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => handleResourceToggle(resource)}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {permission.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {permission.description}
                        </span>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedPermissions.has(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => setSelectedPermissions(new Set(currentRolePermissions))}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Save Permissions'}
        </Button>
      </div>
    </div>
  );
}