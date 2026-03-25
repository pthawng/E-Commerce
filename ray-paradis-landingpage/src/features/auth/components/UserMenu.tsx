import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Box } from 'lucide-react';

export const UserMenu: React.FC<{ isOpaque?: boolean }> = ({ isOpaque = false }) => {
  const authUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
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
            className={`w-8 h-8 rounded-full border flex items-center justify-center bg-[rgba(255,255,255,0.02)] ${isOpaque
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
        side="bottom"
        sideOffset={12}
        align="end"
        className="w-[280px] rounded-sm bg-background/80 backdrop-blur-2xl border border-primary/10 shadow-luxury p-0 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
      >
        <div className="px-5 py-6 bg-secondary/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-primary/10 flex items-center justify-center bg-background text-primary shadow-sm">
              <span className="font-display text-base tracking-widest">{initials}</span>
            </div>
            <div className="flex flex-col">
              <div className="text-base font-display tracking-wide text-primary leading-tight">
                {authUser?.fullName || 'Member'}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">
                Private Client
              </div>
            </div>
          </div>
        </div>

        <div className="p-2">
          <DropdownMenuItem
            onClick={handleProfile}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-body cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary rounded-none"
          >
            <User className="h-4 w-4 stroke-[1.2]" />
            <span className="tracking-wide">Account Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleOrders}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-body cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary rounded-none"
          >
            <Box className="h-4 w-4 stroke-[1.2]" />
            <span className="tracking-wide">Order History</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-primary/5 my-2" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-body cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors rounded-none"
          >
            <LogOut className="h-4 w-4 stroke-[1.2]" />
            <span className="tracking-wide">Logout</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>

    </DropdownMenu>
  );
};

export default UserMenu;


