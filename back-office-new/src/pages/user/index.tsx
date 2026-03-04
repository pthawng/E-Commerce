import { UserTable } from '@/features/user-table/ui/UserTable';
import { Breadcrumb, Typography, Card, Space } from 'antd';
import { UserOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const UserPage = () => {
    return (
        <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Breadcrumb
                    items={[
                        {
                            title: <Link to="/dashboard"><HomeOutlined /></Link>,
                        },
                        {
                            title: (
                                <>
                                    <UserOutlined />
                                    <span>Identity & Access</span>
                                </>
                            ),
                        },
                        {
                            title: 'Users',
                        },
                    ]}
                />

                <div>
                    <Title level={2} style={{ margin: 0 }}>User Management</Title>
                    <Text type="secondary">
                        Manage administrators, managers, and staff members across the back-office.
                    </Text>
                </div>

                <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
                    <UserTable />
                </Card>
            </Space>
        </div>
    );
};
