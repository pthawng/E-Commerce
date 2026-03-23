import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { z } from 'zod';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const emailSchema = z.string().email().max(255);

export const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    <Section padding="lg" withHairline="bottom" className="bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-gold/5 via-transparent to-transparent blur-3xl" />
      </div>

      <Container>
        <motion.div
          ref={ref}
          className="max-w-2xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Section Header */}
          <motion.p
            className="font-body text-xs uppercase tracking-ultra text-muted-foreground mb-6"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Join the Circle
          </motion.p>
          
          <motion.h2
            className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary tracking-luxury font-normal leading-tight"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="italic">{t.newsletter.title}</span>
          </motion.h2>

          <motion.p
            className="font-body text-base text-muted-foreground mt-8 mb-16 leading-relaxed max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t.newsletter.description}
          </motion.p>

          {/* SaaS-ready Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-4 items-center"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="flex-1 w-full">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.newsletter.placeholder}
                className="text-center sm:text-left h-14"
                required
                maxLength={255}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="luxury"
              size="lg"
              className="w-full sm:w-auto min-w-[160px]"
            >
              {isLoading ? '...' : t.newsletter.button}
            </Button>
          </motion.form>

          {/* Microcopy bridge */}
          <motion.p
            className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground/60 mt-10"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Limited invitations. Endless resonance.
          </motion.p>
        </motion.div>
      </Container>
    </Section>
  );
};