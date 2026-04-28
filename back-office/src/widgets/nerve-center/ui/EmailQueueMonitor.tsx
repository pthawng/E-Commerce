import React, { memo } from "react";
import { Typography } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export const EmailQueueMonitor: React.FC = memo(() => {
  const { t } = useTranslation();

  return (
    <div className="py-20 text-center border border-dashed border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-white/5">
      <MailOutlined className="text-4xl text-gray-200 dark:text-gray-800 mb-4" />
      <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
        {t("nerve_center.email.coming_soon")}
      </div>
    </div>
  );
});
