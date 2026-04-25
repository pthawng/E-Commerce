import React from 'react';
import { Row, Col, Typography, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { StrategicKPIs } from '@/widgets/dashboard/ui/StrategicKPIs';
import { AtelierPulse } from '@/widgets/dashboard/ui/AtelierPulse';
import { FinancialIntegrity } from '@/widgets/dashboard/ui/FinancialIntegrity';

import { useTranslation } from 'react-i18next';
import { usePageHeader } from '@/shared/lib/PageHeaderContext';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
    const { t } = useTranslation();

    usePageHeader({
        title: t('dashboard.hero_title'),
        subtitle: t('dashboard.hero_subtitle'),
    });

    return (
        <div className="space-y-16 py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <StrategicKPIs />

            <Row gutter={[48, 48]}>
                <Col xs={24} lg={16}>
                    <AtelierPulse />
                </Col>
                <Col xs={24} lg={8}>
                    <FinancialIntegrity />
                </Col>
            </Row>

            {/* Support Information */}
            <div className="border-t border-gray-100 dark:border-gray-900 pt-16 grid grid-cols-2 gap-24">
                <div className="space-y-4">
                    <h3 className="text-lg font-serif italic text-gray-400">{t('dashboard.archival_intelligence')}</h3>
                    <Text className="text-xs font-light text-gray-400 leading-relaxed block">
                        {t('dashboard.ai_prediction')}
                        <br />
                        {t('dashboard.recommendation')}
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
