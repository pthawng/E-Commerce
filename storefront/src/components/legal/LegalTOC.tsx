import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface TOCItem {
  id: string;
  title: string;
}

interface LegalTOCProps {
  items: TOCItem[];
  activeId: string;
  pageTitle: string;
  lastUpdated: string;
}

export const LegalTOC: React.FC<LegalTOCProps> = ({ items, activeId, pageTitle, lastUpdated }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language } = useStore();

  // Sync URL hash with activeId without triggering scroll jump
  useEffect(() => {
    if (activeId) {
      const newHash = `#${activeId}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    }
  }, [activeId]);

  const activeItem = items.find(item => item.id === activeId) || items[0];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop TOC */}
      <nav className="hidden lg:block sticky top-24 h-fit max-w-[240px]" aria-label="Table of Contents">
        <div className="mb-10">
          <h1 className="font-display text-2xl text-primary italic mb-2">
            {pageTitle}
          </h1>
          <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground/60">
            {language === 'vi' ? 'Cập nhật:' : 'Updated:'} {lastUpdated}
          </p>
        </div>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleLinkClick(e, item.id)}
                className={cn(
                  "block font-body text-sm transition-all duration-500 hover:text-gold relative",
                  activeId === item.id 
                    ? "text-primary font-medium translate-x-1" 
                    : "text-muted-foreground"
                )}
                aria-current={activeId === item.id ? 'location' : undefined}
              >
                {activeId === item.id && (
                  <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-1 bg-gold rounded-full" />
                )}
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Sticky Selector */}
      <div className="lg:hidden sticky top-[var(--header-height)] z-40 w-full bg-background/80 backdrop-blur-xl border-b border-hairline transition-all duration-500">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left"
        >
          <div className="flex flex-col">
            <span className="font-body text-[8px] uppercase tracking-ultra text-muted-foreground">
              {language === 'vi' ? 'Đang xem mục' : 'Viewing Section'}
            </span>
            <span className="font-display italic text-base text-primary">{activeItem?.title}</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-gold transition-transform duration-500", isMobileMenuOpen && "rotate-180")} />
        </button>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-background border-b border-hairline shadow-luxury animate-in fade-in slide-in-from-top-2 duration-300">
            <ul className="py-4 px-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleLinkClick(e, item.id)}
                    className={cn(
                      "block font-body text-sm py-1 transition-colors",
                      activeId === item.id ? "text-gold" : "text-primary/60"
                    )}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};
