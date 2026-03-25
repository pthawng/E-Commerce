import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { sectionVariants, durations, easing } from '@/components/effects/motionTokens';
import { ParticleCanvas } from '@/components/effects/ParticleCanvas';
import SplitReveal from '@/components/effects/SplitReveal';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
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

  return (
    <Section padding="none" className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
      <Container ref={containerRef} className="relative z-20 text-center pt-20 sm:pt-24 lg:pt-28 pb-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          transition={{ delay: 0.6, duration: durations.section, ease: easing }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Headline */}
          <motion.h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-primary-foreground dark:text-foreground leading-[1.2] tracking-luxury font-normal mb-8 px-4">
            <SplitReveal
              lines={[
                '<span><span class="italic">Timeless</span> Jewelry</span>',
                '<span class="gold-shimmer text-[0.85em] mt-2 block opacity-100">Quiet Luxury</span>',
              ]}
              stagger={0.15}
              className="text-center"
            />
          </motion.h1>

          {/* Decorative Line */}
          <motion.div
            className="h-px bg-primary-foreground/30 dark:bg-gold/30 mx-auto my-10 lg:my-14"
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ delay: 1.2, duration: durations.headline, ease: easing }}
          />

          {/* Subtitle */}
          <motion.p
            className="font-body text-base md:text-lg text-primary-foreground/70 dark:text-muted-foreground max-w-xl mx-auto mb-14 lg:mb-20 leading-relaxed tracking-wide"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 1.4, duration: durations.section, ease: easing }}
          >
            {t.hero.description}
          </motion.p>

          {/* Luxury CTA Button */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 1.6, duration: durations.section, ease: easing }}
          >
            <Button variant="luxury" size="lg" asChild>
              <a href="#collection">
                Explore the Collection
              </a>
            </Button>
          </motion.div>

        </motion.div>

      </Container>

      {/* Scroll Indicator - Bottom of Section */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 2.2, duration: durations.section, ease: easing }}
      >
        <div className="w-px h-16 bg-primary-foreground/20 dark:bg-gold/20 relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-1/3 bg-gold/60"
            animate={{ y: [0, 48, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* Microcopy bridge → Featured - Bottom of Section */}
      <motion.p
        className="absolute bottom-4 left-0 w-full font-body text-[10px] sm:text-[11px] text-primary-foreground/40 uppercase tracking-[0.4em] text-center px-4 z-30"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        transition={{ delay: 2.5, duration: durations.section, ease: easing }}
      >
        Crafted to reveal a single idea: timeless presence
      </motion.p>
    </Section>
  );
};