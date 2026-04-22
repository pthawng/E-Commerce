import React from 'react';
import { RoleForm } from '@/features/rbac';
import { PageContainer } from '@/app/layout/PageContainer';

export const RoleEditPage: React.FC = () => {
    return (
        <PageContainer>
            <RoleForm />
        </PageContainer>
    );
};

export default RoleEditPage;
