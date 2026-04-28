import React from "react";
import { useAuthStore } from "@/features/auth/model/authStore";

export const usePermission = () => {
  const { user } = useAuthStore();

  const can = (permission: string) => {
    if (!user) return false;

    // Super Admin Bypass
    const isSuperAdmin = user.roles?.some(
      (role) => role.toUpperCase() === "SUPER_ADMIN",
    );

    if (isSuperAdmin) return true;

    if (!Array.isArray(user.permissions)) return false;

    return user.permissions.includes(permission);
  };

  const hasRole = (role: string) => {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.some((r) => r.toUpperCase() === role.toUpperCase());
  };

  return { can, hasRole };
};

interface PermissionGateProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
  mode?: "hide" | "disable";
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  fallback = null,
  mode = "hide",
}) => {
  const { can } = usePermission();

  if (can(permission)) {
    return <>{children}</>;
  }

  if (mode === "disable") {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          disabled: true,
          title: "Bạn không có quyền thực hiện hành động này",
        });
      }
      return child;
    });
  }

  return <>{fallback}</>;
};
