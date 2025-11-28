'use client';
import { motion, Variants } from 'framer-motion'; // Import thêm type Variants cho chuẩn

interface Props {
  subtitle?: string;
  title: string;
  description: string;
  ctaText: string;
}

// === SỬA Ở ĐÂY ===
// Thêm : Variants để định danh kiểu
// Thêm 'as const' vào mảng ease
const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      // TypeScript sẽ hiểu đây là Tuple cố định [0.16, 1, 0.3, 1]
      ease: [0.16, 1, 0.3, 1] as const 
    } 
  }
};

export default function HighlightContent({ subtitle, title, description, ctaText }: Props) {
  return (
    <motion.div 
      className="flex w-full flex-col items-center text-center md:w-1/2 md:items-start md:text-left"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        visible: { transition: { staggerChildren: 0.15 } }
      }}
    >
      {/* ... Phần render giữ nguyên ... */}
      {subtitle && (
        <motion.span variants={fadeUpVariant} className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
          {subtitle}
        </motion.span>
      )}

      <motion.h2 variants={fadeUpVariant} className="mb-6 font-serif text-4xl text-gray-900 md:text-5xl lg:text-6xl">
        {title}
      </motion.h2>

      <motion.p variants={fadeUpVariant} className="mb-8 max-w-md text-lg font-light leading-relaxed text-gray-600">
        {description}
      </motion.p>

      <motion.button 
        variants={fadeUpVariant}
        className="group relative border-b border-black pb-1 text-sm font-semibold uppercase tracking-widest text-black transition-colors hover:text-gray-600 hover:border-gray-600"
      >
        {ctaText}
      </motion.button>
    </motion.div>
  );
}