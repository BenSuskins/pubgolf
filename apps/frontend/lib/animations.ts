import { Variants, Transition } from 'framer-motion';

/**
 * Animation utilities for Framer Motion
 *
 * Provides reusable animation variants and transitions for consistent
 * animations throughout the app.
 */

// Transitions
export const transitions = {
  /** Fast, snappy animations */
  fast: { duration: 0.2, ease: 'easeOut' } as Transition,
  /** Standard animations */
  standard: { duration: 0.3, ease: 'easeInOut' } as Transition,
  /** Smooth, slower animations */
  smooth: { duration: 0.4, ease: 'easeInOut' } as Transition,
  /** Spring animations */
  spring: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  /** Bouncy spring */
  springBouncy: { type: 'spring', stiffness: 400, damping: 20 } as Transition,
};

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitions.fast,
  },
};

// Modal transitions
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.standard,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

// Overlay/backdrop transitions
export const overlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// Slide from top (for notifications)
export const slideFromTopVariants: Variants = {
  initial: {
    y: -100,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: transitions.spring,
  },
  exit: {
    y: -100,
    opacity: 0,
    transition: transitions.fast,
  },
};

// Slide from bottom (for bottom sheets)
export const slideFromBottomVariants: Variants = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: transitions.spring,
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: transitions.fast,
  },
};

// Stagger children animation
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.fast,
  },
};

// Scale in (for buttons, cards)
export const scaleInVariants: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: transitions.springBouncy,
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: transitions.fast,
  },
};

// Fade in (simple)
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Celebration/success variants
export const celebrationVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      duration: 0.6,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: transitions.fast,
  },
};

// Shake animation (for errors)
export const shakeVariants: Variants = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

// Pulse animation
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

/**
 * Helper to create a stagger delay for list items
 * @param index - Index of the item in the list
 * @param delay - Delay between each item (default: 0.05)
 */
export const getStaggerDelay = (index: number, delay: number = 0.05): number => {
  return index * delay;
};

/**
 * Helper to create a custom spring transition
 * @param stiffness - Spring stiffness (default: 300)
 * @param damping - Spring damping (default: 30)
 */
export const createSpring = (stiffness: number = 300, damping: number = 30): Transition => ({
  type: 'spring',
  stiffness,
  damping,
});
