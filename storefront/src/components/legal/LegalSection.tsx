import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onVisible?: (id: string) => void;
  className?: string;
}

export const LegalSection: React.FC<LegalSectionProps> = ({
  id,
  title,
  children,
  onVisible,
  className
}) => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!onVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            onVisible(id);
          }
        });
      },
      {
        rootMargin: '-10% 0px -70% 0px', // Standard for highlighting section you are reading
        threshold: [0.2]
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [id, onVisible]);

  return (
    <section 
      id={id} 
      ref={sectionRef} 
      className={cn("scroll-mt-24 py-8 first:pt-0", className)}
    >
      <h2 className="font-display text-xl md:text-2xl text-primary mb-6 italic">
        {title}
      </h2>
      <div className="font-body text-base text-muted-foreground leading-relaxed space-y-6">
        {children}
      </div>
    </section>
  );
};
