import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/features/layout";
import DashboardPage from "./app/dashboard/page";
import ProductsPage from "./app/product/page";
import CategoriesPage from "./app/category/page";
import RbacPage from "./app/rbac/page";
import UsersPage from "./app/user/page";
import LoginPage from "./app/auth/login";
import { ProtectedRoute } from "@/features/auth";
import { ErrorBoundary } from "@/shared/ui";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="category" element={<CategoriesPage />} />
          <Route path="rbac" element={<RbacPage />} />
          {/* Thêm các routes khác ở đây */}
          {/* <Route path="orders" element={<OrdersPage />} /> */}
          {/* <Route path="customers" element={<CustomersPage />} /> */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
