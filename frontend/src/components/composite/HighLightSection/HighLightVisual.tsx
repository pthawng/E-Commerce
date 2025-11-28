'use client'; // Cần interaction (hover) và animation
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Props {
  src: string;
  alt: string;
}

export default function HighlightVisual({ src, alt }: Props) {
  return (
    <motion.div 
      className="w-full md:w-1/2"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-1000 ease-out hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </motion.div>
  );
}