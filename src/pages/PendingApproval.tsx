import { Clock, UserCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const PendingApproval = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Account Pending
          </h1>
          <p className="text-muted-foreground mt-2">
            Your account is awaiting administrator approval
          </p>
        </div>

        <Card className="shadow-elegant border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <UserCheck className="h-5 w-5" />
              Approval Required
            </CardTitle>
            <CardDescription>
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {profile?.email}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Status:</strong> <span className="capitalize text-orange-600">{profile?.status}</span>
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                An administrator will review your account shortly. You'll receive access once approved.
              </p>
            </div>

            <Button
              onClick={signOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;