import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion, getStaggerContainer, getFadeUp } from '../../lib/motion';
import { CONFIG } from '../../config';
import { Camera } from 'lucide-react';

const Footer = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <footer className="bg-jet text-white pt-16 pb-8 border-t border-gold/20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          variants={getStaggerContainer()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12"
        >

          {/* Brand */}
          <motion.div variants={getFadeUp(prefersReducedMotion)} className="flex flex-col items-center md:items-start text-center md:text-start">
            <Link to="/" className="font-serif text-3xl mb-4 text-gold">
              {CONFIG.brandName}
            </Link>
            <p className="font-sans text-sm text-gray-400 max-w-xs leading-loose">
              {CONFIG.tagline}. اكتشف مجموعتنا المختارة من العطور الفاخرة.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div variants={getFadeUp(prefersReducedMotion)} className="flex flex-col items-center md:items-start">
            <h4 className="font-sans font-semibold text-sm mb-6 text-gray-400">روابط سريعة</h4>
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/shop" className="hover:text-gold transition-colors">المتجر</Link>
              <Link to="/about" className="hover:text-gold transition-colors">عن العلامة</Link>
              <Link to="/contact" className="hover:text-gold transition-colors">تواصل معنا</Link>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div variants={getFadeUp(prefersReducedMotion)} className="flex flex-col items-center md:items-start">
            <h4 className="font-sans font-semibold text-sm mb-6 text-gray-400">التواصل</h4>
            <div className="flex flex-col gap-3 text-sm text-gray-300">
              <a href={`mailto:${CONFIG.contactEmail}`} className="hover:text-gold transition-colors">
                <bdi>{CONFIG.contactEmail}</bdi>
              </a>
              <a href={`tel:${CONFIG.contactPhone}`} className="hover:text-gold transition-colors">
                <bdi dir="ltr">{CONFIG.contactPhone}</bdi>
              </a>
            </div>
            <div className="flex gap-2 mt-6">
              {CONFIG.socials.instagram && (
                <a href={CONFIG.socials.instagram} target="_blank" rel="noreferrer" className="p-2 -m-2 text-gray-400 hover:text-gold transition-colors inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
                  <Camera className="w-5 h-5" />
                </a>
              )}
              {CONFIG.socials.tiktok && (
                <a href={CONFIG.socials.tiktok} target="_blank" rel="noreferrer" className="p-2 -m-2 text-gray-400 hover:text-gold transition-colors text-xs font-sans inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
                  TikTok
                </a>
              )}
              {CONFIG.socials.snapchat && (
                <a href={CONFIG.socials.snapchat} target="_blank" rel="noreferrer" className="p-2 -m-2 text-gray-400 hover:text-gold transition-colors text-xs font-sans inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
                  Snap
                </a>
              )}
            </div>
          </motion.div>

        </motion.div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-sans">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} {CONFIG.brandName}</p>
          <div className="flex gap-4">
            <Link to="/admin/login" className="hover:text-white transition-colors">لوحة الإدارة</Link>
          </div>
        </div>
        <p className="mt-4 text-center font-sans text-[11px] text-gray-600">
          في حال لم يتم استلام الطلب، يتم دفع أجور التوصيل.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
