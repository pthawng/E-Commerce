import React from "react";
import { Button, Input, List, Typography, Space } from "antd";
import { useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  ShoppingOutlined,
  SearchOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      title: "Inventory Management",
      path: "/products",
      icon: <HomeOutlined />,
    },
    { title: "Order Fulfillment", path: "/orders", icon: <ShoppingOutlined /> },
    {
      title: "Business Analytics",
      path: "/analytics",
      icon: <SearchOutlined />,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
      {/* Subtle background 404 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <h1 className="text-[20rem] font-serif leading-none">404</h1>
      </div>

      <div className="relative z-10 max-w-lg w-full space-y-8">
        <div className="space-y-4">
          <Title level={1} className="font-serif !mb-0 text-5xl">
            Page not found
          </Title>
          <Paragraph className="text-gray-400 font-light italic text-lg">
            The resource you’re looking for doesn’t exist or may have been
            moved.
          </Paragraph>
        </div>

        <div className="bg-gray-50/50 dark:bg-white/5 p-6 border border-gray-100 dark:border-gray-800 space-y-6">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search for tools or resources..."
            className="h-12 border-none shadow-sm font-serif italic"
          />

          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              type="primary"
              icon={<DashboardOutlined />}
              className="h-11 px-6 bg-black dark:bg-[#d4af37] border-none uppercase tracking-widest text-[10px] font-bold"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
            <Button
              icon={<ShoppingOutlined />}
              className="h-11 px-6 uppercase tracking-widest text-[10px] font-bold dark:bg-transparent dark:text-white dark:border-gray-700"
              onClick={() => navigate("/orders")}
            >
              Go to Orders
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-8">
          <Text className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium">
            Quick Recoveries
          </Text>
          <List
            dataSource={quickLinks}
            renderItem={(item) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 px-4 transition-colors border-none group"
                onClick={() => navigate(item.path)}
              >
                <Space className="w-full justify-between">
                  <Space>
                    <span className="text-gray-400 group-hover:text-primary transition-colors">
                      {item.icon}
                    </span>
                    <Text className="text-xs group-hover:pl-2 transition-all">
                      {item.title}
                    </Text>
                  </Space>
                  <ArrowLeftOutlined className="text-[10px] opacity-0 group-hover:opacity-100 rotate-180 transition-all text-gray-300" />
                </Space>
              </List.Item>
            )}
            className="text-left bg-white dark:bg-transparent border border-gray-100 dark:border-gray-800"
          />
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
