import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout";
import DashboardPage from "./app/dashboard/page";
import ProductsPage from "./app/product/page";
import CategoriesPage from "./app/category/page";
import AttributesPage from "./app/attribute/page";
import RbacPage from "./app/rbac/page";
import UsersPage from "./app/user/page";
import LoginPage from "./app/auth/login";
import OrderListPage from "./app/order/page";
import OrderDetailPage from "./app/order/[id]/page";
import PaymentListPage from "./app/payment/page";
import { ProtectedRoute } from "@/components/layouts/protected-route";
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
          <Route path="users" element={
            <ProtectedRoute requiredPermission="auth.user.read">
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="products" element={
            <ProtectedRoute requiredPermission="product.item.read">
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="category" element={
            <ProtectedRoute requiredPermission="product.category.read">
              <CategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="categories" element={
            <ProtectedRoute requiredPermission="product.category.read">
              <CategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="attributes" element={
            <ProtectedRoute requiredPermission="product.attribute.read">
              <AttributesPage />
            </ProtectedRoute>
          } />
          <Route path="rbac" element={
            <ProtectedRoute requiredPermission="auth.role.read">
              <RbacPage />
            </ProtectedRoute>
          } />

          {/* Order Management Routes */}
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />

          {/* Payment Management Route */}
          <Route path="payments" element={<PaymentListPage />} />

          {/* Thêm các routes khác ở đây */}
          {/* <Route path="customers" element={<CustomersPage />} /> */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
