import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '@/app/layout/AppShell';
import { LoginPage } from '@/pages/auth/login';
import { ProtectedRoute } from '@/features/auth/auth-guard';
import { UserPage } from '@/pages/user';
import { DashboardPage } from '@/pages/dashboard';
import { RolesListPage, RoleCreatePage, RoleEditPage, PermissionsListPage, PermissionCreatePage, PermissionEditPage } from '@/pages/rbac';

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AppShell />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: <DashboardPage />,
            },
            {
                path: 'orders',
                element: (
                    <ProtectedRoute permission="order.read">
                        <div>Orders Content</div>
                    </ProtectedRoute>
                ),
            },
            {
                path: 'users',
                element: (
                    <ProtectedRoute permission="auth.user.read">
                        <UserPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'roles',
                element: (
                    <ProtectedRoute permission="auth.role.read">
                        <RolesListPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'roles/create',
                element: (
                    <ProtectedRoute permission="auth.role.create">
                        <RoleCreatePage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'roles/:id',
                element: (
                    <ProtectedRoute permission="auth.role.update">
                        <RoleEditPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'permissions',
                element: (
                    <ProtectedRoute permission="auth.role.read">
                        <PermissionsListPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'permissions/create',
                element: (
                    <ProtectedRoute permission="auth.role.create">
                        <PermissionCreatePage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'permissions/:slug',
                element: (
                    <ProtectedRoute permission="auth.role.update">
                        <PermissionEditPage />
                    </ProtectedRoute>
                ),
            },
        ],
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
    // Optional: 403 Page
    {
        path: '/403',
        element: <div>403 - Unauthorized</div>,
    }
]);
