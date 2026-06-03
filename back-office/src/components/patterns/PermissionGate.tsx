import * as React from "react";

type PermissionGateProps = {
  permission: string;
  grantedPermissions?: readonly string[];
  hasPermission?: (permission: string) => boolean;
  mode?: "hide" | "disable";
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGate({
  permission,
  grantedPermissions,
  hasPermission,
  mode = "hide",
  fallback = null,
  children,
}: PermissionGateProps) {
  const allowed = hasPermission
    ? hasPermission(permission)
    : grantedPermissions
      ? grantedPermissions.includes(permission)
      : false;

  if (allowed) return <>{children}</>;
  if (mode === "disable" && React.isValidElement<{ disabled?: boolean }>(children)) {
    return React.cloneElement(children, { disabled: true });
  }

  return <>{fallback}</>;
}
