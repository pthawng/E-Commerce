import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/store';
import { useGetPermissions } from '@/features/auth/api/permissions';
import { Spin, Result } from 'antd';

import type { PropsWithChildren } from 'react';

interface ProtectedRouteProps extends PropsWithChildren {
    requiredPermission?: string;
}

export function ProtectedRoute({ requiredPermission, children }: ProtectedRouteProps) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const permissions = useAuthStore((state) => state.permissions);
    const location = useLocation();

    // Auto-fetch permissions if authenticated
    const { isLoading } = useGetPermissions();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (isLoading && permissions.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (requiredPermission && !permissions.includes(requiredPermission)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Result
                    status="403"
                    title="403"
                    subTitle={`Sorry, you are not authorized to access this page. Required: ${requiredPermission}`}
                />
            </div>
        );
    }

    return children ? <>{children}</> : <Outlet />;
}
