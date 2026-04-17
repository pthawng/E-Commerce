import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  onIntersect: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * L8+ Infinite Scroll Hook — Stable Observer Edition
 *
 * Key fix over naive implementations:
 * - Uses a `callbackRef` to keep the latest handler WITHOUT re-creating the
 *   IntersectionObserver on every render. Re-creating the observer causes a
 *   disconnect/reconnect cycle that can fire "intersecting" again mid-fetch → loop.
 * - The observer is created ONCE and lives for the component's lifetime.
 * - Guards: only calls onIntersect when hasNextPage AND not already fetching.
 */
export function useInfiniteScroll({
  onIntersect,
  hasNextPage,
  isFetchingNextPage,
  rootMargin = '200px', // Conservative: only pre-fetch when 200px away
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Stable ref that always holds the latest values — no re-mount needed
  const callbackRef = useRef({ onIntersect, hasNextPage, isFetchingNextPage });
  useEffect(() => {
    callbackRef.current = { onIntersect, hasNextPage, isFetchingNextPage };
  });

  // Create the observer ONCE and never recreate it
  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const { hasNextPage, isFetchingNextPage, onIntersect } = callbackRef.current;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onIntersect();
        }
      },
      { rootMargin, threshold }
    );

    observerRef.current.observe(node);

    return () => {
      observerRef.current?.disconnect();
    };
    // Intentionally only depends on rootMargin/threshold — observer lifecycle is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, threshold]);

  return { targetRef };
}

