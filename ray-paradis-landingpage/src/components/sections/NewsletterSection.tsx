import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email().max(255);

export const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.15, { once: true });
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = emailSchema.safeParse(email);
    
    if (!result.success) {
      toast.error(t.newsletter.error);
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(t.newsletter.success);
    setEmail('');
    setIsLoading(false);
  };

  return (
    <section className="bg-background section-vertical relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full bg-gradient-radial from-primary/8 to-transparent" />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-20 relative">
        <motion.div
          ref={ref}
          className="max-w-xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Section Header */}
          <motion.p
            className="font-body text-xs sm:text-sm uppercase tracking-ultra text-muted-foreground mb-6"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Join the Circle
          </motion.p>
          
          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary tracking-wide font-normal leading-tight"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="italic">{t.newsletter.title}</span>
          </motion.h2>

          <motion.p
            className="font-body text-sm sm:text-base text-muted-foreground mt-8 mb-12 leading-relaxed max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t.newsletter.description}
          </motion.p>

          {/* Minimalist Form with Gold Underline */}
          <motion.form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="relative mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t.newsletter.placeholder}
                className="w-full px-0 py-4 bg-transparent border-0 border-b border-border/40 text-foreground font-body text-sm placeholder:text-muted-foreground/50 focus:outline-none transition-colors duration-500 tracking-wide text-center"
                required
                maxLength={255}
              />
              {/* Gold/Primary underline animation */}
              <motion.div
                className="absolute bottom-0 left-1/2 h-px bg-primary"
                initial={{ width: 0, x: '-50%' }}
                animate={{ 
                  width: isFocused ? '100%' : '0%',
                  x: '-50%'
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="group relative inline-block w-full sm:w-auto cta-quiet"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="block px-12 py-4 border border-primary/40 text-primary font-body text-xs uppercase tracking-ultra overflow-hidden relative">
                <span className="absolute inset-0 bg-primary -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-luxury" />
                <span className="relative z-10 group-hover:text-primary-foreground transition-colors duration-700">
                  {isLoading ? '...' : t.newsletter.button}
                </span>
              </span>
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
};