import React from 'react';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { RoleTable } from '@/features/rbac';

const { Title, Text } = Typography;

export const RolesListPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '0 24px 24px 24px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#0B2545' }}>Roles & Permissions</Title>
                    <Text type="secondary">Manage system roles and access control.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/roles/create')}
                >
                    Create Role
                </Button>
            </div>

            <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
                <RoleTable />
            </div>
        </div>
    );
};

export default RolesListPage;
