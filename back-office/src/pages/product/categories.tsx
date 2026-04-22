import { CategoryTree } from '@/features/category';
import { FolderOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/app/layout/PageContainer';

export const CategoriesPage = () => (
    <PageContainer
        breadcrumbItems={[
            { title: <Link to="/dashboard"><HomeOutlined /></Link> },
            { title: <><FolderOutlined /> <span>Product Catalog</span></> },
            { title: 'Categories' },
        ]}
    >
        <CategoryTree />
    </PageContainer>
);
