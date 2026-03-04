import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PermissionTable } from '@/features/rbac';

const { Title, Text } = Typography;

export const PermissionsListPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '0 24px 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#0B2545' }}>Permissions</Title>
                    <Text type="secondary">Manage system-wide permissions. Each permission maps to one specific action.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/permissions/create')}
                >
                    Create Permission
                </Button>
            </div>
            <PermissionTable />
        </div>
    );
};

export default PermissionsListPage;
