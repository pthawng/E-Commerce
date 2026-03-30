import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = React.useState(!user && isAuthenticated);

  useEffect(() => {
    // If we think we are authenticated but have no user data, sync with backend
    if (isAuthenticated && !user) {
      setIsChecking(true);
      fetchUser()
        .catch(() => {
          // fetchUser handles isAuthenticated = false on error
        })
        .finally(() => {
          setIsChecking(false);
        });
    }
  }, [isAuthenticated, user, fetchUser]);

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Authenticating</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the intended destination
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
