import { UserTable } from '@/features/user-table/ui/UserTable';
import { UserOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

import { PageContainer } from '@/app/layout/PageContainer';

export const UserPage = () => {
    return (
        <PageContainer
            breadcrumbItems={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: <><UserOutlined /> <span>Identity & Access</span></> },
                { title: 'Users' },
            ]}
        >
            <UserTable />
        </PageContainer>
    );
};
