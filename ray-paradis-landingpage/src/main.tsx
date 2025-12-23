import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Lenis smooth scroll integration (loaded dynamically to avoid bundling issues)
if (typeof window !== 'undefined' && !('ontouchstart' in window)) {
  (async () => {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      // @ts-expect-error - dynamic remote ESM import
      const mod: any = await import('https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.35/+esm');
      const Lenis = (mod as any).default ?? mod;
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
      // expose for debugging
      (window as any).__lenis = lenis;
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } catch (err) {
      // fail gracefully
    }
  })();
}