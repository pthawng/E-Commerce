import React from 'react';
import { Typography } from 'antd';
import { RoleForm } from '@/features/rbac';

const { Title, Text } = Typography;

export const RoleEditPage: React.FC = () => {
    return (
        <div style={{ padding: '0 24px 24px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0, color: '#0B2545' }}>Edit Role</Title>
                <Text type="secondary">Modify role details and adjust access permissions.</Text>
            </div>
            <RoleForm />
        </div>
    );
};

export default RoleEditPage;
