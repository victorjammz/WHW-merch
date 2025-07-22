import { useState, useEffect } from "react";
import { Users, Search, Shield, User, Check, RefreshCw, Settings, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { formatDateWithUserSettings } from "@/utils/dateFormatting";
import PermissionsManager from "@/components/PermissionsManager";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'manager' | 'employee' | 'viewer';
  created_at: string;
  selected?: boolean;
}

export default function RoleManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'employee' | 'viewer' | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<'admin' | 'manager' | 'employee' | 'viewer'>('employee');
  
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const { settings } = useUserSettings();
  const { allPermissions, rolePermissions, updateRolePermissions, isLoading: permissionsLoading } = usePermissions();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers((data as UserProfile[]).map(user => ({
        ...user,
        selected: false
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error fetching users",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, selected: !user.selected } : user
    ));
    
    // Update selectAll status
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, selected: !user.selected } : user
    );
    
    const allSelected = updatedUsers.every(user => user.selected);
    const anySelected = updatedUsers.some(user => user.selected);
    
    setSelectAll(allSelected);
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setUsers(users.map(user => ({ ...user, selected: newSelectAll })));
  };

  const updateSelectedUsersRole = async () => {
    if (!selectedRole) {
      toast({
        title: "No role selected",
        description: "Please select a role to assign",
        variant: "destructive"
      });
      return;
    }

    const selectedUsers = users.filter(user => user.selected);
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      // Use our secure function to update roles
      for (const user of selectedUsers) {
        const { data, error } = await supabase.rpc(
          'admin_update_user_role',
          { 
            user_id: user.id,
            new_role: selectedRole
          }
        );

        if (error) throw error;
      }

      // Update local state
      setUsers(users.map(user => 
        user.selected ? { ...user, role: selectedRole, selected: false } : user
      ));
      
      setSelectAll(false);
      setSelectedRole('');
      
      toast({
        title: "Roles updated",
        description: `Successfully updated ${selectedUsers.length} user(s)`,
      });
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: "Error updating roles",
        description: "An error occurred while updating roles",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const email = user.email.toLowerCase();
    const firstName = (user.first_name || "").toLowerCase();
    const lastName = (user.last_name || "").toLowerCase();
    
    return email.includes(searchLower) || 
           firstName.includes(searchLower) || 
           lastName.includes(searchLower);
  });

  const selectedCount = users.filter(user => user.selected).length;

  const getInitials = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { icon: Shield, label: 'Administrator', className: 'bg-red-500 text-white' },
      manager: { icon: UserCog, label: 'Manager', className: 'bg-blue-500 text-white' },
      employee: { icon: User, label: 'Employee', className: 'bg-green-500 text-white' },
      viewer: { icon: User, label: 'Viewer', className: 'bg-gray-500 text-white' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleManagePermissions = (role: 'admin' | 'manager' | 'employee' | 'viewer') => {
    setSelectedRoleForPermissions(role);
    setIsPermissionsDialogOpen(true);
  };

  const handleUpdatePermissions = async (permissionIds: string[]) => {
    const result = await updateRolePermissions(selectedRoleForPermissions, permissionIds);
    
    if (result.success) {
      toast({
        title: "Permissions updated",
        description: `Successfully updated permissions for ${selectedRoleForPermissions} role`,
      });
      setIsPermissionsDialogOpen(false);
    } else {
      toast({
        title: "Error updating permissions",
        description: "An error occurred while updating permissions",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">
              Assign access levels to users in the system
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Manage Permissions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Manage Role Permissions</DialogTitle>
                <DialogDescription>
                  Configure what actions each role can perform in the system
                </DialogDescription>
              </DialogHeader>
              <PermissionsManager
                allPermissions={allPermissions}
                rolePermissions={rolePermissions}
                selectedRole={selectedRoleForPermissions}
                onRoleChange={setSelectedRoleForPermissions}
                onUpdatePermissions={handleUpdatePermissions}
                isLoading={permissionsLoading}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Access Levels
          </CardTitle>
          <CardDescription>
            Select users and assign appropriate access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              {selectedCount > 0 && (
                <>
                   <span className="text-sm text-muted-foreground">
                     {selectedCount} user(s) selected
                   </span>
                   <Select value={selectedRole} onValueChange={(value: 'admin' | 'manager' | 'employee' | 'viewer') => setSelectedRole(value)}>
                     <SelectTrigger className="w-full sm:w-[180px]">
                       <SelectValue placeholder="Select role" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="admin">Administrator</SelectItem>
                       <SelectItem value="manager">Manager</SelectItem>
                       <SelectItem value="employee">Employee</SelectItem>
                       <SelectItem value="viewer">Viewer</SelectItem>
                     </SelectContent>
                   </Select>
                   <Button 
                     onClick={updateSelectedUsersRole} 
                     disabled={isUpdating || !selectedRole}
                     className="w-full sm:w-auto"
                   >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Apply Role
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectAll} 
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all users"
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox 
                          checked={user.selected} 
                          onCheckedChange={() => toggleSelectUser(user.id)}
                          aria-label={`Select ${user.email}`}
                          disabled={user.id === currentUser?.id} // Can't change your own role
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2">You</Badge>
                          )}
                        </div>
                      </TableCell>
                       <TableCell>
                         {getRoleBadge(user.role)}
                       </TableCell>
                      <TableCell>
                        {formatDateWithUserSettings(user.created_at, settings?.date_format)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                {getRoleBadge('admin')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManagePermissions('admin')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Full access to all system features including user management</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                {getRoleBadge('manager')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManagePermissions('manager')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Manage inventory, orders, and customers. View analytics</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                {getRoleBadge('employee')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManagePermissions('employee')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Process orders and manage customers. Read-only access to inventory</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                {getRoleBadge('viewer')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManagePermissions('viewer')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Read-only access to all data. Cannot make changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}