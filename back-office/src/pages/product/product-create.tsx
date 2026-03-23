import { ProductForm } from '@/features/product';
import { Breadcrumb, Typography, Card, Space } from 'antd';
import { ShoppingOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const ProductCreatePage = () => (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Breadcrumb items={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: <><ShoppingOutlined /> <Link to="/products">Products</Link></> },
                { title: 'Create' },
            ]} />
            <div>
                <Title level={2} style={{ margin: 0 }}>Create Product</Title>
                <Text type="secondary">Add a new product to your catalog. You can add variants after creation.</Text>
            </div>
            <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
                <ProductForm />
            </Card>
        </Space>
    </div>
);
