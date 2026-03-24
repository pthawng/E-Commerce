import React, { useState } from "react";
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
  ChevronRight
} from "lucide-react";
import jewelryNecklace from '@/assets/jewelry-necklace.jpg';
import jewelryRing from '@/assets/jewelry-ring.jpg';
import jewelryEarrings from '@/assets/jewelry-earrings.jpg';

const PRODUCT = {
  id: "1",
  name: "Celestial Aura Necklace",
  price: "$42,500",
  description: "A masterwork of light and shadow, handcrafted for the defining moments of a lifetime. This piece features a cascade of sustainably sourced 15ct diamonds, set in GIA-certified 18k recycled gold.",
  materials: ["18k Yellow Gold", "White Gold", "Platinum"],
  sizes: ["40cm", "45cm", "50cm"],
  images: [jewelryNecklace, jewelryRing, jewelryEarrings],
  details: {
    craftsmanship: "Each link is hand-polished for over 40 hours by our master artisans in the Ray Paradis atelier.",
    shipping: "Complimentary secure courier shipping on all orders. Insured and signed-for delivery.",
    care: "Professional cleaning recommended annually. Store in a soft-lined jewelry box away from direct light."
  }
};

const RECOMMENDATIONS = [
  {
    id: "2",
    name: "Midnight Bloom Ring",
    price: "$8,200",
    category: "Ring",
    image: jewelryRing,
  },
  {
    id: "3",
    name: "Aurora Drops Earrings",
    price: "$15,400",
    category: "Earrings",
    image: jewelryEarrings,
  },
];

import { Layout } from "@/components/layout/Layout";

export const ProductDetailPage = () => {
  const [selectedMaterial, setSelectedMaterial] = useState(PRODUCT.materials[0]);
  const [selectedSize, setSelectedSize] = useState(PRODUCT.sizes[0]);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("craftsmanship");

  return (
    <Layout>
      <div className="pt-24 sm:pt-28">
        <Section padding="none">
          <Container>
            <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 items-start min-h-[calc(100vh-120px)]">
              
              {/* Left: Immersive Gallery */}
              <div className="w-full lg:w-[60%] space-y-8">
                {PRODUCT.images.map((img, i) => (
                  <motion.div
                    key={i}
                    className="aspect-[4/5] overflow-hidden rounded-xl bg-secondary/10"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                  >
                    <img 
                      src={img} 
                      alt={`${PRODUCT.name} view ${i + 1}`} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-[2000ms] cursor-zoom-in"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Right: Sticky Info Panel */}
              <div className="w-full lg:w-[40%] lg:sticky lg:top-32 space-y-12">
                <header className="space-y-4">
                  <p className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground">
                    High Jewelry / Necklaces
                  </p>
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary italic font-normal tracking-luxury leading-tight">
                    {PRODUCT.name}
                  </h1>
                  <p className="font-body text-2xl text-primary font-light">
                    {PRODUCT.price}
                  </p>
                </header>

                <div className="space-y-10">
                  <p className="font-body text-base text-muted-foreground leading-relaxed max-w-sm">
                    {PRODUCT.description}
                  </p>

                  {/* Variant Selector */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <span className="font-body text-[10px] uppercase tracking-widest text-primary/60">
                        Material: <span className="text-primary">{selectedMaterial}</span>
                      </span>
                      <div className="flex gap-4">
                        {PRODUCT.materials.map((m) => (
                          <button
                            key={m}
                            onClick={() => setSelectedMaterial(m)}
                            className={cn(
                              "w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center p-1",
                              selectedMaterial === m 
                                ? "border-gold shadow-luxury" 
                                : "border-border/10 hover:border-border/40"
                            )}
                          >
                            <div className={cn(
                              "w-full h-full rounded-full",
                              m.includes("Yellow") ? "bg-[#E6C200]" : 
                              m.includes("White") ? "bg-[#E5E4E2]" : "bg-[#D9D9D9]"
                            )} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="font-body text-[10px] uppercase tracking-widest text-primary/60">
                        Length: <span className="text-primary">{selectedSize}</span>
                      </span>
                      <div className="flex gap-3">
                        {PRODUCT.sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={cn(
                              "px-4 h-10 rounded-xl border text-[10px] uppercase tracking-widest transition-all duration-300",
                              selectedSize === s
                                ? "border-gold bg-gold/5 text-primary"
                                : "border-border/10 text-muted-foreground hover:border-border/40"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <div className="space-y-4 pt-4">
                    <Button variant="luxury" className="w-full h-14 group">
                      <span className="mr-2">Add to Collection</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <p className="text-center font-body text-[10px] text-muted-foreground tracking-wide">
                      Complimentary White-Glove Delivery
                    </p>
                  </div>

                  {/* Info Tabs / Accordion */}
                  <div className="space-y-1 border-t border-border/10 pt-8">
                    {[
                      { id: "craftsmanship", label: "The Craftsmanship", content: PRODUCT.details.craftsmanship, icon: ShieldCheck },
                      { id: "shipping", label: "Delivery & Returns", content: PRODUCT.details.shipping, icon: Truck },
                      { id: "care", label: "Care Guide", content: PRODUCT.details.care, icon: RotateCcw },
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
        <Section padding="lg" withHairline="top">
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
              {RECOMMENDATIONS.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </Container>
        </Section>
      </div>
    </Layout>
  );
};
