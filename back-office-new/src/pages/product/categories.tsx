import { CategoryTree } from '@/features/category';
import { Breadcrumb, Typography, Card, Space } from 'antd';
import { FolderOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const CategoriesPage = () => (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Breadcrumb items={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: <><FolderOutlined /> <span>Product Catalog</span></> },
                { title: 'Categories' },
            ]} />
            <div>
                <Title level={2} style={{ margin: 0 }}>Categories</Title>
                <Text type="secondary">Manage the hierarchical category tree for your product catalog.</Text>
            </div>
            <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
                <CategoryTree />
            </Card>
        </Space>
    </div>
);
