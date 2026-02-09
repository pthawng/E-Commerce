import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/entities/user';
import { usePermission } from '@/entities/user/hooks';

interface ProtectedRouteProps {
    permission?: string;
    children?: React.ReactNode;
}

export const ProtectedRoute = ({ permission, children }: ProtectedRouteProps) => {
    const { isAuthenticated } = useAuthStore();
    const { can } = usePermission();
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect to login, but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (permission && !can(permission)) {
        // User is logged in but doesn't have the specific permission
        return <Navigate to="/403" replace />; // You should create a 403 page
    }

    return children ? <>{children}</> : <Outlet />;
};
