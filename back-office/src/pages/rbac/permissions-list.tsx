import { PermissionTable } from '@/features/rbac';
import { PageContainer } from '@/app/layout/PageContainer';
import { LayoutStack } from '@/shared/ui';

export const PermissionsList: React.FC = () => {

    return (
        <PageContainer>
            <LayoutStack>
                <PermissionTable />
            </LayoutStack>
        </PageContainer>
    );
};

export default PermissionsList;
