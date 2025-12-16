import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  AppstoreOutlined,
  SketchOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  TagsOutlined,
  DeploymentUnitOutlined,
  ShoppingOutlined,
  UserOutlined,
  LineChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navGroups = [
  {
    label: "Tổng quan",
    items: [{ to: "/dashboard", label: "Dashboard", icon: <AppstoreOutlined /> }],
  },
  {
    label: "Quản lý người dùng",
    items: [
      { to: "/users", label: "Quản lý User", icon: <TeamOutlined /> },
      { to: "/rbac", label: "Roles & Permissions", icon: <SafetyCertificateOutlined /> },
    ],
  },
  {
    label: "Quản lý sản phẩm",
    items: [
      { to: "/products", label: "Sản phẩm", icon: <SketchOutlined /> },
      { to: "/categories", label: "Danh mục", icon: <TagsOutlined /> },
      { to: "/attributes", label: "Thuộc tính", icon: <DeploymentUnitOutlined /> },
    ],
  },
  {
    label: "Khác",
    items: [
      { to: "/orders", label: "Đơn hàng", icon: <ShoppingOutlined /> },
      { to: "/customers", label: "Khách hàng", icon: <UserOutlined /> },
      { to: "/reports", label: "Báo cáo", icon: <LineChartOutlined /> },
      { to: "/settings", label: "Cài đặt", icon: <SettingOutlined /> },
    ],
  },
];

export default function Sidebar({ open }: SidebarProps) {
  // Mặc định: chỉ hiển thị danh mục chính, không mở nhóm con
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 flex-col bg-white/90 backdrop-blur-3xl border-r border-[#D4AF37]/30 z-30 transform transition-transform duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.03)] ${open ? "translate-x-0" : "-translate-x-full"
        } ${open ? "flex" : "hidden lg:flex"}`}
    >
      <div className="px-6 py-6 border-b border-[#D4AF37]/20 relative overflow-hidden">
        {/* Decorative Gold Shimmer Top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="h-12 w-12 rounded-full bg-linear-to-br from-[#6D28D9] to-[#4C1D95] p-px shadow-lg shadow-violet-200">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[#6D28D9] font-serif font-bold text-xl border border-white/50">
              R
            </div>
          </div>
          <div>
            <div className="text-xl font-heading font-bold text-[#1F2937] tracking-tight">
              Ray Paradis
            </div>
            <div className="text-xs text-[#D4AF37] font-medium tracking-widest uppercase">Luxury Jewelry</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              className="flex w-full items-center justify-between px-3 py-2 rounded-md bg-transparent hover:bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-widest transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span>{group.label}</span>
              </span>
              <span
                className={`transform transition-transform text-[10px] ${
                  openGroups.includes(group.label) ? "rotate-90" : ""
                }`}
              >
                ▸
              </span>
            </button>
            {openGroups.includes(group.label) &&
              group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? "bg-[#6D28D9]/5 text-[#6D28D9]"
                        : "text-slate-500 hover:text-[#6D28D9] hover:bg-slate-50"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`text-xl transition-transform duration-300 ${
                          isActive ? "scale-110" : "group-hover:scale-110"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "font-semibold" : ""
                        }`}
                      >
                        {item.label}
                      </span>

                      {/* Active Indicator Line */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#D4AF37] rounded-r-full shadow-[0_0_10px_#D4AF37]"></div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div className="px-5 py-6 border-t border-[#D4AF37]/20 bg-linear-to-b from-transparent to-[#FAF8F5]">
        <div className="rounded-2xl p-4 relative overflow-hidden group hover-shimmer cursor-pointer transition-transform hover:-translate-y-1 duration-300 shadow-md">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-linear-to-br from-[#6D28D9] to-[#B76E79] opacity-90"></div>

          {/* Gold Sparkle Pattern Overlay (simulated with dots) */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

          <div className="relative z-10 text-white">
            <div className="text-xs font-medium text-white/80 uppercase tracking-wider">Doanh thu tháng</div>
            <div className="text-2xl font-serif font-bold mt-1 text-white drop-shadow-sm">
              ₫ 1.2B
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm">+12%</span>
              <span className="text-[10px] text-white/90">vs tháng trước</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

