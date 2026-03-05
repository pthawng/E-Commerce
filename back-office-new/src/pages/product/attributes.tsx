import { AttributeTable } from '@/features/attribute';
import { Breadcrumb, Typography, Card, Space } from 'antd';
import { TagsOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export const AttributesPage = () => (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Breadcrumb items={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: <><TagsOutlined /> <span>Product Catalog</span></> },
                { title: 'Attributes' },
            ]} />
            <div>
                <Title level={2} style={{ margin: 0 }}>Attributes</Title>
                <Text type="secondary">Define product attributes (color, size, material) and their possible values.</Text>
            </div>
            <Card bordered={false} style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
                <AttributeTable />
            </Card>
        </Space>
    </div>
);
