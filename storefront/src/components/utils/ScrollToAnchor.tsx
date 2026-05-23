import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Standard Scroll Manager
 * Handles DOM rendering offsets, sticky header heights,
 * hash toggling, and accessibility focus.
 */
export const ScrollToAnchor = () => {
  const { pathname, hash } = useLocation();
  const lastHash = useRef('');

  useEffect(() => {
    // SSR Guard
    if (typeof window === 'undefined') return;

    // Identify target element from hash
    const id = hash.replace('#', '');
    if (!id) return;

    const tryScroll = (attempts = 0) => {
      const element = document.getElementById(id);
      
      if (element) {
        // Calculate header offset dynamically
        const headerHeightStr = getComputedStyle(document.documentElement)
          .getPropertyValue('--header-height') || '80px';
        const headerHeight = parseInt(headerHeightStr, 10) || 80;
        
        // Luxury spacing buffer
        const buffer = 24; 
        const yOffset = - (headerHeight + buffer);
        
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

        // Perform smooth scroll
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });

        // Focus management for accessibility
        if (!element.getAttribute('tabindex')) {
          element.setAttribute('tabindex', '-1');
        }
        element.focus({ preventScroll: true });
        
        lastHash.current = hash;
      } else if (attempts < 20) {
        // Retry polling for async or lazy-loaded content
        setTimeout(() => tryScroll(attempts + 1), 100);
      }
    };

    tryScroll();
  }, [pathname, hash]);

  // Handle same-page hash click triggers
  useEffect(() => {
    const handleHashChange = () => {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
};

export default ScrollToAnchor;
