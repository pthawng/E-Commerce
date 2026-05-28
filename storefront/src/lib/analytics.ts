/**
 * Lightweight Analytics Utility for Ray Paradis
 * Designed for future integration with Google Tag Manager, Mixpanel, or custom Telemetry.
 */

type EventName = 
  | 'nav_click' 
  | 'legal_scroll_depth' 
  | 'newsletter_signup' 
  | 'product_view'
  | 'cart_add';

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export const trackEvent = (name: EventName, props?: EventProperties) => {
  void name;
  void props;

  // Future implementation:
  // if (window.gtag) {
  //   window.gtag('event', name, props);
  // }
};

export const analytics = {
  track: trackEvent
};
