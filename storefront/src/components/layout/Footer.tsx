import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';
import { Link } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { LocaleSelector } from '@/components/ui/LocaleSelector';
import { CurrencySelector } from '@/components/ui/CurrencySelector';

export const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = {
    collections: [
      { label: t('common.footer.links.rings'), href: '#' },
      { label: t('common.footer.links.necklaces'), href: '#' },
      { label: t('common.footer.links.bracelets'), href: '#' },
      { label: t('common.footer.links.earrings'), href: '#' },
    ],
    about: [
      { label: t('common.footer.links.story'), href: '/#heritage' },
      { label: t('common.footer.links.craftsmanship'), href: '/#atelier' },
      { label: t('common.footer.links.boutiques'), href: '#' },
      { label: t('common.footer.links.careers'), href: '#' },
    ],
    contact: [
      { label: t('common.footer.links.customerCare'), href: '#' },
      { label: t('common.footer.links.bookAppointment'), href: '#' },
      { label: t('common.footer.links.artOfGifting'), href: '/art-of-gifting' },
    ],
    legal: [
      { label: t('common.footer.links.privacyPolicy'), href: '/privacy' },
      { label: t('common.footer.links.termsOfUse'), href: '/terms' },
      { label: t('common.footer.links.careService'), href: '/care-service' },
      { label: t('common.footer.links.sizeGuide'), href: '#' },
    ],
  };

  return (
    <Section as="footer" className="bg-secondary/20 py-12 md:py-16" withHairline="top">
      <Container>
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-16 pb-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <motion.h3
              className="font-display text-2xl tracking-luxury text-primary mb-6 font-normal"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              RAY PARADIS
            </motion.h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('common.footer.tagline')}
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-body text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-5">
              {t('common.footer.sections.collections')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.collections.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-5">
              {t('common.footer.sections.about')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-5">
              {t('common.footer.sections.contact')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.contact.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-body text-[10px] uppercase tracking-[0.2em] text-primary/80 mb-5">
              {t('common.footer.sections.legal')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={() => analytics.track('nav_click', { section: link.label, source: 'footer' })}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
              {t('common.footer.copyright')}
            </p>
            <div className="flex items-center gap-4">
              <LocaleSelector isOpaque={true} />
              <CurrencySelector isOpaque={true} />
            </div>
          </div>
          <div className="flex gap-8">
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 italic">
              Legacy in every facet.
            </span>
          </div>
        </div>
      </Container>
    </Section>
  );
};
