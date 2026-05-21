import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useReducedMotion, getStaggerContainer, getFadeUp, isRTL } from '../../lib/motion';

const MobileMenu = ({ isOpen, onClose, links }) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    onClose();
  }, [location.pathname, location.search, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key for keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const slideFrom = isRTL() ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-jet/60 backdrop-blur-sm z-[999] md:hidden"
          />
          <motion.div
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 start-0 bottom-0 w-4/5 max-w-sm bg-ivory shadow-2xl z-[1000] md:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
          >
            <div className="flex items-center justify-between p-6 border-b border-gold/20">
              <span className="font-serif text-xl">القائمة</span>
              <button
                onClick={onClose}
                aria-label="إغلاق القائمة"
                className="p-3 text-jet hover:text-gold transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <motion.nav
              variants={getStaggerContainer(0.05)}
              initial="hidden"
              animate="visible"
              className="flex flex-col p-6 gap-6 flex-grow"
            >
              {links.map((link) => (
                <motion.div key={`${link.label}-${link.path}`} variants={getFadeUp(prefersReducedMotion)}>
                  <Link
                    to={link.path}
                    className="font-sans text-sm text-jet hover:text-gold transition-colors block w-full py-2"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
