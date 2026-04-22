import React from 'react';
import { PermissionForm } from '@/features/rbac';
import { PageContainer } from '@/app/layout/PageContainer';

export const PermissionEditPage: React.FC = () => (
    <PageContainer>
        <PermissionForm />
    </PageContainer>
);

export default PermissionEditPage;
