import { AttributeTable } from '@/features/attribute';
import { TagsOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/app/layout/PageContainer';

export const AttributesPage = () => (
    <PageContainer
        breadcrumbItems={[
            { title: <Link to="/dashboard"><HomeOutlined /></Link> },
            { title: <><TagsOutlined /> <span>Product Catalog</span></> },
            { title: 'Attributes' },
        ]}
    >
        <AttributeTable />
    </PageContainer>
);
