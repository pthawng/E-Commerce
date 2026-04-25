import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/authStore';
import { usePermission } from '@/shared/lib/permissionGate';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
    const { isAuthenticated } = useAuthStore();
    const { can } = usePermission();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login but save the current location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (permission && !can(permission)) {
        // User is authenticated but doesn't have the right permission
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};
