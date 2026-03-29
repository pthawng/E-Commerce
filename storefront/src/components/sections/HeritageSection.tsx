import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import { useTranslation } from '@/hooks/useTranslation';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';

export const HeritageSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.17, { once: true });
  const { t } = useTranslation();

  return (
    <Section id="heritage" padding="lg" className="bg-secondary/30 relative overflow-hidden" withHairline="both">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gold/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <Container className="relative">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div
            ref={ref}
            className="text-center mb-16 lg:mb-24"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              className="font-body text-xs uppercase tracking-ultra text-muted-foreground mb-6"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {t.heritage.subtitle}
            </motion.p>
            <motion.h2
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary tracking-luxury font-normal leading-tight"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {t.heritage.title}
            </motion.h2>
            <motion.div
              className="h-px bg-gold/30 mx-auto mt-10"
              initial={{ width: 0 }}
              animate={isInView ? { width: 64 } : {}}
              transition={{ delay: 0.5, duration: 1 }}
            />
          </motion.div>

          {/* Content */}
          <div className="space-y-12">
            <motion.p
              className="font-body text-lg text-muted-foreground leading-relaxed text-center tracking-wide"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {t.heritage.paragraph1}
            </motion.p>

            <motion.p
              className="font-body text-lg text-muted-foreground leading-relaxed text-center tracking-wide"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {t.heritage.paragraph2}
            </motion.p>

            <motion.p
              className="font-display text-2xl text-primary/80 leading-relaxed text-center italic"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {t.heritage.paragraph3}
            </motion.p>
          </div>

          {/* Signature */}
          <motion.div
            className="mt-20 lg:mt-32 text-center"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <p className="font-display text-3xl text-primary italic mb-4 font-normal">
              {t.heritage.signature}
            </p>
            <p className="font-body text-xs uppercase tracking-ultra text-muted-foreground">
              {t.heritage.founder}
            </p>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
};
