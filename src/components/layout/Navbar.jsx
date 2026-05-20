import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, Search, ChevronDown } from 'lucide-react';
import { CONFIG } from '../../config';
import MobileMenu from './MobileMenu';
import { useCart } from '../../context/CartContext';
import { useReducedMotion } from '../../lib/motion';
import { useToast } from '../../context/ToastContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [currentLang, setCurrentLang] = useState('ar');
  
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { cartItemCount } = useCart();
  const { scrollY, scrollYProgress } = useScroll();
  const { showToast } = useToast();

  const toggleLanguage = () => {
    if (currentLang === 'ar') {
      setCurrentLang('en');
      showToast('English version is coming soon! | النسخة الإنجليزية تتوفر قريباً', 'info');
    } else {
      setCurrentLang('ar');
      showToast('تمت العودة إلى اللغة العربية بنجاح', 'success');
    }
  };

  // Track scroll position to trigger navbar styling transitions
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  // Upgraded Nav Links with Dropdown Support
  const navLinks = [
    { 
      label: 'المتجر', 
      path: '/shop',
      subLinks: [
        { label: 'وصل حديثاً', path: '/shop' },
        { label: 'الأكثر مبيعاً', path: '/shop' },
        { label: 'الكل', path: '/shop' },
      ]
    },
    { label: 'المجموعات', path: '/shop' },
    { label: 'عن العلامة', path: '/about' },
    { label: 'تواصل معنا', path: '/contact' }
  ];

  return (
    <>
      <div
        className="fixed top-0 inset-x-0 z-[900] flex flex-col pt-safe-area-top"
      >
       

        {/* Main Navbar */}
        <div 
          className={`transition-all duration-500 text-jet ${
            isScrolled 
              ? 'bg-ivory/95 backdrop-blur-lg py-2.5 border-b border-gold/20 shadow-[0_4px_30px_rgba(212,175,55,0.05)]' 
              : 'bg-ivory/80 backdrop-blur-md py-4 border-b border-gold/10 shadow-[0_2px_20px_rgba(212,175,55,0.02)]'
          }`}
        >
          <div className="container mx-auto px-4 md:px-8 flex items-center justify-between relative">

            {/* Mobile Menu Toggle & Search */}
            <div className="flex items-center gap-1 md:hidden flex-1">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-3 -ms-3 rounded-none hover:bg-gold/5 transition-colors focus:outline-none"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-none hover:bg-gold/5 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2 flex-1">
              {navLinks.map((link) => {
                const isActive = location.pathname.includes(link.path);
                const hasSubLinks = Boolean(link.subLinks);

                return (
                  <div 
                    key={`${link.label}-${link.path}`}
                    className="relative"
                    onMouseEnter={() => setHoveredMenu(link.path)}
                    onMouseLeave={() => setHoveredMenu(null)}
                  >
                    <Link
                      to={link.path}
                      className={`relative px-5 py-2 flex items-center gap-1 font-sans text-xs font-semibold transition-colors duration-300 rounded-none ${
                        isActive ? 'text-gold' : 'text-charcoal hover:text-gold'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="active-nav-pill"
                          className="absolute inset-0 bg-gold/[0.04] border border-gold/25 rounded-none"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                      {hasSubLinks && (
                        <ChevronDown className="w-3.5 h-3.5 relative z-10" />
                      )}
                    </Link>

                    {/* Animated Dropdown Menu */}
                    {hasSubLinks && (
                      <AnimatePresence>
                        {hoveredMenu === link.path && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                            className="absolute top-full start-0 pt-4 w-52 z-[999]"
                          >
                            <div className="bg-ivory/95 backdrop-blur-md rounded-none shadow-[0_15px_40px_rgba(212,175,55,0.06)] border border-gold/15 py-2.5 overflow-hidden flex flex-col">
                              {link.subLinks.map(sub => (
                                <Link
                                  key={`${sub.label}-${sub.path}`}
                                  to={sub.path}
                                  className="px-5 py-3 text-xs text-charcoal hover:bg-gold/[0.03] hover:text-gold transition-all duration-200 font-sans font-semibold border-s-2 border-transparent hover:border-gold"
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Logo */}
            <Link to="/" className="flex-1 flex justify-center shrink-0 outline-none relative z-10">
              <motion.img
                whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                src="/logo.png"
                alt={CONFIG.brandName}
                className="h-10 md:h-14 w-auto object-contain transition-transform"
                draggable={false}
              />
            </Link>

            {/* Desktop Actions (Search, User, Cart) */}
            <div className="flex items-center justify-end gap-1 md:gap-3 flex-1">
              <button className="hidden md:flex p-2 rounded-full hover:bg-jet/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50">
                <Search className="w-5 h-5" />
              </button>
              
              <button 
                onClick={toggleLanguage}
                className="hidden md:flex font-serif text-[10px] font-bold tracking-widest px-3 py-1.5 border border-gold/10 hover:border-gold/30 bg-gold/[0.02] text-jet hover:text-gold transition-all duration-300 rounded-none shadow-sm items-center gap-1 select-none focus:outline-none"
              >
                <span className={currentLang === 'ar' ? 'text-gold' : 'text-charcoal/50'}>العربية</span>
                <span className="text-gold/20">|</span>
                <span className={currentLang === 'en' ? 'text-gold font-sans' : 'text-charcoal/50 font-sans'}>EN</span>
              </button>

              <Link
                to="/cart"
                className="relative p-3 group rounded-full hover:bg-jet/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
                aria-label="View cart"
              >
                <ShoppingBag className="w-5 h-5 group-hover:text-gold transition-colors" />
                <AnimatePresence>
                  {cartItemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute -top-1 -end-1 bg-gold text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center font-sans shadow-sm ring-2 ring-ivory"
                    >
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>

          </div>
          
          {/* Scroll Progress Bar */}
          <motion.div 
            className="absolute bottom-0 inset-x-0 h-[2px] bg-gold origin-left"
            style={{ scaleX: scrollYProgress }}
          />
        </div>
      </div>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
      />
    </>
  );
};

export default Navbar;