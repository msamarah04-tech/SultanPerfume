import { motion } from 'framer-motion';
import { EASE, DURATION, useReducedMotion } from '../../lib/motion';

const PageTransition = ({ children }) => {
  const prefersReducedMotion = useReducedMotion();

  const variants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    animate: { 
      opacity: 1, y: 0, 
      transition: { duration: DURATION.standard, ease: EASE.standard }
    },
    exit: { 
      opacity: 0, y: 0, 
      transition: { duration: 0.2, ease: EASE.standard }
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className="w-full flex-grow flex flex-col"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
