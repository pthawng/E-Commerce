import { motion } from 'framer-motion';
import { useRef } from 'react';
import useOverlapInView from '@/hooks/useOverlapInView';
import { useTranslation } from '@/hooks/useTranslation';

import ringImage from '@/assets/jewelry-ring.jpg';
import necklaceImage from '@/assets/jewelry-necklace.jpg';
import braceletImage from '@/assets/jewelry-bracelet.jpg';
import earringsImage from '@/assets/jewelry-earrings.jpg';
import tiaraImage from '@/assets/jewelry-tiara.jpg';
import broochImage from '@/assets/jewelry-brooch.jpg';

const jewelryItems = [
  { id: 'eternity', image: ringImage, size: 'tall' },
  { id: 'aurora', image: necklaceImage, size: 'normal' },
  { id: 'celestial', image: braceletImage, size: 'normal' },
  { id: 'empress', image: earringsImage, size: 'tall' },
  { id: 'sovereign', image: tiaraImage, size: 'normal' },
  { id: 'dynasty', image: broochImage, size: 'normal' },
] as const;

const CollectionItem = ({ 
  item, 
  index 
}: { 
  item: typeof jewelryItems[number]; 
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const { t } = useTranslation();

  const itemData = t.collection.items[item.id as keyof typeof t.collection.items];

  return (
    <motion.div
      ref={ref}
      className={`relative group cursor-pointer luxury-image-hover ${
        item.size === 'tall' ? 'sm:row-span-2' : ''
      }`}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        <img
          src={item.image}
          alt={itemData.name}
          className="w-full h-full object-cover transition-all duration-700 ease-out md:group-hover:scale-[1.02]"
        />
        
        {/* Soft inner glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-3 sm:inset-4 ring-1 ring-inset ring-primary/10 rounded-sm" />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 lg:p-8 xl:p-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-600 ease-luxury">
          <h3 className="font-display text-base sm:text-lg lg:text-xl xl:text-2xl text-foreground mb-1.5 sm:mb-2 tracking-wide font-normal">
            {itemData.name}
          </h3>
          <p className="font-body text-2xs sm:text-xs text-muted-foreground mb-3 sm:mb-4 lg:mb-5 leading-relaxed tracking-wide line-clamp-2">
            {itemData.description}
          </p>
          <span className="inline-block font-body text-2xs uppercase tracking-ultra text-primary underline-expand pb-1">
            {t.collection.viewDetails}
          </span>
        </div>
      </div>

      {/* Hairline border on hover */}
      <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/10 transition-colors duration-600 pointer-events-none" />
    </motion.div>
  );
};

export const CollectionSection = () => {
  const ref = useRef(null);
  const isInView = useOverlapInView(ref, 0.17, { once: true });
  const { t } = useTranslation();

  return (
    <section id="collection" className="bg-background section-vertical">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        {/* Section Header */}
        <motion.div
          ref={ref}
          className="text-center mb-12 sm:mb-16 lg:mb-24 xl:mb-28"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.p
            className="font-body text-2xs sm:text-xs uppercase tracking-ultra text-muted-foreground mb-4 sm:mb-5"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {t.collection.subtitle}
          </motion.p>
          <motion.h2
            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-primary tracking-wide font-normal"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {t.collection.title}
          </motion.h2>
          <motion.div
            className="h-px bg-primary/30 mx-auto mt-6 sm:mt-8"
            initial={{ width: 0 }}
            animate={isInView ? { width: 48 } : {}}
            transition={{ delay: 0.5, duration: 1 }}
          />
        </motion.div>

        {/* Grid - 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
          {jewelryItems.map((item, index) => (
            <CollectionItem key={item.id} item={item} index={index} />
          ))}
        </div>
        {/* Microcopy bridge → Atelier */}
        <div className="text-center mt-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.9 }}
            className="font-body text-xs text-muted-foreground"
          >
            Each form follows care.
          </motion.p>
        </div>
      </div>
    </section>
  );
};
