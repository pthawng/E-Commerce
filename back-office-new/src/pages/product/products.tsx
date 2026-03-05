import { ProductTable } from '@/features/product';
import { Breadcrumb, Typography, Card, Space } from 'antd';
import { ShoppingOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const ProductsPage = () => (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Breadcrumb items={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: <><ShoppingOutlined /> <span>Product Catalog</span></> },
                { title: 'Products' },
            ]} />
            <div>
                <Title level={2} style={{ margin: 0 }}>Products</Title>
                <Text type="secondary">Manage your product catalog — click any row to view details.</Text>
            </div>
            <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
                <ProductTable />
            </Card>
        </Space>
    </div>
);
