import { useEffect, useRef } from 'react';

const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export const SpotlightCursor = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lastSpotElements = useRef<Set<Element>>(new Set());

  useEffect(() => {
    if (isTouchDevice()) return;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cursorEl = document.createElement('div');
    cursorEl.className = 'spotlight-cursor';
    document.body.appendChild(cursorEl);
    cursorRef.current = cursorEl;

    const moveHandler = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      // mark CSS variables for other effects
      document.documentElement.style.setProperty('--spot-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--spot-y', `${e.clientY}px`);
      // check elements under pointer and toggle highlight for .gold elements
      const elems = document.elementsFromPoint(e.clientX, e.clientY);
      const newSet = new Set<Element>();
      for (const el of elems) {
        if (!(el instanceof HTMLElement)) continue;
        if (el.closest && el.closest('[data-gold], .gold')) {
          const target = el.closest('[data-gold], .gold')!;
          newSet.add(target);
        }
      }
      // add class to new ones
      newSet.forEach((el) => {
        if (!lastSpotElements.current.has(el)) el.classList.add('is-spotlight');
      });
      // remove class from old ones not present anymore
      lastSpotElements.current.forEach((el) => {
        if (!newSet.has(el)) el.classList.remove('is-spotlight');
      });
      lastSpotElements.current = newSet;
    };

    window.addEventListener('mousemove', moveHandler);

    const loop = () => {
      const { x, y, tx, ty } = pos.current;
      // lerp to create smoothing
      pos.current.tx += (x - tx) * 0.18;
      pos.current.ty += (y - ty) * 0.18;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pos.current.tx - 100}px, ${pos.current.ty - 100}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', moveHandler);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastSpotElements.current.forEach((el) => el.classList.remove('is-spotlight'));
      cursorEl.remove();
    };
  }, []);

  return null;
};

export default SpotlightCursor;


