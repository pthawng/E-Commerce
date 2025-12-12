import { NavLink } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "💎" },
  { to: "/products", label: "Sản phẩm", icon: "💍" },
  { to: "/rbac", label: "RBAC", icon: "🛡️" },
  { to: "/category", label: "Danh mục", icon: "📁" },
  { to: "/orders", label: "Đơn hàng", icon: "📦" },
  { to: "/customers", label: "Khách hàng", icon: "👤" },
  { to: "/reports", label: "Báo cáo", icon: "📊" },
  { to: "/settings", label: "Cài đặt", icon: "⚙️" },
];

export default function Sidebar({ open }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 flex-col bg-slate-900/80 backdrop-blur-xl border-r border-amber-500/20 z-30 transform transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } ${open ? "flex" : "hidden lg:flex"}`}
    >
      <div className="px-6 py-5 border-b border-amber-500/10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xl">
            R
          </div>
          <div>
            <div className="text-lg font-semibold text-amber-200">
              Ray Paradis
            </div>
            <div className="text-xs text-slate-400">Back Office</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl transition border border-transparent ${
                isActive
                  ? "bg-amber-500/15 text-amber-100 border-amber-500/30"
                  : "text-slate-300 hover:text-amber-100 hover:bg-slate-800/60"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-amber-500/10">
        <div className="rounded-2xl bg-slate-800/70 p-3 border border-amber-500/20">
          <div className="text-xs text-slate-400">Doanh thu tháng</div>
          <div className="text-lg font-semibold text-amber-200 mt-1">
            ₫ 1.2B
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">
            +12% so với tháng trước
          </div>
        </div>
      </div>
    </aside>
  );
}

