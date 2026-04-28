import React from "react";
import { Row, Col, Typography } from "antd";
import { StrategicKPIs } from "@/widgets/dashboard/ui/StrategicKPIs";
import { AtelierPulse } from "@/widgets/dashboard/ui/AtelierPulse";
import { FinancialIntegrity } from "@/widgets/dashboard/ui/FinancialIntegrity";

import { useTranslation } from "react-i18next";
import { usePageHeader } from "@/shared/lib/PageHeaderContext";

import { WidgetErrorBoundary } from "@/shared/ui/ErrorBoundary/WidgetErrorBoundary";

const { Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();

  usePageHeader({
    title: t("dashboard.hero_title"),
    subtitle: t("dashboard.hero_subtitle"),
  });

  return (
    <div className="space-y-12 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <WidgetErrorBoundary fallbackTitle={t("common.error_boundary_title")}>
        <StrategicKPIs />
      </WidgetErrorBoundary>

      <Row gutter={[48, 48]}>
        <Col xs={24} lg={16}>
          <WidgetErrorBoundary fallbackTitle={t("common.error_boundary_title")}>
            <AtelierPulse />
          </WidgetErrorBoundary>
        </Col>
        <Col xs={24} lg={8}>
          <WidgetErrorBoundary fallbackTitle={t("common.error_boundary_title")}>
            <FinancialIntegrity />
          </WidgetErrorBoundary>
        </Col>
      </Row>

      {/* Support Information */}
      <div className="border-t border-gray-100 dark:border-gray-900 pt-16 grid grid-cols-2 gap-24">
        <div className="space-y-4">
          <h3 className="text-lg font-serif italic text-gray-400">
            {t("dashboard.archival_intelligence")}
          </h3>
          <Text className="text-xs font-light text-gray-400 leading-relaxed block">
            {t("dashboard.ai_prediction")}
            <br />
            {t("dashboard.recommendation")}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
