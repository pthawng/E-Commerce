import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import useOverlapInView from '@/hooks/useOverlapInView';
import { sectionVariants, durations, easing } from '@/components/effects/motionTokens';
import { ParticleCanvas } from '@/components/effects/ParticleCanvas';
import { ShimmerText } from '@/components/effects/ShimmerText';
import SplitReveal from '@/components/effects/SplitReveal';
import heroImage from '@/assets/hero-jewelry.jpg';
import { useEffect, useState, useRef } from 'react';

export const HeroSection = () => {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useOverlapInView(containerRef, 0.12, { once: true });

  return (
    <section className="relative min-h-screen flex items-end justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <motion.img
          src={heroImage}
          alt="Luxury diamond jewelry on velvet"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-primary/70 dark:bg-background/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
      </div>

      {/* Particle System */}
      <ParticleCanvas 
        theme={isDark ? 'dark' : 'light'} 
        particleCount={60}
        className="z-10"
      />

      {/* Content */}
      <div ref={containerRef} className="relative z-20 container mx-auto px-6 sm:px-8 lg:px-20 text-center pb-24 sm:pb-28 lg:pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.6, duration: durations.section, ease: easing }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Headline */}
          <motion.h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-primary-foreground dark:text-foreground leading-[1.15] tracking-wide font-normal mb-6 sm:mb-8">
            <SplitReveal
              lines={[
                '<span class="italic">Timeless</span> Jewelry.',
                '<span class="text-primary-foreground/80 dark:text-muted-foreground gold-shimmer">Quiet Luxury.</span>',
              ]}
              stagger={0.15}
              className="text-center"
            />
          </motion.h1>

          {/* Decorative Line */}
          <motion.div
            className="h-px bg-primary-foreground/30 dark:bg-primary/30 mx-auto my-8 sm:my-10 lg:my-12"
            initial={{ width: 0 }}
            animate={{ width: 60 }}
            transition={{ delay: 1.2, duration: durations.headline, ease: easing }}
          />

          {/* Subtitle */}
          <motion.p
            className="font-body text-sm sm:text-base md:text-lg text-primary-foreground/70 dark:text-muted-foreground max-w-xl mx-auto mb-12 sm:mb-14 lg:mb-16 leading-relaxed tracking-wide"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 1.4, duration: durations.section, ease: easing }}
          >
            {t.hero.description}
          </motion.p>

          {/* Single CTA Button - Ghost with Glow */}
          <motion.a
            href="#collection"
            className="group relative inline-block cta-quiet"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 1.6, duration: durations.section, ease: easing }}
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-primary-foreground/20 dark:bg-primary/20 rounded-sm blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <span className="relative block px-10 sm:px-12 py-4 sm:py-5 border border-primary-foreground/40 dark:border-primary/40 text-primary-foreground dark:text-primary font-body text-xs sm:text-sm uppercase tracking-ultra overflow-hidden">
              <span className="absolute inset-0 bg-primary-foreground dark:bg-primary -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-luxury" />
              <span className="relative z-10 group-hover:text-primary dark:group-hover:text-primary-foreground transition-colors duration-700">
                Explore the Collection
              </span>
            </span>
          </motion.a>
          
          {/* Microcopy bridge → Featured */}
          <motion.p
            className="font-body text-xs text-muted-foreground mt-6"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 1.9, duration: durations.section, ease: easing }}
          >
            Crafted to reveal a single idea: timeless presence.
          </motion.p>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-12 sm:bottom-16 lg:bottom-20 left-1/2 -translate-x-1/2"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 2.2, duration: durations.section, ease: easing }}
        >
          <motion.div
            className="w-px h-12 sm:h-14 lg:h-16 bg-primary-foreground/20 dark:bg-primary/20 relative overflow-hidden"
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-1/3 bg-primary-foreground/60 dark:bg-primary/60"
              animate={{ y: [0, 40, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};