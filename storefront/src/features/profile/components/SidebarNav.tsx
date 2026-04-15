import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { User, ShoppingBag, Heart, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const SidebarNav: React.FC = () => {
  const { t } = useTranslation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const navItems = [
    { label: t('account.nav.profile'), href: '/account', icon: User },
    { label: t('account.nav.orders'), href: '/account/orders', icon: ShoppingBag },
    { label: t('account.nav.saved'), href: '/account/saved', icon: Heart },
  ];

  return (
    <nav className="space-y-8">
      <div className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end
            className={({ isActive }) => `
              flex items-center gap-4 py-3 text-sm tracking-widest uppercase transition-all duration-300
              ${isActive
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-primary'
              }
            `}
          >
            <item.icon className="w-4 h-4 stroke-[1.2]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="pt-8 border-t border-primary/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 py-3 text-sm tracking-widest uppercase text-destructive/80 hover:text-destructive transition-all duration-300"
        >
          <LogOut className="w-4 h-4 stroke-[1.2]" />
          <span>{t('account.nav.logout')}</span>
        </button>
      </div>
    </nav>
  );
};
