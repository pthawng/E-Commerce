import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import DashboardPage from "./app/dashboard";
import ProductsPage from "./app/product";
import CategoriesPage from "./app/category";
import RbacPage from "./app/rbac";
import LoginPage from "./app/auth/login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
