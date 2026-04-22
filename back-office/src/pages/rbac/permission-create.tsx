import React from 'react';
import { PermissionForm } from '@/features/rbac';
import { PageContainer } from '@/app/layout/PageContainer';

export const PermissionCreatePage: React.FC = () => (
    <PageContainer>
        <PermissionForm />
    </PageContainer>
);

export default PermissionCreatePage;
