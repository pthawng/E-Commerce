import React, { useState, useEffect, useRef, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { Menu, User, ShoppingBag, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';
import { AuthSheet } from '@/components/auth';
import UserMenu from '@/features/auth/components/UserMenu';
import { ShimmerText } from '@/components/effects/ShimmerText';
import { useCartStore } from '@/features/cart/store/useCartStore';
import { Link } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Container } from '@/components/layout/Container';

export const Header = React.memo(({ forceOpaque }: { forceOpaque?: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement | null>(null);

  // L7 Optimization: Provide global CSS variables for layout synchronization
  useEffect(() => {
    const updateHeaderVars = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
        document.documentElement.style.setProperty('--header-offset', isHidden ? `-${height}px` : '0px');
      }
    };

    updateHeaderVars();
    window.addEventListener('resize', updateHeaderVars);
    return () => window.removeEventListener('resize', updateHeaderVars);
  }, [isHidden]);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { theme, language } = useStore();
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const { setOpen, items, fetchCart } = useCartStore();
  const cartItemCount = (items || []).reduce((sum, item) => sum + item.quantity, 0);
  
  // Initial cart sync for authenticated users
  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, fetchCart]);

  useEffect(() => {
    const tolerance = 10;
    let throttleTimeout: any;

    const handleScroll = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        const currentY = window.scrollY;
        const nextScrolled = currentY > 50 || !!forceOpaque;
        
        setIsScrolled(prev => {
          if (prev !== nextScrolled) return nextScrolled;
          return prev;
        });

        const passedFirstSection = currentY > window.innerHeight;
        const delta = currentY - lastScrollY.current;

        if (passedFirstSection && delta > tolerance) {
          setIsHidden(prev => prev !== true ? true : prev);
        } else if (delta < -tolerance) {
          setIsHidden(prev => prev !== false ? false : prev);
        }

        lastScrollY.current = currentY;
        throttleTimeout = null;
      }, 50); // 50ms throttle for scroll stability
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [forceOpaque]);

  const navItems = [
    { label: t('common.nav.collections'), href: '/collections' },
    { label: t('common.nav.heritage'), href: '/#heritage' },
    { label: t('common.nav.craftsmanship'), href: '/#atelier' },
  ];
  
  const shouldUsePrimaryColor = !!forceOpaque || (isScrolled && theme === 'light');

  return (
    <>
      <motion.header
        ref={headerRef as RefObject<HTMLElement>}
        initial={{ y: -100 }}
        animate={{ y: isHidden ? -120 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 pointer-events-auto ${
          isScrolled || !!forceOpaque
            ? 'bg-background shadow-sm border-b border-border/10'
            : 'bg-transparent'
        }`}
      >
        <div className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-full bg-border/20" />
        </div>

        <Container>
          <div className="relative flex items-center justify-between h-20 sm:h-24 lg:h-28">
            <div className="flex items-center gap-8 flex-1">
              <Sheet>
                <SheetTrigger asChild>
                  <motion.button
                    className="p-2 -ml-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Menu
                      className={`w-6 h-6 ${shouldUsePrimaryColor ? 'text-primary' : 'text-white dark:text-foreground'}`}
                      strokeWidth={1}
                    />
                  </motion.button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] sm:w-[380px] border-r-0 bg-background/95 backdrop-blur-xl">
                  <div className="flex flex-col h-full py-12">
                    <SheetClose className="absolute top-8 right-8">
                      <X className="w-6 h-6 text-foreground/60 hover:text-primary transition-colors" strokeWidth={1} />
                    </SheetClose>

                    <div className="mb-20">
                      <span className="font-display text-3xl tracking-luxury text-primary">
                        Ray Paradis
                      </span>
                    </div>

                    <nav className="flex flex-col gap-10">
                      {navItems.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + 0.08 * index, duration: 0.6 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => analytics.track('nav_click', { section: item.label, source: 'mobile_menu' })}
                            className="font-display text-4xl sm:text-5xl text-foreground hover:text-primary transition-all duration-500 hover:translate-x-2 block"
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}
                    </nav>

                    <div className="mt-auto pt-16 border-t border-border/10 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <ThemeToggle />
                        <LanguageToggle isOpaque={true} />
                      </div>
                      <p className="font-body text-xs text-muted-foreground/60 tracking-[0.2em] uppercase">
                        {t('shop.pdp.mastery')}
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <nav className="hidden lg:flex items-center gap-8">
                {navItems.slice(0, 2).map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => analytics.track('nav_click', { section: item.label, source: 'desktop_nav' })}
                    className={`font-body text-xs uppercase tracking-[0.2em] ${shouldUsePrimaryColor ? 'text-primary' : 'text-white dark:text-foreground/80'} hover:text-gold transition-colors duration-500`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2"
              onClick={() => analytics.track('nav_click', { section: 'Logo', source: 'header_center' })}
            >
              <motion.span
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
                <ShimmerText
                  className={`font-display text-xl sm:text-3xl lg:text-4xl tracking-luxury whitespace-nowrap font-normal ${shouldUsePrimaryColor ? 'text-primary' : 'text-white'}`}
                  interval={6000}
                >
                  Ray Paradis
                </ShimmerText>
              </motion.span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-4 flex-1 justify-end">
              {user ? (
                <UserMenu isOpaque={shouldUsePrimaryColor} />
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="p-2"
                >
                  <User className={`w-5 h-5 ${shouldUsePrimaryColor ? 'text-primary' : 'text-white dark:text-foreground'}`} strokeWidth={1} />
                </button>
              )}

              <button 
                className="p-2 relative group"
                onClick={() => setOpen(true)}
              >
                <ShoppingBag className={`w-5 h-5 ${shouldUsePrimaryColor ? 'text-primary' : 'text-white dark:text-foreground'}`} strokeWidth={1} />
                {cartItemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-gold text-primary font-body text-[9px] flex items-center justify-center rounded-full border border-background shadow-sm"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </button>
              
              <div className="hidden sm:flex items-center gap-2 sm:gap-4">
                <LanguageToggle isOpaque={shouldUsePrimaryColor} />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </Container>
      </motion.header>

      <AuthSheet open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
});

Header.displayName = 'Header';