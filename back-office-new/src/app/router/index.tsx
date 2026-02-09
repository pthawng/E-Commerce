import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '@/app/layout/AppShell';
import { LoginPage } from '@/pages/auth/login';
import { ProtectedRoute } from '@/features/auth/auth-guard';

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
                element: <div>Dashboard Content</div>, // TODO: Replace with Dashboard Page
            },
            {
                path: 'orders',
                element: (
                    <ProtectedRoute permission="order.read">
                        <div>Orders Content</div>
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
