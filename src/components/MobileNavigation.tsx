import { 
  Package, 
  BarChart3, 
  Users, 
  Settings, 
  QrCode, 
  ShoppingCart, 
  TrendingUp, 
  FileText,
  CircleUserRound,
  Shield,
  Calendar,
  MapPin,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ElementType;
  allowedRoles?: ('admin' | 'employee')[];
}

const navigationItems: NavigationItem[] = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { 
    title: "Main Inventory", 
    url: "/inventory", 
    icon: Package
  },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Event Inventory", url: "/event-inventory", icon: MapPin },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Barcodes", url: "/barcodes", icon: QrCode },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const { profile, isAdmin } = useAuth();

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => {
    // If no roles specified, everyone can access
    if (!item.allowedRoles) return true;
    
    // Check if user's role is in the allowed roles
    return item.allowedRoles.includes(profile?.role || 'employee');
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Navigation Panel */}
      <div className="fixed right-0 top-0 h-full w-80 max-w-[90vw] bg-card border-l shadow-lg animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/44068426-b2cb-498d-b6d1-64702f3a3f2f.png" 
                alt="Warehouse Worship Logo" 
                className="h-6 w-auto object-contain"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Navigation
              </h3>
              
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
                        : "hover:bg-muted/50 text-foreground"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  {item.allowedRoles?.includes('admin') && (
                    <Shield className="h-3.5 w-3.5 text-primary opacity-70 flex-shrink-0" />
                  )}
                </NavLink>
              ))}
              
              {isAdmin && (
                <>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3">
                    Admin Tools
                  </h3>
                  
                  <NavLink
                    to="/user-management"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                        isActive 
                          ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
                          : "hover:bg-muted/50 text-foreground"
                      }`
                    }
                  >
                    <CircleUserRound className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">User Management</span>
                  </NavLink>
                  
                  <NavLink
                    to="/role-management"
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                        isActive 
                          ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
                          : "hover:bg-muted/50 text-foreground"
                      }`
                    }
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">Role Management</span>
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {/* User Info Footer */}
          <div className="p-4 border-t bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                {profile?.first_name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : "User"
                  }
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {profile?.role === 'admin' ? 'Administrator' : 'Employee'}
                  </p>
                  {profile?.role === 'admin' && (
                    <Badge className="bg-primary text-xs px-1.5 py-0">Admin</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}