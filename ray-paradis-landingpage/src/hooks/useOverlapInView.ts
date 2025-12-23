import { useEffect, useState, type RefObject } from 'react';

export function useOverlapInView<T extends Element = Element>(
  ref: RefObject<T | null>,
  overlapPercent = 0.18,
  options?: { once?: boolean }
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref?.current;
    if (!node) return;

    // Respect prefers-reduced-motion: reveal immediately
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }

    const once = options?.once ?? true;
    const bottomOffset = Math.round(overlapPercent * 100);
    const rootMargin = `0px 0px -${bottomOffset}% 0px`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          }
        });
      },
      {
        root: null,
        rootMargin,
        threshold: 0,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [ref, overlapPercent, options]);

  return inView;
}

export default useOverlapInView;


