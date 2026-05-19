import { useReducedMotion as framerUseReducedMotion } from 'framer-motion';

export const EASE = {
  standard: [0.22, 1, 0.36, 1],
  cinematic: [0.65, 0, 0.35, 1],
  gentle: [0.4, 0, 0.2, 1],
};

export const DURATION = {
  micro: 0.2,
  standard: 0.45,
  cinematic: 0.9,
};

export const STAGGER = 0.07;

export const useReducedMotion = () => {
  return framerUseReducedMotion();
};

export const isRTL = () =>
  typeof document !== 'undefined' && document.dir === 'rtl';

export const getFadeUp = (prefersReducedMotion) => ({
  hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.standard, ease: EASE.standard } },
});

export const getFadeIn = () => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.standard, ease: EASE.standard } },
});

export const getStaggerContainer = () => ({
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
});
