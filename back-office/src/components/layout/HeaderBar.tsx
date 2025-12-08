import { Input, Avatar, Badge, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { BellOutlined, MenuOutlined, SearchOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useLogout } from "@/services/mutations/auth.mutations";
import { useAuthStore } from "@/store/auth.store";

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
          <div className="text-sm font-medium text-slate-200">{user?.fullName || user?.email}</div>
          <div className="text-xs text-slate-400">{user?.email}</div>
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
    <header className="sticky top-0 z-20 bg-slate-900/70 backdrop-blur-xl border-b border-amber-500/20">
      <div className="flex items-center gap-3 px-4 lg:px-8 h-14">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="h-10 w-10 rounded-xl bg-slate-800/70 border border-amber-500/20 flex items-center justify-center text-amber-200"
          aria-label={sidebarOpen ? "Đóng sidebar" : "Mở sidebar"}
          title={sidebarOpen ? "Ẩn sidebar" : "Hiện sidebar"}
        >
          <MenuOutlined />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-300">
          <span className="text-amber-300">Back Office</span>
          <span className="text-slate-500">/</span>
          <span>Dashboard</span>
        </div>

        <div className="flex-1" />

        <div className="w-64 hidden md:block">
          <Input
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Tìm kiếm..."
            className="bg-slate-800/80 border-amber-500/20 text-slate-100"
            allowClear
          />
        </div>

        <Badge count={3} offset={[-2, 6]}>
          <div className="h-10 w-10 rounded-xl bg-slate-800/70 border border-amber-500/20 flex items-center justify-center text-amber-200 cursor-pointer hover:bg-slate-700/70 transition-colors">
            <BellOutlined />
          </div>
        </Badge>

        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar
            size={40}
            className="border border-amber-500/40 bg-amber-500/20 text-amber-100 cursor-pointer hover:border-amber-500/60 transition-colors"
          >
            {getInitials()}
          </Avatar>
        </Dropdown>
      </div>
    </header>
  );
}

