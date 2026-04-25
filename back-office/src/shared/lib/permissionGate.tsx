import React from 'react';
import { useAuthStore } from '@/features/auth/model/authStore';

export const usePermission = () => {
    const { user } = useAuthStore();

    const can = (permission: string) => {
        if (!user) return false;
        if (!Array.isArray(user.permissions)) return false;

        return user.permissions.includes(permission);
    };

    const hasRole = (role: string) => {
        if (!user || !Array.isArray(user.roles)) return false;
        return user.roles.includes(role);
    };

    return { can, hasRole };
};

interface PermissionGateProps {
    children: React.ReactNode;
    permission: string;
    fallback?: React.ReactNode;
    mode?: 'hide' | 'disable';
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    children,
    permission,
    fallback = null,
    mode = 'hide'
}) => {
    const { can } = usePermission();

    if (can(permission)) {
        return <>{children}</>;
    }

    if (mode === 'disable') {
        return React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                    disabled: true,
                    title: 'Bạn không có quyền thực hiện hành động này'
                });
            }
            return child;
        });
    }

    return <>{fallback}</>;
};
