import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  interval?: number; // Shimmer interval in ms
  duration?: number; // Animation duration in ms
}

export const ShimmerText = ({ 
  children, 
  className = '',
  interval = 5000,
  duration = 1500
}: ShimmerTextProps) => {
  const [isShimmering, setIsShimmering] = useState(false);

  useEffect(() => {
    const triggerShimmer = () => {
      setIsShimmering(true);
      setTimeout(() => setIsShimmering(false), duration);
    };

    // Initial shimmer after a delay
    const initialTimeout = setTimeout(triggerShimmer, 2000);
    
    // Recurring shimmer
    const shimmerInterval = setInterval(triggerShimmer, interval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(shimmerInterval);
    };
  }, [interval, duration]);

  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <motion.span
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isShimmering ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <span 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-gold-shimmer/50 to-transparent"
          style={{
            animation: isShimmering ? `shimmer-sweep ${duration}ms ease-in-out` : 'none',
            maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
          }}
        />
      </motion.span>
    </span>
  );
};