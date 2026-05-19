import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE, useReducedMotion } from '../../lib/motion';

const IntroAnimation = () => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem('introSeen') !== 'true';
  });
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef(null);

  const handleComplete = () => {
    setIsVisible(false);
    sessionStorage.setItem('introSeen', 'true');
  };

  // Fallback timeout in case video loading gets blocked or fails to fire onEnded
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(handleComplete, 6000); // 6 seconds safety duration
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.05 }}
          transition={{ duration: 0.8, ease: EASE.cinematic }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Looping or full play cinematic intro video */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onEnded={handleComplete}
            className="absolute inset-0 w-full h-full object-contain bg-black"
          >
            <source src="/intro.mov" type="video/quicktime" />
            <source src="/intro.mov" type="video/mp4" />
          </video>

          {/* Vignette dark overlay for luxury depth */}
          <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

          {/* Skip Button - positioned elegantly in the top corner */}
          <button
            onClick={handleComplete}
            className="absolute top-6 end-8 z-20 font-sans text-xs tracking-widest text-white/50 hover:text-gold hover:scale-105 active:scale-95 transition-all bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 uppercase"
          >
            تخطّى / Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
