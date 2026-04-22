import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '@/app/layout/AppShell';
import { LoginPage } from '@/pages/auth/login';
import { ProtectedRoute } from '@/features/auth/auth-guard';
import { UserPage } from '@/pages/user';
import { DashboardPage } from '@/pages/dashboard';
import { RolesList, RoleCreatePage, RoleEditPage, PermissionsList, PermissionCreatePage, PermissionEditPage } from '@/pages/rbac';
import { ProductsPage, ProductCreatePage, ProductEditPage, CategoriesPage, AttributesPage } from '@/pages/product';
import { OrdersPage } from '@/pages/order';
import { TransactionsPage } from '@/pages/sales';
import { InventoryPage } from '@/pages/inventory';
import { ProfilePage } from '@/pages/profile';
import { SettingsPage } from '@/pages/settings';

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
                        <OrdersPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'transactions',
                element: (
                    <ProtectedRoute permission="auth.payment.read">
                        <TransactionsPage />
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
                        <RolesList />
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
                        <PermissionsList />
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
            // ── Product Catalog ────────────────────────────────────────────────
            {
                path: 'products',
                element: (
                    <ProtectedRoute permission="product.item.read">
                        <ProductsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'products/create',
                element: (
                    <ProtectedRoute permission="product.item.create">
                        <ProductCreatePage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'products/:id/edit',
                element: (
                    <ProtectedRoute permission="product.item.update">
                        <ProductEditPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'categories',
                element: (
                    <ProtectedRoute permission="product.category.read">
                        <CategoriesPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'attributes',
                element: (
                    <ProtectedRoute permission="product.attribute.read">
                        <AttributesPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'inventory',
                element: (
                    <ProtectedRoute permission="inventory.read">
                        <InventoryPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',
                element: <ProfilePage />,
            },
            {
                path: 'settings',
                element: <SettingsPage />,
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
