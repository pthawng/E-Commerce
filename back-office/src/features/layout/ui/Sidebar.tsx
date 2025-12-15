import { NavLink } from "react-router-dom";
import {
  AppstoreOutlined,
  SketchOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  TagsOutlined,
  ShoppingOutlined,
  UserOutlined,
  LineChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <AppstoreOutlined /> },
  { to: "/products", label: "Sản phẩm", icon: <SketchOutlined /> },
  { to: "/users", label: "Người dùng", icon: <TeamOutlined /> },
  { to: "/rbac", label: "RBAC", icon: <SafetyCertificateOutlined /> },
  { to: "/category", label: "Danh mục", icon: <TagsOutlined /> },
  { to: "/orders", label: "Đơn hàng", icon: <ShoppingOutlined /> },
  { to: "/customers", label: "Khách hàng", icon: <UserOutlined /> },
  { to: "/reports", label: "Báo cáo", icon: <LineChartOutlined /> },
  { to: "/settings", label: "Cài đặt", icon: <SettingOutlined /> },
];

export default function Sidebar({ open }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 flex-col bg-white/90 backdrop-blur-3xl border-r border-[#D4AF37]/30 z-30 transform transition-transform duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.03)] ${open ? "translate-x-0" : "-translate-x-full"
        } ${open ? "flex" : "hidden lg:flex"}`}
    >
      <div className="px-6 py-6 border-b border-[#D4AF37]/20 relative overflow-hidden">
        {/* Decorative Gold Shimmer Top */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] p-[1px] shadow-lg shadow-violet-200">
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

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${isActive
                ? "bg-[#6D28D9]/5 text-[#6D28D9]"
                : "text-slate-500 hover:text-[#6D28D9] hover:bg-slate-50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>

                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#D4AF37] rounded-r-full shadow-[0_0_10px_#D4AF37]"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-6 border-t border-[#D4AF37]/20 bg-gradient-to-b from-transparent to-[#FAF8F5]">
        <div className="rounded-2xl p-4 relative overflow-hidden group hover-shimmer cursor-pointer transition-transform hover:-translate-y-1 duration-300 shadow-md">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6D28D9] to-[#B76E79] opacity-90"></div>

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

