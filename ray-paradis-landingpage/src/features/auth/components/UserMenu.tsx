import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Box } from 'lucide-react';

export const UserMenu: React.FC<{ isOpaque?: boolean }> = ({ isOpaque = false }) => {
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logoutPublic = useStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    logoutPublic?.();
    // optional: navigate to home
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/account');
  };

  const handleOrders = () => {
    navigate('/account/orders');
  };

  const initials = authUser
    ? (authUser.fullName
        ? authUser.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : authUser.email.slice(0, 2).toUpperCase())
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 focus-visible:shadow-[0_0_0_4px_rgba(191,167,107,0.06)] rounded-full"
          aria-label="Open user menu"
        >
          <div
            className={`w-8 h-8 rounded-full border flex items-center justify-center bg-[rgba(255,255,255,0.02)] ${
              isOpaque
                ? 'border-primary text-primary'
                : 'border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.92)]'
            }`}
          >
            <span className="font-display text-xs">
              {initials}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        sideOffset={28}
        align="start"
        className="w-[260px] rounded-md bg-[rgba(18,18,18,0.46)] backdrop-blur-md border border-[rgba(255,255,255,0.06)] shadow-[0_6px_20px_rgba(8,8,8,0.18)] p-3 transition-transform duration-180 ease-out data-[state=open]:translate-x-0 data-[state=closed]:translate-x-1 data-[state=open]:translate-y-4 data-[state=closed]:translate-y-0 data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
      >
        <div className="px-2 py-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-[rgba(255,255,255,0.04)] flex items-center justify-center bg-[rgba(255,255,255,0.02)] text-sm">
              <span className="font-display text-sm text-[rgba(255,255,255,0.92)]">{initials}</span>
            </div>
            <div>
              <div className="text-base font-display tracking-wide text-[rgba(255,255,255,0.92)]">{authUser?.fullName || authUser?.email || 'Guest'}</div>
              <div className="text-xs text-[rgba(255,255,255,0.45)] tracking-wide">{authUser?.email}</div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="flex flex-col px-2 py-1">
          <button
            onClick={handleProfile}
            className="text-sm text-[rgba(255,255,255,0.84)] py-2 text-left hover:text-[rgba(255,255,255,0.98)] transition-colors duration-120 flex items-center gap-3"
          >
            <User className="h-3.5 w-3.5 opacity-80" /> <span>Account</span>
          </button>
          <button
            onClick={handleOrders}
            className="text-sm text-[rgba(255,255,255,0.84)] py-2 text-left hover:text-[rgba(255,255,255,0.98)] transition-colors duration-120 flex items-center gap-3"
          >
            <Box className="h-3.5 w-3.5 opacity-80" /> <span>My orders</span>
          </button>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1">
          <button
            onClick={handleLogout}
            className="w-full text-sm tracking-wide border border-[rgba(255,255,255,0.06)] rounded-md py-2 text-[rgba(255,255,255,0.86)] hover:bg-[rgba(255,255,255,0.02)] transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4 opacity-85" /> Logout
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;


