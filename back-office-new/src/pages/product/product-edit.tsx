import { ProductForm } from '@/features/product';
import { Breadcrumb, Typography, Card, Space } from 'antd';
import { ShoppingOutlined, HomeOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';

const { Title, Text } = Typography;

export const ProductEditPage = () => {
    const { id } = useParams<{ id: string }>();
    return (
        <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Breadcrumb items={[
                    { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                    { title: <><ShoppingOutlined /> <Link to="/products">Products</Link></> },
                    { title: 'Edit' },
                ]} />
                <div>
                    <Title level={2} style={{ margin: 0 }}>Edit Product</Title>
                    <Text type="secondary">Update product details. Changes to slug may affect SEO.</Text>
                </div>
                <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
                    <ProductForm productId={id} />
                </Card>
            </Space>
        </div>
    );
};
