import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import featuredNecklace from '@/assets/featured-necklace.png';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';

export const RefractionSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.15, { once: true });

  return (
    <Section id="craftsmanship" padding="lg" withHairline="top" className="bg-background overflow-hidden">
      <Container ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text Content */}
          <motion.div
            className="order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-body text-xs uppercase tracking-ultra text-muted-foreground mb-6">
              The Craft
            </p>
            
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary tracking-luxury font-normal leading-tight mb-8">
              The Art of
              <br />
              <span className="italic">Refraction</span>
            </h2>

            <motion.div
              className="h-px bg-gold/40 w-20 mb-10"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
            />

            <div className="space-y-8 max-w-lg">
              <p className="font-body text-base text-muted-foreground leading-relaxed">
                Every facet is calculated to capture light at its purest form, 
                creating an ethereal dance of brilliance that defines the essence 
                of true luxury.
              </p>
              
              <p className="font-body text-base text-muted-foreground leading-relaxed">
                Our master gemologists spend countless hours perfecting each cut, 
                ensuring that every piece becomes a vessel for light itself—transforming 
                natural beauty into wearable poetry.
              </p>

              <p className="font-display text-xl text-primary/80 italic leading-relaxed">
                "Light is not captured. It is liberated."
              </p>
            </div>

            {/* CTA */}
            <div className="mt-12">
              <Button variant="outline" size="lg" asChild>
                <a href="#collection">
                  Discover More
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            className="order-1 lg:order-2 relative"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-luxury">
              {/* Ambient glow behind image */}
              <div className="absolute -inset-8 bg-gradient-radial from-gold/10 via-transparent to-transparent opacity-60 blur-3xl" />
              
              <img
                src={featuredNecklace}
                alt="Diamond necklace showcasing light refraction"
                className="relative z-10 w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
              />
              
              {/* Subtle overlay */}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
};