import { motion } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import SplitReveal from '@/components/effects/SplitReveal';
import { sectionVariants, stagger as tokenStagger, durations, easing } from '@/components/effects/motionTokens';
import { Section } from '@/components/layout/Section';
import { Container } from '@/components/layout/Container';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useStore } from '@/store/useStore';
import { mapProductToCardProps } from '@/features/products/utils/productMapper';
import { Skeleton } from '@/components/ui/skeleton';

export const CuratedFavoritesSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.20, { once: true });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);

  const { language, formatPrice } = useStore();

  // Fetch Featured Products (Real Backend Data)
  const { data: productResponse, isLoading } = useProducts({
    isFeatured: true,
    limit: 6
  });

  const products = useMemo(() => {
    return (productResponse?.data || []).map(p => mapProductToCardProps(p, language, formatPrice));
  }, [productResponse?.data, language, formatPrice]);

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
            Curated Selection
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary tracking-luxury font-normal">
            <SplitReveal lines={[`<span class="italic text-primary/90">Favorites</span>`]} stagger={0.12} />
          </h2>
        </motion.div>

        {/* Horizontal Scroll Container */}
        <div className="relative -mx-6 sm:-mx-8 lg:-mx-16">
          <div
            ref={scrollRef}
            className="flex gap-8 lg:gap-12 overflow-x-auto snap-x snap-mandatory px-6 sm:px-8 lg:px-16 pb-12 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[85%] sm:w-1/2 lg:w-1/3 snap-center">
                   <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-8 shadow-luxury">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <div className="text-center space-y-2">
                    <Skeleton className="mx-auto h-3 w-20" />
                    <Skeleton className="mx-auto h-8 w-40" />
                    <Skeleton className="mx-auto h-4 w-15" />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
               <div className="flex-grow py-20 text-center col-span-full">
                  <p className="font-body text-xs uppercase tracking-ultra text-muted-foreground opacity-40">
                    Discovering treasures...
                  </p>
               </div>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="flex-shrink-0 w-[85%] sm:w-1/2 lg:w-1/3 snap-center group cursor-pointer"
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  variants={sectionVariants}
                  transition={{ duration: durations.section, ease: easing, delay: index * tokenStagger.desktop }}
                >
                  {/* Image Container with Glow Effect */}
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-8 shadow-luxury transition-all duration-700 hover:shadow-2xl">
                    <div className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-0">
                      <div className="absolute inset-0 bg-gradient-radial from-gold/20 via-gold/5 to-transparent blur-3xl" />
                    </div>
                    
                    <motion.img
                      src={product.image}
                      alt={product.name}
                      className="relative z-10 w-full h-full object-cover transition-transform duration-1000 ease-luxury group-hover:scale-105"
                    />
                    
                    <div className="holo-shimmer" />
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </div>

                  {/* Product Info */}
                  <div className="text-center">
                    <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground mb-3">
                      {product.category}
                    </p>
                    <h3 className="font-display text-2xl text-primary mb-2 font-normal italic tracking-wide">
                      {product.name}
                    </h3>
                    <p className="font-body text-sm text-primary/70 font-medium">
                      {product.price}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <button
            aria-label="Previous"
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
            }}
            className="hidden md:flex items-center justify-center absolute left-4 top-[40%] -translate-y-1/2 w-12 h-12 bg-background/80 backdrop-blur-md border border-hairline hover:bg-background rounded-full z-30 transition-all shadow-sm"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
            }}
            className="hidden md:flex items-center justify-center absolute right-4 top-[40%] -translate-y-1/2 w-12 h-12 bg-background/80 backdrop-blur-md border border-hairline hover:bg-background rounded-full z-30 transition-all shadow-sm"
          >
            ›
          </button>

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
        </div>
      </Container>
    </Section>
  );
};