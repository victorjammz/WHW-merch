import { Package, BarChart3, Users, Settings, QrCode, ShieldAlert, ShoppingCart, TrendingUp, FileText, CircleUserRound, Shield, Calendar, MapPin } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Define navigation items with role restrictions
interface NavigationItem {
  title: string;
  url: string;
  icon: React.ElementType;
  allowedRoles?: ('admin' | 'employee')[];
}
const navigationItems: NavigationItem[] = [{
  title: "Dashboard",
  url: "/",
  icon: BarChart3
}, {
  title: "Inventory",
  url: "/inventory",
  icon: Package
}, {
  title: "Events",
  url: "/events",
  icon: Calendar
}, {
  title: "Event Inventory",
  url: "/event-inventory",
  icon: MapPin
}, {
  title: "Orders",
  url: "/orders",
  icon: ShoppingCart
}, {
  title: "Customers",
  url: "/customers",
  icon: Users
}, {
  title: "Analytics",
  url: "/analytics",
  icon: TrendingUp
}, {
  title: "Barcodes",
  url: "/barcodes",
  icon: QrCode
}, {
  title: "Reports",
  url: "/reports",
  icon: FileText
}, {
  title: "Settings",
  url: "/settings",
  icon: Settings
}];
export function CRMSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const {
    profile,
    isAdmin
  } = useAuth();
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => {
    // If no roles specified, everyone can access
    if (!item.allowedRoles) return true;

    // Check if user's role is in the allowed roles
    return item.allowedRoles.includes(profile?.role || 'employee');
  });
  return <Sidebar className={`${collapsed ? "w-16" : "w-64"} hidden md:block`} collapsible="icon">
      <SidebarContent className="bg-card border-r mx-0 px-0 my-0 py-0">
        <div className="p-4 md:p-6 border-b">
          <div className="flex items-center gap-3 mx-[52px] px-0 py-0 my-0">
            <img src="/lovable-uploads/44068426-b2cb-498d-b6d1-64702f3a3f2f.png" alt="Warehouse Worship Logo" className="h-6 md:h-8 w-auto object-contain" />
            {!collapsed && <div className="hidden">
                {/* Logo already contains the text, so we hide the duplicate text */}
              </div>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 md:px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map(item => <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="mx-2 md:mx-3 rounded-lg min-h-[44px]">
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="ml-3 text-sm md:text-base">{item.title}</span>}
                          {!collapsed && item.allowedRoles?.includes('admin') && <ShieldAlert className="ml-auto h-3.5 w-3.5 text-primary opacity-70 flex-shrink-0" />}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">
                        {item.title}
                        {item.allowedRoles?.includes('admin') && " (Admin Only)"}
                      </TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && <SidebarGroup>
            <SidebarGroupLabel className="px-4 md:px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {!collapsed && "Admin Tools"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="mx-2 md:mx-3 rounded-lg min-h-[44px]">
                        <NavLink to="/user-management" className={getNavCls}>
                          <CircleUserRound className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="ml-3 text-sm md:text-base">User Management</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">
                        User Management
                      </TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="mx-2 md:mx-3 rounded-lg min-h-[44px]">
                        <NavLink to="/role-management" className={getNavCls}>
                          <Shield className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && <span className="ml-3 text-sm md:text-base">Role Management</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">
                        Role Management
                      </TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}
      </SidebarContent>
    </Sidebar>;
}