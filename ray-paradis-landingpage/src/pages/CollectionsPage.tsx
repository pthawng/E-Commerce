import React, { useState } from "react";
import { motion } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import jewelryNecklace from '@/assets/jewelry-necklace.jpg';
import jewelryRing from '@/assets/jewelry-ring.jpg';
import jewelryEarrings from '@/assets/jewelry-earrings.jpg';
import jewelryBracelet from '@/assets/jewelry-bracelet.jpg';

// Mock data based on the luxurious jewelry theme
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Celestial Aura Necklace",
    price: "$42,500",
    category: "Necklace",
    image: jewelryNecklace,
    isNew: true,
  },
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
    isNew: true,
  },
  {
    id: "4",
    name: "Empire Gold Bracelet",
    price: "$28,900",
    category: "Bracelet",
    image: jewelryBracelet,
  },
  {
    id: "5",
    name: "Solstice Diamond Studs",
    price: "$12,400",
    category: "Earrings",
    image: jewelryEarrings,
  },
  {
    id: "6",
    name: "Lumina Pearl Strand",
    price: "$18,500",
    category: "Necklace",
    image: jewelryNecklace,
  },
  {
    id: "7",
    name: "Stellar Sapphire Ring",
    price: "$34,200",
    category: "Ring",
    image: jewelryRing,
  },
  {
    id: "8",
    name: "Ethereal Link Bracelet",
    price: "$9,800",
    category: "Bracelet",
    image: jewelryBracelet,
  },
];

import { Layout } from "@/components/layout/Layout";

export const CollectionsPage = () => {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <Layout>
      <div className="pt-28 sm:pt-32">
        {/* Header Section */}
        <Section padding="sm" className="bg-secondary/20">
          <Container className="text-center">
            <motion.p
              className="font-body text-[10px] uppercase tracking-ultra text-muted-foreground mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              The Collection
            </motion.p>
            <motion.h1
              className="font-display text-4xl sm:text-5xl lg:text-7xl text-primary italic font-normal tracking-luxury mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              Legacy & <span className="text-primary/80">Innovation</span>
            </motion.h1>
          </Container>
        </Section>

        {/* Filter / Sort Bar */}
        <div className="sticky top-20 sm:top-24 z-30 bg-background/80 backdrop-blur-xl border-y border-border/10">
          <Container className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-8">
              <button className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest text-primary/80 hover:text-gold transition-colors">
                <SlidersHorizontal className="w-3 h-3" />
                Filters
              </button>
              <nav className="hidden md:flex items-center gap-8">
                {["All", "Rings", "Necklaces", "Earrings", "Bracelets"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "font-body text-[10px] uppercase tracking-widest transition-all pb-1 border-b",
                      activeFilter === filter
                        ? "text-primary border-gold"
                        : "text-muted-foreground border-transparent hover:text-primary"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="font-body text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">
                {MOCK_PRODUCTS.length} Items
              </span>
              <button className="flex items-center gap-1 font-body text-[10px] uppercase tracking-widest text-primary/80 hover:text-gold transition-colors">
                Sort by
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </Container>
        </div>

        {/* Product Grid */}
        <Section padding="lg">
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
              {MOCK_PRODUCTS.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (index % 4) * 0.1 }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </div>
            
            {/* Pagination/Load More */}
            <div className="mt-24 text-center">
              <Button variant="outline" size="lg" className="rounded-full px-16">
                Reveal More
              </Button>
              <p className="mt-8 font-body text-[10px] uppercase tracking-ultra text-muted-foreground/60">
                Showing 8 of 42 treasures.
              </p>
            </div>
          </Container>
        </Section>
      </div>
    </Layout>
  );
};
