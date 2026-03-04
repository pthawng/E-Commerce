import React from 'react';
import { Typography } from 'antd';
import { PermissionForm } from '@/features/rbac';

const { Title, Text } = Typography;

export const PermissionCreatePage: React.FC = () => (
    <div style={{ padding: '0 24px 24px 24px', maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0, color: '#0B2545' }}>Create Permission</Title>
            <Text type="secondary">Define a new permission with a unique action slug.</Text>
        </div>
        <PermissionForm />
    </div>
);

export default PermissionCreatePage;
