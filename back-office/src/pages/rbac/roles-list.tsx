import { RoleTable } from '@/features/rbac';
import { PageContainer } from '@/app/layout/PageContainer';
import { LayoutStack } from '@/shared/ui';

export const RolesList: React.FC = () => {

    return (
        <PageContainer>
            <LayoutStack>
                <RoleTable />
            </LayoutStack>
        </PageContainer>
    );
};

export default RolesList;
