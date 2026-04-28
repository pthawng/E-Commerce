import React from "react";
import { Typography, Button, Space } from "antd";
import { BugOutlined, ReloadOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  title = "Intelligence Synchronizing Error",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-gray-100 bg-gray-50/30 backdrop-blur-sm min-h-[200px] animate-in fade-in duration-700">
      <div className="w-12 h-12 bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm">
        <BugOutlined className="text-gray-300 text-lg" />
      </div>

      <Space direction="vertical" align="center" size={0} className="mb-8">
        <Title level={5} className="font-serif italic !mb-1 text-gray-800">
          {title}
        </Title>
        <Text className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
          Vault connection interrupted or internal mismatch
        </Text>
      </Space>

      {error && (
        <div className="max-w-md mb-8 p-4 bg-red-50/30 border border-red-100/50">
          <code className="text-[10px] text-red-400 font-mono break-all block">
            {error.message}
          </code>
        </div>
      )}

      <Button
        onClick={resetErrorBoundary}
        icon={<ReloadOutlined className="text-[10px]" />}
        className="h-9 px-6 bg-black text-white border-none uppercase tracking-widest text-[9px] font-bold hover:!bg-gray-800 transition-all shadow-lg shadow-black/5"
      >
        Attempt Recovery
      </Button>

      <div className="mt-6">
        <Text className="text-[9px] italic text-gray-300 font-serif">
          Ray Paradis Internal Security Protocol 4.2.0
        </Text>
      </div>
    </div>
  );
};
