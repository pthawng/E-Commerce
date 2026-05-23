import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Dropdown,
  List,
  Typography,
  Space,
  Empty,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNotificationStore } from "@/shared/lib/notificationStore";
import { useAuthStore } from "@/features/auth/model/authStore";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    init,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      init(user.id);
    }
  }, [user?.id, init]);

  const getIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircleOutlined className="text-green-500" />;
      case "WARNING":
        return <WarningOutlined className="text-amber-500" />;
      case "ERROR":
        return <CloseCircleOutlined className="text-red-500" />;
      case "ACTION_REQUIRED":
        return <ThunderboltOutlined className="text-purple-500" />;
      default:
        return <InfoCircleOutlined className="text-blue-500" />;
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markAsRead(n.id);

    // Handle deep linking from metadata
    if (n.metadata?.path) {
      navigate(n.metadata.path);
      setOpen(false);
    }
  };

  const notificationContent = (
    <div className="w-[380px] bg-white shadow-2xl border border-gray-100 overflow-hidden luxury-dropdown">
      <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50 bg-gray-50/50">
        <Title level={5} className="!mb-0 font-serif italic text-lg">
          Nerve Center
        </Title>
        <Space>
          {unreadCount > 0 && (
            <Button
              type="text"
              size="small"
              className="text-[10px] font-bold tracking-widest uppercase hover:text-black"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </Space>
      </div>

      <div className="max-h-[450px] overflow-auto">
        {notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center opacity-40">
            <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <Text className="text-[10px] uppercase tracking-widest mt-4">
              System is silent
            </Text>
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(n) => (
              <List.Item
                className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none relative group ${!n.isRead ? "bg-blue-50/20" : ""}`}
                onClick={() => handleNotificationClick(n)}
              >
                {!n.isRead && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-black rounded-full" />
                )}
                <List.Item.Meta
                  avatar={<div className="mt-1">{getIcon(n.type)}</div>}
                  title={
                    <div className="flex items-center justify-between">
                      <Text
                        className={`text-[11px] font-bold tracking-tight uppercase ${!n.isRead ? "text-black" : "text-gray-400"}`}
                      >
                        {n.title}
                      </Text>
                      <Text className="text-[9px] text-gray-300 font-medium">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </Text>
                    </div>
                  }
                  description={
                    <div className="flex flex-col gap-2 mt-1">
                      <Text className="text-[12px] text-gray-500 leading-relaxed">
                        {n.content}
                      </Text>
                      {n.metadata?.actionLabel && (
                        <Button
                          type="link"
                          size="small"
                          className="p-0 h-auto text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all w-fit"
                        >
                          {n.metadata.actionLabel}{" "}
                          <RightOutlined className="text-[8px]" />
                        </Button>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <div className="p-3 border-t border-gray-50 bg-gray-50/30 flex justify-center">
        <Button
          type="text"
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black"
        >
          View System Logs
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationContent}
      trigger={["click"]}
      placement="bottomRight"
      onOpenChange={setOpen}
      open={open}
    >
      <Badge
        count={unreadCount}
        offset={[-4, 6]}
        size="small"
        className="flex items-center"
        status={unreadCount > 0 ? "processing" : "default"}
      >
        <Button
          type="text"
          icon={<BellOutlined className="text-2xl transition-colors" />}
          className="flex items-center justify-center p-0 h-auto w-10"
        />
      </Badge>
    </Dropdown>
  );
};
