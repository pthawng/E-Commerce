import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * L8-Standard Scroll Manager
 * Handles asynchronous DOM rendering, sticky header offsets, 
 * same-page hash toggles, and accessibility focus.
 */
export const ScrollToAnchor = () => {
  const { pathname, hash } = useLocation();
  const lastHash = useRef('');

  useEffect(() => {
    // 1. SSR Guard
    if (typeof window === 'undefined') return;

    // 2. Identify Target ID
    const id = hash.replace('#', '');
    if (!id) return;

    // Prevent repeated scrolls if hash hasn't changed (standard router behavior)
    // unless we want to force scroll on same-page click (handled below)
    
    const tryScroll = (attempts = 0) => {
      const element = document.getElementById(id);
      
      if (element) {
        // 3. Calculate Header Offset Dynamically
        const headerHeightStr = getComputedStyle(document.documentElement)
          .getPropertyValue('--header-height') || '80px';
        const headerHeight = parseInt(headerHeightStr, 10) || 80;
        
        // Add a small buffer for aesthetic luxury spacing
        const luxuryBuffer = 24; 
        const yOffset = - (headerHeight + luxuryBuffer);
        
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

        // 4. Perform Smooth Scroll
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });

        // 5. Accessibility: Focus Management
        // Setting tabIndex to -1 allows non-focusable elements to receive focus
        if (!element.getAttribute('tabindex')) {
          element.setAttribute('tabindex', '-1');
        }
        element.focus({ preventScroll: true });
        
        lastHash.current = hash;
      } else if (attempts < 20) {
        // 6. Retry Mechanism (Polling for async/lazy content)
        setTimeout(() => tryScroll(attempts + 1), 100);
      }
    };

    tryScroll();
  }, [pathname, hash]);

  // 7. Same-page Hash Click Handling
  // Standard React Router <Link> doesn't re-trigger location change if hash is the same.
  // We listen to hashchange manually for this edge case.
  useEffect(() => {
    const handleHashChange = () => {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Re-trigger scroll logic
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
};

export default ScrollToAnchor;
