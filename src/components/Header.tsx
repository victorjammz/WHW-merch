import { useState } from "react";
import { LogOut, User, Settings, Shield, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { MobileNavigation } from "./MobileNavigation";

export function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
    navigate("/auth");
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    
    if (user?.email) {
      return user.email.split('@')[0].charAt(0).toUpperCase();
    }
    
    return "U";
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    
    if (profile?.first_name) {
      return profile.first_name;
    }
    
    return user?.email || "User";
  };

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-semibold truncate">Warehouse Worship CRM</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="hidden md:flex"
              onClick={() => navigate("/settings?tab=notifications")}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            
            {/* Mobile Navigation Button - Only visible on mobile */}
            <Button 
              variant="ghost" 
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Desktop Dropdown Menu - Hidden on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hidden md:flex">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                  {profile?.role === 'admin' && (
                    <Badge className="ml-2 bg-primary text-xs">Admin</Badge>
                  )}
                </div>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {profile?.role && (
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 mr-1" />
                    {profile.role === 'admin' ? 'Administrator' : 'Employee'}
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
    </>
  );
}