import { motion } from "framer-motion";
import { useRef, useState } from "react";
import useOverlapInView from '@/hooks/useOverlapInView';
import { useTranslation } from "@/hooks/useTranslation";
import { useStore } from "@/store/useStore";
import featuredModel from "@/assets/featured-model.jpg";
import featuredNecklace from "@/assets/featured-necklace.png";

const products = [
  {
    id: 1,
    nameKey: "magicAlhambra",
    materials: "White Gold, Chalcedony, Mother-of-pearl",
    priceVND: 1064500000,
    variation: "+1 stone variation",
    image: featuredNecklace,
  },
  {
    id: 2,
    nameKey: "pearlEssence",
    materials: "Rose Gold, Diamond, Pearl",
    priceVND: 892000000,
    variation: "+2 stone variations",
    image: featuredNecklace,
  },
  {
    id: 3,
    nameKey: "celestialCharm",
    materials: "Yellow Gold, Onyx, Diamond",
    priceVND: 756000000,
    variation: "+1 stone variation",
    image: featuredNecklace,
  },
  {
    id: 4,
    nameKey: "royalGrace",
    materials: "Platinum, Sapphire, Diamond",
    priceVND: 1245000000,
    variation: "+3 stone variations",
    image: featuredNecklace,
  },
];

export const FeaturedProductSection = () => {
  const { t } = useTranslation();
  const { formatPrice } = useStore();
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.20, { once: true });
  const [activeIndex, setActiveIndex] = useState(0);

  const currentProduct = products[activeIndex];

  return (
    <section ref={ref} className="relative section-vertical">
      <div className="flex flex-col lg:flex-row min-h-[auto] lg:min-h-[80vh]">
        {/* Left Side - Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-8 lg:px-16 bg-background order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-sm sm:max-w-md text-center"
          >
            {/* Product Image */}
            <motion.div
              key={currentProduct.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 sm:mb-10"
            >
              <img
                src={currentProduct.image}
                alt={t.featured.products[currentProduct.nameKey as keyof typeof t.featured.products]?.name || "Featured Product"}
                className="w-48 sm:w-56 lg:w-64 h-auto mx-auto object-contain md:group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              />
            </motion.div>

            {/* Product Details */}
            <motion.h3
              key={`name-${currentProduct.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-lg sm:text-xl lg:text-2xl text-foreground mb-3 sm:mb-4 italic tracking-wide font-normal"
            >
              {t.featured.products[currentProduct.nameKey as keyof typeof t.featured.products]?.name || currentProduct.nameKey}
            </motion.h3>

            <motion.p
              key={`materials-${currentProduct.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground text-xs sm:text-sm mb-2 tracking-wide font-body"
            >
              {currentProduct.materials}
            </motion.p>

            <motion.p
              key={`price-${currentProduct.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-foreground font-medium mb-2 text-sm sm:text-base font-body"
            >
              {formatPrice(currentProduct.priceVND)}
            </motion.p>

            <motion.p
              key={`variation-${currentProduct.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-muted-foreground text-2xs sm:text-xs mb-6 sm:mb-8 tracking-wide font-body"
            >
              {currentProduct.variation}
            </motion.p>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 sm:gap-2.5 mb-6 sm:mb-8">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                    index === activeIndex
                      ? "bg-primary w-4 sm:w-5"
                      : "w-1.5 sm:w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                  }`}
                  aria-label={`View product ${index + 1}`}
                />
              ))}
            </div>

            {/* More Creations Link */}
            <motion.a
              href="#collection"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="inline-block text-primary text-2xs sm:text-xs tracking-ultra uppercase font-body underline-expand pb-1 cta-quiet"
            >
              {t.featured.moreCreations}
            </motion.a>
          </motion.div>
        </div>

        {/* Right Side - Model Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="w-full lg:w-1/2 relative h-[50vh] sm:h-[60vh] lg:h-auto lg:min-h-full order-1 lg:order-2"
        >
          <img
            src={featuredModel}
            alt="Model wearing luxury jewelry"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-background/20 via-transparent to-transparent" />
        </motion.div>
      </div>
      {/* Microcopy bridge → Curated */}
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="font-body text-xs text-muted-foreground mt-6 mb-10"
        >
          More configurations, same quiet language.
        </motion.p>
      </div>
    </section>
  );
};
