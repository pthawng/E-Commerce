import React, { useState } from "react";
import {
  Layout,
  Menu,
  Button,
  Typography,
  Input,
  Dropdown,
  Avatar,
  MenuProps,
} from "antd";
import {
  DashboardOutlined,
  AuditOutlined,
  ShoppingOutlined,
  ProductOutlined,
  TeamOutlined,
  LineChartOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BugOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/shared/lib/settingsStore";
import { useAuthStore } from "@/features/auth/model/authStore";
import {
  GlobalOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { usePageHeader } from "@/shared/lib/PageHeaderContext";
import { NotificationCenter } from "@/widgets/notifications/NotificationCenter";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { t, i18n } = useTranslation();
  const { locale, setLocale } = useSettingsStore();

  const menuItems: MenuProps["items"] = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/ledger",
      icon: <AuditOutlined />,
      label: "Ledger",
    },
    {
      key: "/orders",
      icon: <ShoppingOutlined />,
      label: "Orders",
    },
    {
      key: "/products",
      icon: <ProductOutlined />,
      label: "Catalog",
    },
    {
      key: "/inventory",
      icon: <BankOutlined />,
      label: "Vault",
    },
    {
      key: "/customers",
      icon: <TeamOutlined />,
      label: "Clients",
    },
    {
      key: "/analytics",
      icon: <LineChartOutlined />,
      label: "Analytics",
    },
    {
      key: "/health",
      icon: <BugOutlined />,
      label: "Nerve Center",
    },
  ];

  const regionalItems: MenuProps["items"] = [
    {
      key: "vi",
      label: "Tiếng Việt (VND)",
      onClick: () => {
        i18n.changeLanguage("vi");
        setLocale("vi");
      },
    },
    {
      key: "en",
      label: "English (USD)",
      onClick: () => {
        i18n.changeLanguage("en");
        setLocale("en");
      },
    },
    {
      key: "zh",
      label: "中文 (CNY)",
      onClick: () => {
        i18n.changeLanguage("zh");
        setLocale("zh");
      },
    },
  ];

  const { currentHeader } = usePageHeader();
  const { clearAuth } = useAuthStore();

  const profileItems: MenuProps["items"] = [
    {
      key: "profile",
      label: t("profile.title"),
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      key: "settings",
      label: t("common.settings"),
      icon: <SettingOutlined />,
      onClick: () => navigate("/settings"),
    },
    {
      key: "logout",
      label: t("profile.sign_out", { defaultValue: "Sign Out" }),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        clearAuth();
        navigate("/login");
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={240}
        className="border-r border-gray-100 !bg-white"
      >
        <div className="h-20 flex items-center px-6 mb-8 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
              <div className="w-1 h-3 bg-white rotate-45" />
            </div>
            {!collapsed && (
              <Text className="font-serif italic tracking-[0.1em] text-lg">
                Ray Paradis
              </Text>
            )}
          </div>
        </div>

        <div className="px-3">
          {!collapsed && (
            <Text className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase px-4 block mb-4">
              {t("common.modules", { defaultValue: "Modules" })}
            </Text>
          )}
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="border-none !bg-transparent luxury-menu"
          />
        </div>

        {!collapsed && (
          <div className="absolute bottom-8 left-0 right-0 px-6">
            <div className="p-4 bg-gray-50 border border-gray-100">
              <Text className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">
                {t("common.system_status", { defaultValue: "System Status" })}
              </Text>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <Text className="text-[10px] font-bold tracking-tighter">
                  {t("common.vault_connected", {
                    defaultValue: "VAULT CONNECTED",
                  })}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout className="!bg-white dark:!bg-[#050505]">
        {/* Topbar */}
        <Header className="!bg-white border-b border-gray-200 shadow-sm h-24 px-8 flex items-center justify-between sticky top-0 z-50 overflow-hidden">
          {/* Left controls */}
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-400 hover:text-black transition-colors"
            />
          </div>

          {/* Page context */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  location.pathname + (currentHeader?.title?.toString() || "")
                }
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center max-w-full"
              >
                {/* Breadcrumbs */}
                {currentHeader?.breadcrumbs && (
                  <div className="flex items-center gap-2 mb-1.5 overflow-hidden whitespace-nowrap">
                    {currentHeader.breadcrumbs.map((b, i) => (
                      <React.Fragment key={i}>
                        <Text
                          className={`text-[9px] uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer hover:text-black ${i === currentHeader.breadcrumbs!.length - 1 ? "text-black" : "text-gray-300"}`}
                          onClick={() => b.path && navigate(b.path)}
                        >
                          {b.label}
                        </Text>
                        {i < currentHeader.breadcrumbs!.length - 1 && (
                          <RightOutlined className="text-[7px] text-gray-200" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Main Title */}
                <div className="relative group">
                  <Title
                    level={4}
                    className="!mb-0 font-serif italic tracking-tight text-xl truncate max-w-md"
                  >
                    {currentHeader?.isLoading ? (
                      <div className="w-48 h-6 bg-gray-50 flex items-center gap-2 px-2 animate-pulse rounded-sm">
                        <div className="w-2 h-2 bg-gray-200 rounded-full" />
                        <div className="flex-1 h-3 bg-gray-100 rounded-full" />
                      </div>
                    ) : (
                      currentHeader?.title || t("common.dashboard")
                    )}
                  </Title>

                  {/* Decorative line under title */}
                  <motion.div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[1px] bg-black/10 w-0 group-hover:w-full transition-all duration-500" />
                </div>

                {/* Subtitle */}
                {(currentHeader?.subtitle || currentHeader?.isLoading) && (
                  <Text className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-medium mt-1 truncate max-w-sm">
                    {currentHeader?.isLoading
                      ? "Synchronizing Vault..."
                      : currentHeader?.subtitle}
                  </Text>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-6 h-full">
            {/* Compact Search */}
            <div className="relative flex items-center group h-full">
              <SearchOutlined className="absolute left-3 text-gray-400 group-focus-within:text-black transition-colors z-10 text-sm" />
              <Input
                placeholder={t("common.search_placeholder")}
                className="h-9 w-32 focus:w-64 pl-10 pr-4 bg-gray-50/50 border-transparent rounded-none text-[11px] hover:bg-gray-50 focus:bg-white focus:border-gray-200 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center gap-6 h-full">
              <Dropdown menu={{ items: regionalItems }}>
                <Button
                  type="text"
                  className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 p-0 hover:bg-transparent"
                >
                  <GlobalOutlined className="text-gray-400 text-sm" />
                  <span className="leading-none mt-[1px]">{locale}</span>
                </Button>
              </Dropdown>

              <NotificationCenter />

              <div className="h-4 w-px bg-gray-100" />

              <Dropdown menu={{ items: profileItems }} placement="bottomRight">
                <div className="cursor-pointer group flex items-center h-full">
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    className="bg-black border border-black group-hover:opacity-80 transition-all scale-110 flex items-center justify-center"
                  />
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>

        {/* Content Area */}
        <Content className="px-12 pb-12 pt-4 overflow-auto">
          <div className="max-w-[1400px] mx-auto min-h-full">{children}</div>
        </Content>
      </Layout>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .luxury-menu.ant-menu-light .ant-menu-item-selected {
          background-color: transparent !important;
          color: black !important;
          font-weight: 700;
        }
        .luxury-menu.ant-menu-dark .ant-menu-item-selected {
          background-color: transparent !important;
          color: white !important;
          font-weight: 700;
        }
        .luxury-menu .ant-menu-item {
          font-size: 11px !important;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          height: 48px;
          margin-bottom: 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .luxury-menu .ant-menu-item:hover {
          color: black !important;
          background-color: #fcfcfc !important;
        }
        .dark .luxury-menu .ant-menu-item:hover {
          color: white !important;
          background-color: rgba(255,255,255,0.03) !important;
        }
      `,
        }}
      />
    </Layout>
  );
};

export default AppLayout;
