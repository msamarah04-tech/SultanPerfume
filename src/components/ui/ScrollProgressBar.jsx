import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../lib/motion';

const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[10000] origin-left"
      style={{ 
        scaleX,
        backgroundImage: 'url(/generated/ui/gold-foil.webp)',
        backgroundSize: 'cover'
      }}
    />
  );
};

export default ScrollProgressBar;
