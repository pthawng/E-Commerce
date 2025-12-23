import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';

export const AtelierSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.17, { once: true });

  return (
    <section id="atelier" className="relative bg-background section-vertical overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40 dark:opacity-30"
          poster="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1920&q=80"
        >
          <source 
            src="https://player.vimeo.com/external/370331493.sd.mp4?s=e90dcaba73c19e0e36f03406b47bbd6992dd6c1c&profile_id=165&oauth2_token_id=57447761" 
            type="video/mp4" 
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      </div>

      <div ref={ref} className="relative container mx-auto px-6 sm:px-8 lg:px-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Minimal Text */}
          <motion.p
            className="font-body text-xs sm:text-sm uppercase tracking-ultra text-muted-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            The Atelier
          </motion.p>

          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary tracking-wide font-normal leading-[1.2] mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
          >
            <span className="italic">Handcrafted</span>
            <br />
            in Vietnam
          </motion.h2>

          <motion.div
            className="h-px bg-primary/30 mx-auto w-16"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.4, duration: 1, ease: 'easeInOut' }}
          />

          <motion.p
            className="font-body text-sm sm:text-base text-muted-foreground mt-8 max-w-lg mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Each piece passes through the hands of our master artisans, 
            where tradition meets innovation in the pursuit of perfection.
          </motion.p>
        </div>
      </div>
      {/* Microcopy bridge → Heritage */}
      <div className="text-center mt-10">
        <motion.p
          className="font-body text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.9 }}
        >
          Rooted in a practice.
        </motion.p>
      </div>
    </section>
  );
};