import { Input, Avatar, Badge, Dropdown, Space } from "antd";
import type { MenuProps } from "antd";
import { BellOutlined, MenuOutlined, SearchOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useLogout, useAuthStore } from "@/features/auth";

interface HeaderBarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function HeaderBar({ onToggleSidebar, sidebarOpen }: HeaderBarProps) {
  const navigate = useNavigate();
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div className="px-2 py-1">
          <div className="text-sm font-bold font-heading text-[#1F2937]">{user?.fullName || user?.email}</div>
          <div className="text-xs text-slate-500">{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-20 glass-gold h-16 flex items-center shadow-sm">
      <div className="flex items-center gap-4 px-6 lg:px-8 w-full">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-10 w-10 rounded-full bg-white border border-[#D4AF37]/30 flex items-center justify-center text-[#1F2937] hover:bg-[#FAF8F5] hover:text-[#6D28D9] transition-all shadow-sm"
          aria-label={sidebarOpen ? "Đóng sidebar" : "Mở sidebar"}
        >
          <MenuOutlined />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="font-heading font-bold text-[#6D28D9] text-base">Back Office</span>
          <span className="text-[#D4AF37]">/</span>
          <span className="text-slate-600 font-medium">Dashboard</span>
        </div>

        <div className="flex-1" />

        <div className="w-72 hidden md:block group">
          <Input
            prefix={<SearchOutlined className="text-[#D4AF37] group-hover:text-[#6D28D9] transition-colors" />}
            placeholder="Tìm kiếm..."
            className="!bg-white/80 !border-[#D4AF37]/30 focus:!border-[#6D28D9] !rounded-full !shadow-inner placeholder:text-slate-400"
            allowClear
          />
        </div>

        <Space size="large" className="ml-2">
          <Badge dot offset={[-4, 4]} color="#6D28D9">
            <div className="h-10 w-10 rounded-full bg-white border border-[#D4AF37]/30 flex items-center justify-center text-[#1F2937] cursor-pointer hover:bg-[#FAF8F5] hover:text-[#6D28D9] transition-all shadow-sm">
              <BellOutlined className="text-lg" />
            </div>
          </Badge>

          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar
              size={40}
              className="cursor-pointer border-2 border-[#D4AF37] shadow-md transition-transform hover:scale-105"
              style={{ backgroundColor: '#FAF8F5', color: '#6D28D9', marginLeft: 8 }}
            >
              <span className="font-heading font-bold">{getInitials()}</span>
            </Avatar>
          </Dropdown>
        </Space>
      </div>
    </header>
  );
}

