import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotion } from '../../lib/motion';
import { CONFIG } from '../../config';

const CursorSpotlight = () => {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Smooth the mouse values
  const springConfig = { damping: 30, stiffness: 200, mass: 0.15 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (prefersReducedMotion || !CONFIG.enableCursorSpotlight) return;

    const checkDesktop = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      setIsDesktop(!isTouch && !isSmallScreen);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    if (!isDesktop) return () => window.removeEventListener('resize', checkDesktop);

    document.body.style.cursor = 'none';

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.getAttribute('role') === 'button' ||
        target.closest('button, a, [role="button"], .product-card')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('resize', checkDesktop);
    };
  }, [mouseX, mouseY, prefersReducedMotion, isDesktop]);

  if (prefersReducedMotion || !CONFIG.enableCursorSpotlight || !isDesktop) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border-2 border-white mix-blend-difference hidden md:block"
      animate={{
        width: isHovering ? 64 : 32,
        height: isHovering ? 64 : 32,
        x: '-50%',
        y: '-50%',
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
      style={{
        left: smoothX,
        top: smoothY,
        opacity: 0.8,
      }}
    />
  );
};

export default CursorSpotlight;
