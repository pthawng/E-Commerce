import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import featuredNecklace from '@/assets/featured-necklace.png';

export const RefractionSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.15, { once: true });

  return (
    <section id="craftsmanship" className="bg-background section-vertical overflow-hidden">
      <div ref={ref} className="container mx-auto px-6 sm:px-8 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <p className="font-body text-xs sm:text-sm uppercase tracking-ultra text-muted-foreground mb-6">
              The Craft
            </p>
            
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary tracking-wide font-normal leading-[1.2] mb-8">
              The Art of
              <br />
              <span className="italic">Refraction</span>
            </h2>

            <motion.div
              className="h-px bg-primary/30 w-16 mb-8"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.3, duration: 1, ease: 'easeInOut' }}
              style={{ transformOrigin: 'left' }}
            />

            <div className="space-y-6">
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
                Every facet is calculated to capture light at its purest form, 
                creating an ethereal dance of brilliance that defines the essence 
                of true luxury.
              </p>
              
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
                Our master gemologists spend countless hours perfecting each cut, 
                ensuring that every piece becomes a vessel for light itself—transforming 
                natural beauty into wearable poetry.
              </p>

              <p className="font-display text-base sm:text-lg text-foreground/70 italic leading-relaxed">
                "Light is not captured. It is liberated."
              </p>
            </div>

            {/* CTA */}
            <motion.a
              href="#collection"
              className="inline-block mt-10 px-8 py-3.5 border border-primary/30 text-primary font-body text-xs uppercase tracking-ultra relative overflow-hidden group cta-quiet"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-primary -translate-x-full group-hover:translate-x-0 transition-transform duration-600 ease-luxury" />
              <span className="relative z-10 group-hover:text-primary-foreground transition-colors duration-600">
                Discover More
              </span>
            </motion.a>
          </motion.div>

          {/* Image */}
          <motion.div
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeInOut' }}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {/* Ambient glow behind image */}
              <div className="absolute -inset-8 bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-60 blur-3xl" />
              
              <img
                src={featuredNecklace}
                alt="Diamond necklace showcasing light refraction"
                className="relative z-10 w-full h-full object-cover"
              />
              
              {/* Subtle overlay */}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
        {/* Microcopy bridge → Newsletter */}
        <div className="text-center mt-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.9 }}
            className="font-body text-xs text-muted-foreground"
          >
            If light is the question, stay to learn the answer.
          </motion.p>
        </div>
      </div>
    </section>
  );
};