import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";

/**
 * Admin layout với sidebar + header, phong cách sang trọng
 */
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const layoutPaddingClass = useMemo(
    () => (sidebarOpen ? "lg:pl-64" : "lg:pl-0"),
    [sidebarOpen],
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay cho mobile khi mở sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`flex-1 flex flex-col transition-all duration-300 ${layoutPaddingClass}`}>
        <HeaderBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />

        <main className="px-4 lg:px-8 py-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
