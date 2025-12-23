import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = {
    collections: [
      { label: t.footer.rings, href: '#' },
      { label: t.footer.necklaces, href: '#' },
      { label: t.footer.bracelets, href: '#' },
      { label: t.footer.earrings, href: '#' },
    ],
    about: [
      { label: t.footer.story, href: '#heritage' },
      { label: t.footer.craftsmanship, href: '#' },
      { label: t.footer.boutiques, href: '#' },
      { label: t.footer.careers, href: '#' },
    ],
    contact: [
      { label: t.footer.customerCare, href: '#' },
      { label: t.footer.bookAppointment, href: '#' },
      { label: t.footer.sizeGuide, href: '#' },
    ],
    legal: [
      { label: t.footer.privacy, href: '#' },
      { label: t.footer.terms, href: '#' },
    ],
  };

  return (
    <footer className="bg-secondary/50">
      {/* Hairline top border */}
      <div className="hairline" />
      
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        {/* Main Footer */}
        <div className="py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 lg:gap-16">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1 mb-4 lg:mb-0">
              <motion.h3
                className="font-display text-lg sm:text-xl tracking-luxury text-primary mb-4 font-normal"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                RAY PARADIS
              </motion.h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed tracking-wide max-w-xs">
                {t.footer.tagline}
              </p>
            </div>

            {/* Collections */}
            <div>
              <h4 className="font-body text-2xs uppercase tracking-ultra text-foreground mb-5 sm:mb-6">
                {t.footer.collections}
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {footerLinks.collections.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-body text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-500 tracking-wide"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="font-body text-2xs uppercase tracking-ultra text-foreground mb-5 sm:mb-6">
                {t.footer.about}
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {footerLinks.about.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-body text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-500 tracking-wide"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-body text-2xs uppercase tracking-ultra text-foreground mb-5 sm:mb-6">
                {t.footer.contact}
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {footerLinks.contact.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-body text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-500 tracking-wide"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-body text-2xs uppercase tracking-ultra text-foreground mb-5 sm:mb-6">
                {t.footer.legal}
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-body text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors duration-500 tracking-wide"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="hairline" />
        <div className="py-6 sm:py-8">
          <p className="font-body text-2xs sm:text-xs text-center text-muted-foreground/60 tracking-wider">
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};
