import React from 'react';
import { Typography } from 'antd';
import { PermissionForm } from '@/features/rbac';

const { Title, Text } = Typography;

export const PermissionEditPage: React.FC = () => (
    <div style={{ padding: '0 24px 24px 24px', maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0, color: '#0B2545' }}>Edit Permission</Title>
            <Text type="secondary">Update the display name, module or description. The action slug cannot be changed.</Text>
        </div>
        <PermissionForm />
    </div>
);

export default PermissionEditPage;
