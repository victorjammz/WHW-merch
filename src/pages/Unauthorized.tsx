import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        
        <h1 className="mt-6 text-3xl font-bold">Access Denied</h1>
        
        <p className="mt-4 text-muted-foreground">
          {profile?.role === 'employee' 
            ? "You don't have sufficient permissions to access this area. This section requires admin privileges."
            : "You don't have permission to access this resource."}
        </p>
        
        <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
          <Button 
            className="flex items-center justify-center space-x-2" 
            onClick={() => navigate(-1)}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
          
          <Button 
            className="flex items-center justify-center space-x-2" 
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}