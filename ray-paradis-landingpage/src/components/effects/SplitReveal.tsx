import React, { useEffect, useMemo, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { headlineLine, stagger as tokenStagger } from './motionTokens';

interface SplitRevealProps {
  lines: string[];
  className?: string;
  stagger?: number;
}

export const SplitReveal = ({ lines, className = '', stagger }: SplitRevealProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { once: true, margin: '-120px' });
  const controls = useAnimation();

  const effectiveStagger = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return stagger ?? tokenStagger.mobile;
    return stagger ?? tokenStagger.desktop;
  }, [stagger]);

  useEffect(() => {
    if (!inView) return;

    // Respect reduced motion: reveal immediately without stagger
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      controls.start('visible');
      return;
    }

    // ensure Lenis had time to initialize to avoid stutter
    const startAnimation = async () => {
      const waitForLenis = () =>
        new Promise<void>((res) => {
          if ((window as unknown as { __lenis?: unknown }).__lenis) return setTimeout(res, 40);
          // fallback short delay
          setTimeout(res, 300);
        });

      await waitForLenis();
      controls.start('visible');
    };

    startAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: effectiveStagger,
      },
    },
  };

  const line = headlineLine;

  return (
    <div ref={containerRef} className={`split-reveal ${className}`}>
      <motion.div initial="hidden" animate={controls} variants={container}>
        {lines.map((text, i) => (
          <div key={i} className="overflow-hidden">
            <motion.div variants={line} className="inline-block w-full">
              <span dangerouslySetInnerHTML={{ __html: text }} />
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default SplitReveal;


