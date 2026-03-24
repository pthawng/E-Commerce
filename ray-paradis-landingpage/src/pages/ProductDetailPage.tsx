import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/ProductCard";
import { 
  Plus, 
  Minus, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  ArrowLeft
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useProduct, useProducts } from "@/features/products/hooks/useProducts";
import { useStore } from "@/store/useStore";
import { getLocalized, mapProductToCardProps } from "@/features/products/utils/productMapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, formatPrice } = useStore();
  const [activeAccordion, setActiveAccordion] = useState<string | null>("craftsmanship");

  // Fetch Main Product
  const { data: product, isLoading, isError, refetch } = useProduct(slug || "");

  // Fetch Recommendations (Same Category)
  const categoryId = product?.categories?.[0]?.category?.id;
  const { data: recommendationsRes } = useProducts({
    categoryId,
    limit: 4,
    // exclude current product if possible, but for now just 4
  });

  const recommendations = useMemo(() => {
    return (recommendationsRes?.data || [])
      .filter(p => p.id !== product?.id)
      .slice(0, 4)
      .map(p => mapProductToCardProps(p, language, formatPrice));
  }, [recommendationsRes?.data, product?.id, language, formatPrice]);

  // Variant State
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (product?.variants?.length && !selectedVariantId) {
       const defaultVar = product.variants.find(v => v.isDefault) || product.variants[0];
       setSelectedVariantId(defaultVar.id);
    }
  }, [product, selectedVariantId]);

  const selectedVariant = useMemo(() => {
    return product?.variants?.find(v => v.id === selectedVariantId) || product?.variants?.[0];
  }, [product, selectedVariantId]);

  if (isLoading) {
    return (
      <Layout forceHeaderOpaque={true}>
        <div className="pt-32 pb-20">
          <Container>
             <div className="flex flex-col lg:flex-row gap-16">
                <div className="w-full lg:w-[60%] space-y-8">
                  <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                </div>
                <div className="w-full lg:w-[40%] space-y-12">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-8 w-40" />
                  </div>
                  <Skeleton className="h-32 w-full" />
                  <div className="space-y-4">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                </div>
             </div>
          </Container>
        </div>
      </Layout>
    );
  }

  if (isError || !product) {
    return (
      <Layout forceHeaderOpaque={true}>
        <div className="pt-40 pb-40 text-center">
          <Container>
            <Alert className="max-w-md mx-auto border-destructive/20 bg-destructive/5 py-12">
              <ShoppingBag className="w-12 h-12 text-destructive/20 mx-auto mb-6" />
              <AlertTitle className="text-destructive font-display text-2xl mb-4 italic">Lost Treasure</AlertTitle>
              <AlertDescription className="text-destructive/80 font-body text-sm mb-8">
                We couldn't find the specific masterpiece you're looking for. It may have been curated away.
              </AlertDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Button variant="outline" onClick={() => refetch()} className="border-destructive/20">
                   <RefreshCw className="mr-2 h-4 w-4" /> Retry
                 </Button>
                 <Link to="/collections">
                   <Button variant="luxury">Discover Collection</Button>
                 </Link>
              </div>
            </Alert>
          </Container>
        </div>
      </Layout>
    );
  }

  const images = product.media?.length 
    ? product.media.map(m => m.url) 
    : [product.variants?.[0]?.media?.[0]?.url || ''];

  const priceFormatted = formatPrice(
    selectedVariant?.price || product.displayPriceMin || 0
  );

  return (
    <Layout forceHeaderOpaque={true}>
      <div className="pt-24 sm:pt-28">
        <Section padding="none">
          <Container>
             {/* Breadcrumb / Back */}
             <div className="mb-8">
                <Link to="/collections" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors group">
                   <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                   Back to Collection
                </Link>
             </div>

            <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 items-start min-h-[calc(100vh-120px)]">
              
              {/* Left: Immersive Gallery */}
              <div className="w-full lg:w-[60%] space-y-8">
                {images.map((img, i) => (
                  <motion.div
                    key={i}
                    className="aspect-[4/5] overflow-hidden rounded-xl bg-secondary/10"
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                  >
                    <img 
                      src={img} 
                      alt={`${getLocalized(product.name, language)} view ${i + 1}`} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2000ms] cursor-zoom-in"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Right: Sticky Info Panel */}
              <div className="w-full lg:w-[40%] lg:sticky lg:top-32 space-y-12 pb-20">
                <header className="space-y-4">
                  <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground">
                    High Jewelry / {getLocalized(product.categories?.[0]?.category?.name, language) || 'Necklaces'}
                  </p>
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary italic font-normal tracking-luxury leading-tight">
                    {getLocalized(product.name, language)}
                  </h1>
                  <p className="font-body text-2xl text-primary font-light">
                    {priceFormatted}
                  </p>
                </header>

                <div className="space-y-10">
                  <div className="font-body text-base text-muted-foreground leading-relaxed max-w-sm"
                    dangerouslySetInnerHTML={{ __html: getLocalized(product.description, language) || '' }}
                  />

                  {/* Variant Selector */}
                  {product.variants && product.variants.length > 1 && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <span className="font-body text-[10px] uppercase tracking-widest text-primary/60">
                          Selection: <span className="text-primary">
                            {getLocalized(selectedVariant?.variantTitle, language) || 'Default'}
                          </span>
                        </span>
                        <div className="flex flex-wrap gap-4">
                          {product.variants.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => setSelectedVariantId(v.id)}
                              className={cn(
                                "px-4 h-12 rounded-xl border text-[10px] uppercase tracking-widest transition-all duration-300",
                                selectedVariantId === v.id
                                  ? "border-gold bg-gold/5 text-primary shadow-luxury-soft"
                                  : "border-border/10 text-muted-foreground hover:border-border/40"
                              )}
                            >
                              {getLocalized(v.variantTitle, language) || 'Variant'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart */}
                  <div className="space-y-4 pt-4">
                    <Button variant="luxury" className="w-full h-14 group">
                      <span className="mr-2">Add to Collection</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <p className="text-center font-body text-[10px] text-muted-foreground tracking-wide">
                      GIA Certified / Handcrafted in Atelier
                    </p>
                  </div>

                  {/* Info Tabs / Accordion */}
                  <div className="space-y-1 border-t border-border/10 pt-8">
                    {[
                      { 
                        id: "craftsmanship", 
                        label: "The Craftsmanship", 
                        content: "Each masterpiece is meticulously hand-assembled by our master artisans, requiring over 40 hours of focused dedication to perfect every facet and link.", 
                        icon: ShieldCheck 
                      },
                      { 
                        id: "shipping", 
                        label: "Delivery & Returns", 
                        content: "Complimentary worldwide white-glove delivery. Insured and handled with the utmost care. Returns accepted within 14 days in original condition.", 
                        icon: Truck 
                      },
                      { 
                        id: "care", 
                        label: "Care Guide", 
                        content: "Clean gently with a soft cloth. We offer professional polishing and inspection services at our boutique to maintain the eternal radiance of your jewel.", 
                        icon: RotateCcw 
                      },
                    ].map((tab) => (
                      <div key={tab.id} className="border-b border-border/10 overflow-hidden">
                        <button 
                          onClick={() => setActiveAccordion(activeAccordion === tab.id ? null : tab.id)}
                          className="w-full flex items-center justify-between py-5 text-left group"
                        >
                          <span className="font-body text-xs uppercase tracking-widest text-primary/80 group-hover:text-primary transition-colors">
                            {tab.label}
                          </span>
                          <Plus className={cn("w-4 h-4 text-primary/40 transition-transform duration-500", activeAccordion === tab.id && "rotate-45")} />
                        </button>
                        <AnimatePresence>
                          {activeAccordion === tab.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <p className="pb-8 font-body text-sm text-muted-foreground leading-relaxed">
                                {tab.content}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Recommendation Section */}
        {recommendations.length > 0 && (
          <Section padding="lg" withHairline="top" className="bg-secondary/5">
            <Container>
              <div className="flex items-end justify-between mb-16">
                <div className="space-y-4">
                  <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground">
                    Digital Atelier
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl italic font-normal tracking-luxury text-primary">
                    Complete the Look
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {recommendations.map((p) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            </Container>
          </Section>
        )}
      </div>
    </Layout>
  );
};
