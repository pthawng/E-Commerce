import React from "react";
import { Typography, Result } from "antd";

const { Title } = Typography;

export const LogisticsPage: React.FC = () => {
  return (
    <div className="pb-8">
      <Title level={1} className="font-light text-5xl">
        Logistics & Vault
      </Title>
      <Result
        status="info"
        title="Logistics Module"
        subTitle="Hệ thống vận tải và kho bạc đang được khích hoạt."
      />
    </div>
  );
};
