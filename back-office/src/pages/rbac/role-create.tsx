import React from 'react';
import { RoleForm } from '@/features/rbac';
import { PageContainer } from '@/app/layout/PageContainer';

export const RoleCreatePage: React.FC = () => {
    return (
        <PageContainer>
            <RoleForm />
        </PageContainer>
    );
};

export default RoleCreatePage;
