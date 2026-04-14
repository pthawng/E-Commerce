import { motion } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useOverlapInView from '@/hooks/useOverlapInView';
import SplitReveal from '@/components/effects/SplitReveal';
import { sectionVariants, stagger as tokenStagger, durations, easing } from '@/components/effects/motionTokens';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/hooks/useTranslation';
import { mapProductToCardProps } from '@/features/products/utils/productMapper';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { analytics } from '@/lib/analytics';

export const CuratedFavoritesSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.20, { once: true });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);

  const { language, formatPrice } = useStore();
  const { t } = useTranslation();

  // Fetch Featured Products (Real Backend Data)
  const { data: productResponse, isLoading } = useProducts({
    isFeatured: true,
    limit: 6
  });

  const products = useMemo(() => {
    const allProducts = productResponse?.pages.flatMap(page => page.data) || [];
    return allProducts.map(p => mapProductToCardProps(p, language, formatPrice));
  }, [productResponse?.pages, language, formatPrice]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const count = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
      setPages(count);
      setCurrentPage((p) => Math.min(p, count - 1));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isInView, products.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf: number | null = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const page = Math.round(el.scrollLeft / el.clientWidth);
        setCurrentPage(page);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Section id="curated" padding="lg" withHairline="top" className="bg-secondary/30 overflow-hidden">
      <Container>
        {/* Header */}
        <motion.div
          ref={ref}
          className="text-center mb-16 sm:mb-24"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={sectionVariants}
          transition={{ duration: durations.section, ease: easing }}
        >
          <p className="font-body text-xs uppercase tracking-ultra text-muted-foreground mb-6">
            {t('home.featured.subtitle')}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary tracking-luxury font-normal">
            <SplitReveal lines={[`<span class="italic text-primary/90">${t('home.featured.title')}</span>`]} stagger={0.12} />
          </h2>
        </motion.div>

        {/* Horizontal Scroll Container - Constrained for "Boutique" feel */}
        <div className="max-w-6xl mx-auto relative group/carousel">
          <div
            ref={scrollRef}
            className="flex gap-8 lg:gap-12 overflow-x-auto snap-x snap-mandatory pb-12 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[300px] sm:w-[320px] lg:w-[350px] snap-center">
                   <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-5 shadow-luxury border border-primary/5">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <div className="text-center space-y-1">
                    <Skeleton className="mx-auto h-2.5 w-16" />
                    <Skeleton className="mx-auto h-7 w-40" />
                    <Skeleton className="mx-auto h-3.5 w-12" />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
               <div className="flex-grow py-20 text-center col-span-full">
                  <p className="font-body text-xs uppercase tracking-ultra text-muted-foreground opacity-40">
                    {t('common.loading')}
                  </p>
               </div>
            ) : (
                products.map((product, index) => (
                <Link 
                  key={product.id}
                  to={`/product/${product.slug}`}
                  onClick={() => analytics.track('nav_click', { section: 'Featured Product', name: product.name })}
                  className="flex-shrink-0 w-[300px] sm:w-[320px] lg:w-[350px] snap-center group cursor-pointer block"
                >
                  <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={sectionVariants}
                    transition={{ duration: durations.section, ease: easing, delay: index * tokenStagger.desktop }}
                  >
                    {/* Image Container - Full Bleed Square Symmetry */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-5 shadow-luxury transition-all duration-700 hover:shadow-xl group-hover:-translate-y-1 border border-primary/5">
                      <div className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-0">
                        <div className="absolute inset-0 bg-gradient-radial from-gold/10 via-gold/5 to-transparent blur-3xl" />
                      </div>
                      
                      <motion.img
                        src={product.image}
                        alt={product.name}
                        className="relative z-10 w-full h-full object-cover transition-transform duration-1000 ease-luxury group-hover:scale-105"
                      />
                      
                      <div className="holo-shimmer" />
                      <div className="absolute inset-0 z-20 bg-gradient-to-t from-background/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
  
                    {/* Product Info - Tightened Typography */}
                    <div className="text-center">
                      <p className="font-body text-[9px] uppercase tracking-ultra text-muted-foreground/60 mb-2">
                        {product.category}
                      </p>
                      <h3 className="font-display text-xl sm:text-2xl text-primary mb-1.5 font-normal italic tracking-wide">
                        {product.name}
                      </h3>
                      <p className="font-body text-sm text-primary/60 font-medium">
                        {product.price}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>

          {/* Navigation Arrows - Precisely Aligned to Image Center */}
          <div className="hidden lg:block">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous"
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                analytics.track('nav_click', { section: 'Featured Carousel', action: 'prev' });
              }}
              className="absolute -left-12 top-[160px] sm:top-[175px] -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 shadow-sm border-hairline hover:bg-background z-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next"
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                analytics.track('nav_click', { section: 'Featured Carousel', action: 'next' });
              }}
              className="absolute -right-12 top-[160px] sm:top-[175px] -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 shadow-sm border-hairline hover:bg-background z-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-center gap-3 mt-4">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === currentPage ? 'bg-primary w-6' : 'bg-primary/20'}`}
              />
            ))}
          </div>

          {/* View All - Synced with Brand Design System */}
          <div className="mt-20 text-center">
            <Button 
              asChild 
              variant="luxury" 
              size="lg"
              className="min-w-[200px]"
              onClick={() => analytics.track('nav_click', { section: 'Featured Section', action: 'view_all' })}
            >
              <Link to="/collections">
                {t('home.featured.more')}
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
};