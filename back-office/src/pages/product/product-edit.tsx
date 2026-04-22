import { ProductForm } from '@/features/product';
import { ShoppingOutlined, HomeOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import { PageContainer } from '@/app/layout/PageContainer';

export const ProductEditPage = () => {
    const { id } = useParams<{ id: string }>();
    return (
        <PageContainer
            breadcrumbItems={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: <><ShoppingOutlined /> <Link to="/products">Products</Link></> },
                { title: 'Edit' },
            ]}
        >
            <ProductForm productId={id} />
        </PageContainer>
    );
};
