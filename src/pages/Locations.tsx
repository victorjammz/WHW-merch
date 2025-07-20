import { useState, useEffect } from "react";
import { Plus, Search, Building2, Edit, Trash2, MapPin, Phone, User, Mail, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  manager_name: string | null;
  manager_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LocationFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  manager_name: string;
  manager_email: string;
  status: "active" | "inactive";
}

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    code: "",
    address: "",
    phone: "",
    manager_name: "",
    manager_email: "",
    status: "active"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: "Error fetching locations",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLocations(data || []);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      manager_name: "",
      manager_email: "",
      status: "active"
    });
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Missing required fields",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('locations')
      .insert([{
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        manager_name: formData.manager_name.trim() || null,
        manager_email: formData.manager_email.trim() || null,
        status: formData.status
      }]);

    if (error) {
      toast({
        title: "Error creating location",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Location created",
      description: "New location has been added successfully",
    });

    setIsAddDialogOpen(false);
    resetForm();
    fetchLocations();
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code,
      address: location.address || "",
      phone: location.phone || "",
      manager_name: location.manager_name || "",
      manager_email: location.manager_email || "",
      status: location.status as "active" | "inactive"
    });
  };

  const handleUpdate = async () => {
    if (!editingLocation || !formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Missing required fields",
        description: "Name and code are required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('locations')
      .update({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        manager_name: formData.manager_name.trim() || null,
        manager_email: formData.manager_email.trim() || null,
        status: formData.status
      })
      .eq('id', editingLocation.id);

    if (error) {
      toast({
        title: "Error updating location",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Location updated",
      description: "Location has been updated successfully",
    });

    setEditingLocation(null);
    resetForm();
    fetchLocations();
  };

  const handleDelete = async () => {
    if (!deletingLocation) return;

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', deletingLocation.id);

    if (error) {
      toast({
        title: "Error deleting location",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Location deleted",
      description: "Location has been deleted successfully",
    });

    setDeletingLocation(null);
    fetchLocations();
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (location.manager_name && location.manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Manage your business locations and sites
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Main Warehouse"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Location Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="MW001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Business St, City, State, ZIP"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manager_name">Manager Name</Label>
                  <Input
                    id="manager_name"
                    value={formData.manager_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager_email">Manager Email</Label>
                  <Input
                    id="manager_email"
                    type="email"
                    value={formData.manager_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager_email: e.target.value }))}
                    placeholder="john@company.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>
                Add Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">
              All sites
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {locations.filter(l => l.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Locations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {locations.filter(l => l.status === 'inactive').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Managers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {locations.filter(l => l.manager_name).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Have assigned managers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>
            Manage your business locations and sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No locations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{location.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {location.address ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {location.address.substring(0, 30)}
                            {location.address.length > 30 ? '...' : ''}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No address</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {location.manager_name ? (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {location.manager_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No manager</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {location.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {location.phone}
                            </div>
                          )}
                          {location.manager_email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {location.manager_email}
                            </div>
                          )}
                          {!location.phone && !location.manager_email && (
                            <span className="text-muted-foreground text-sm">No contact</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                          {location.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(location)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingLocation(location)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Location</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{location.name}"? This action cannot be undone and will also delete all inventory allocated to this location.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Location Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Location Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Main Warehouse"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_code">Location Code *</Label>
                <Input
                  id="edit_code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="MW001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">Address</Label>
              <Textarea
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Business St, City, State, ZIP"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_manager_name">Manager Name</Label>
                <Input
                  id="edit_manager_name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_manager_email">Manager Email</Label>
                <Input
                  id="edit_manager_email"
                  type="email"
                  value={formData.manager_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_email: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingLocation(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Locations;