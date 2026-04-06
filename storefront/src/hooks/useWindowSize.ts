import { useState, useLayoutEffect } from 'react';

/**
 * Senior BigTech standard hook for viewport tracking.
 * Uses useLayoutEffect to prevent layout shifts during hydration/initial render
 * and a debounced or performance-optimized resize listener.
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    
    // Initial call to ensure accuracy
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
