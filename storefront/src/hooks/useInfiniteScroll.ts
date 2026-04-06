import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  onIntersect: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * L7/L8 Standard Infinite Scroll Hook
 * Uses IntersectionObserver for efficient viewport monitoring.
 * Separates the trigger logic from the rendering logic.
 */
export function useInfiniteScroll({
  onIntersect,
  hasNextPage,
  isFetchingNextPage,
  rootMargin = '400px', // Pre-fetch 400px before reaching the end
  threshold = 0.1,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onIntersect();
      }
    },
    [onIntersect, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    if (!targetRef.current) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin,
      threshold,
    });

    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersect, rootMargin, threshold]);

  return { targetRef };
}
