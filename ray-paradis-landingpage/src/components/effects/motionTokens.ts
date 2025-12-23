export const easing = [0.33, 1, 0.68, 1] as const;

export const durations = {
  headline: 1.5,
  section: 1.0,
  micro: 0.26,
} as const;

export const stagger = {
  desktop: 0.15,
  mobile: 0.08,
} as const;

export const headlineLine = {
  hidden: { y: '100%', opacity: 0, rotateX: 6 },
  visible: {
    y: '0%',
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: durations.headline,
      ease: easing,
    },
  },
};

export const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.section,
      ease: easing,
    },
  },
};

export default {
  easing,
  durations,
  stagger,
  headlineLine,
  sectionVariants,
};


