import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../lib/motion';
import { CONFIG } from '../../config';

const CursorSpotlight = () => {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Smooth the mouse values
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (prefersReducedMotion || !CONFIG.enableCursorSpotlight) return;

    // Only enable on desktop
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 120); // 120 is half of width 240
      mouseY.set(e.clientY - 120);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, prefersReducedMotion]);

  if (prefersReducedMotion || !CONFIG.enableCursorSpotlight) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 w-[240px] h-[240px] pointer-events-none z-[9999] mix-blend-screen opacity-15 hidden md:block"
      style={{
        x: smoothX,
        y: smoothY,
        backgroundImage: 'url(/generated/ui/gold-radial-glow.webp)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    />
  );
};

export default CursorSpotlight;
