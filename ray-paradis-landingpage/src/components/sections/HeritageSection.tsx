import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import { useTranslation } from '@/hooks/useTranslation';

export const HeritageSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.17, { once: true });
  const { t } = useTranslation();

  return (
    <section id="heritage" className="bg-secondary/50 relative overflow-hidden section-vertical">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-primary/3 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-60 sm:w-96 h-60 sm:h-96 bg-primary/3 rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative">
        <div className="max-w-3xl lg:max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div
            ref={ref}
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              className="font-body text-2xs sm:text-xs uppercase tracking-ultra text-muted-foreground mb-4 sm:mb-5"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {t.heritage.subtitle}
            </motion.p>
            <motion.h2
              className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-primary tracking-wide font-normal"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {t.heritage.title}
            </motion.h2>
            <motion.div
              className="h-px bg-primary/30 mx-auto mt-6 sm:mt-8"
              initial={{ width: 0 }}
              animate={isInView ? { width: 48 } : {}}
              transition={{ delay: 0.5, duration: 1 }}
            />
          </motion.div>

          {/* Content */}
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <motion.p
              className="font-body text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed text-center tracking-wide"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {t.heritage.paragraph1}
            </motion.p>

            <motion.p
              className="font-body text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed text-center tracking-wide"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {t.heritage.paragraph2}
            </motion.p>

            <motion.p
              className="font-display text-sm sm:text-base lg:text-lg text-foreground/70 leading-relaxed text-center italic"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {t.heritage.paragraph3}
            </motion.p>
          </div>

          {/* Signature */}
          <motion.div
            className="mt-12 sm:mt-16 lg:mt-20 text-center"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <p className="font-display text-xl sm:text-2xl lg:text-3xl text-primary italic mb-2 font-normal">
              {t.heritage.signature}
            </p>
            <p className="font-body text-2xs sm:text-xs uppercase tracking-ultra text-muted-foreground">
              {t.heritage.founder}
            </p>
          </motion.div>
          {/* Microcopy bridge → Refraction */}
          <div className="text-center mt-8">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.9 }}
              className="font-body text-xs text-muted-foreground"
            >
              Foundations that shape the future.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
};
