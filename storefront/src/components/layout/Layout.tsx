import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SpotlightCursor } from '@/components/effects/SpotlightCursor';
import { CartDrawer } from '@/features/cart/components/CartDrawer';

interface LayoutProps {
  children: React.ReactNode;
  forceHeaderOpaque?: boolean;
}

export const Layout = ({ children, forceHeaderOpaque }: LayoutProps) => {
  const { theme } = useStore();

  useEffect(() => {
    // Ensure theme class is applied on mount
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <Header forceOpaque={forceHeaderOpaque} />
      <CartDrawer />
      <SpotlightCursor />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
