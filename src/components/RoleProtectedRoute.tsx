import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'employee')[];
  redirectTo?: string;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/unauthorized' 
}: RoleProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated but no profile yet, show loading (should be brief)
  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user doesn't have the required role, redirect
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Otherwise, render the protected content
  return <>{children}</>;
}
