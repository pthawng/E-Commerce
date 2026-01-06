import { useState, useEffect, useRef, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { Menu, User, ShoppingBag, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useStore } from '@/store/useStore';
import { AuthSheet } from '@/components/auth';
import { useAuthStore } from '@/features/auth/hooks/useAuthStore';
import { toast } from 'sonner';
import UserMenu from '@/features/auth/components/UserMenu';
import { ShimmerText } from '@/components/effects/ShimmerText';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement | null>(null);
  const [isOverLightBg, setIsOverLightBg] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user } = useStore();

  useEffect(() => {
    const tolerance = 10;

    const handleScroll = () => {
      const currentY = window.scrollY;
      // update scrolled background state
      setIsScrolled(currentY > 50);

      // hide header only after user scrolls past the first viewport
      const passedFirstSection = currentY > window.innerHeight;

      const delta = currentY - lastScrollY.current;

      if (passedFirstSection && delta > tolerance) {
        // scrolling down
        setIsHidden(true);
      } else if (delta < -tolerance) {
        // scrolling up
        setIsHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // detect background color under header to decide whether to use opaque background
  useEffect(() => {
    const getColorAtPoint = (x: number, y: number) => {
      let el = document.elementFromPoint(x, y) as HTMLElement | null;
      // climb up until we find a non-transparent background or body
      while (el && el !== document.body) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        el = el.parentElement;
      }
      return window.getComputedStyle(document.body).backgroundColor;
    };

    const rgbToLuminance = (rgb: string) => {
      // parse "rgb(a)?" formats
      const nums = rgb.replace(/rgba?\(|\)|\s/g, '').split(',').map(Number);
      const r = nums[0] / 255;
      const g = nums[1] / 255;
      const b = nums[2] / 255;
      const a = nums[3] ?? 1;
      // ignore fully transparent
      if (a === 0) return 0;
      const srgb = [r, g, b].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    };

    const checkBg = () => {
      if (!headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      const sampleY = Math.min(window.innerHeight - 1, rect.bottom + 8); // just under header, but inside viewport

      const xs = [window.innerWidth * 0.25, window.innerWidth * 0.5, window.innerWidth * 0.75];
      const lums = xs.map((x) => {
        const color = getColorAtPoint(x, sampleY);
        return rgbToLuminance(color);
      });
      const avgLum = lums.reduce((a, b) => a + b, 0) / lums.length;
      // lower threshold — more permissive for typical site backgrounds and overlays
      setIsOverLightBg(avgLum > 0.6);
    };

    checkBg();
    window.addEventListener('scroll', checkBg, { passive: true });
    window.addEventListener('resize', checkBg);
    return () => {
      window.removeEventListener('scroll', checkBg);
      window.removeEventListener('resize', checkBg);
    };
  }, []);

  const navItems = [
    { label: 'Shop', href: '#collection' },
    { label: 'Story', href: '#heritage' },
    { label: 'Atelier', href: '#atelier' },
  ];
  const usingOpaqueBg = isScrolled && isOverLightBg;

  return (
    <>
      <motion.header
        ref={headerRef as RefObject<HTMLElement>}
        initial={{ y: -100 }}
        animate={{ y: isHidden ? -120 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 pointer-events-auto ${
          isScrolled
            ? isOverLightBg
              ? 'bg-background'
              : 'bg-background/60 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        {/* Hairline border */}
        <div className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        </div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-20">
          <div className="flex items-center justify-between h-20 sm:h-24 lg:h-28">
            {/* Left - Menu */}
            <div className="flex items-center gap-6 flex-1">
              <Sheet>
                <SheetTrigger asChild>
                  <motion.button
                    className="p-2 -ml-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Menu
                      className={`w-6 h-6 ${usingOpaqueBg ? 'text-primary' : 'text-white dark:text-foreground'}`}
                      strokeWidth={1}
                    />
                  </motion.button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] sm:w-[380px] border-r-0 bg-background/95 backdrop-blur-xl">
                  <div className="flex flex-col h-full py-8">
                    {/* Close Button */}
                    <SheetClose className="absolute top-6 right-6">
                      <X className="w-5 h-5 text-foreground" strokeWidth={1} />
                    </SheetClose>

                    {/* Logo */}
                    <div className="mb-16">
                      <span className="font-display text-2xl tracking-luxury text-primary">
                        Ray Paradis
                      </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-8">
                      {navItems.map((item, index) => (
                        <motion.a
                          key={item.label}
                          href={item.href}
                    className="font-display text-3xl sm:text-4xl text-foreground hover:text-primary transition-colors duration-500"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + 0.08 * index, duration: 0.6 }}
                        >
                          {item.label}
                        </motion.a>
                      ))}
                    </nav>

                    {/* Footer */}
                    <div className="mt-auto pt-16 border-t border-border/30">
                      <p className="font-body text-xs text-muted-foreground tracking-wider">
                        Handcrafted with love in Vietnam
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-10">
                {navItems.slice(0, 2).map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`font-body text-sm uppercase tracking-wider ${usingOpaqueBg ? 'text-primary' : 'text-white dark:text-foreground/80'} hover:text-primary transition-colors duration-500`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Center - Logo */}
            <a
              href="#"
              className="absolute left-1/2 -translate-x-1/2"
            >
              <motion.span
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
                <ShimmerText
                  className={`font-display text-2xl sm:text-3xl lg:text-4xl tracking-luxury whitespace-nowrap font-normal ${usingOpaqueBg ? 'text-primary' : 'text-white'}`}
                  interval={6000}
                >
                  Ray Paradis
                </ShimmerText>
              </motion.span>
            </a>

            {/* Right - Actions */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
              {/* Account Icon */}
              {user ? (
                <UserMenu isOpaque={usingOpaqueBg} />
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="p-2"
                >
                  <User className={`w-5 h-5 ${usingOpaqueBg ? 'text-primary' : 'text-white dark:text-foreground'}`} strokeWidth={1} />
                </button>
              )}

              {/* Cart Icon */}
              <button className="hidden sm:block p-2">
                <ShoppingBag className={`w-5 h-5 ${usingOpaqueBg ? 'text-primary' : 'text-white dark:text-foreground'}`} strokeWidth={1} />
              </button>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Auth Sheet */}
      <AuthSheet open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
};