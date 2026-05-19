import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../lib/format';
import { useReducedMotion } from '../../lib/motion';
import { ShoppingBag } from 'lucide-react';

const CATEGORY_AR = {
  men:    'رجالي',
  women:  'نسائي',
  unisex: 'للجنسين',
};

const CATEGORY_STYLE = {
  men:    'text-sky-600   bg-sky-50    border-sky-200',
  women:  'text-rose-600  bg-rose-50   border-rose-200',
  unisex: 'text-amber-700 bg-amber-50  border-amber-200',
};

const ProductCard = ({ product }) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeImg, setActiveImg] = useState(0);

  const startingPrice = Math.min(...product.sizes.map(s => s.price));
  const images = product.images?.length
    ? product.images
    : ['https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=400&auto=format&fit=crop'];
  const catStyle = CATEGORY_STYLE[product.category] || CATEGORY_STYLE.unisex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="w-full group"
    >
      <div className="bg-white border border-gray-100 shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] transition-shadow duration-500 overflow-hidden flex flex-col">

        {/* ── Image zone ──────────────────────────────────── */}
        <Link to={`/product/${product.id}`} className="block relative shrink-0">

          {/* Main image */}
          <div className="relative aspect-square bg-[#0e0e0e] overflow-hidden">
            <img
              src={images[activeImg]}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain p-5 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.06]"
            />

            {/* Stock badges */}
            {product.stock <= 5 && product.stock > 0 && (
              <div className="absolute top-3 start-3 bg-gold text-black font-sans text-[9px] font-extrabold px-2.5 py-1 tracking-wider z-10">
                كمية محدودة
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute top-3 start-3 bg-white text-jet font-sans text-[9px] font-bold px-2.5 py-1 z-10">
                نفذت الكمية
              </div>
            )}
          </div>

          {/* Thumbnail strip — only when multiple images */}
          {images.length > 1 && (
            <div className="flex gap-1.5 p-2 border-t border-gray-100 bg-white">
              {images.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setActiveImg(i); }}
                  className={`w-11 h-11 border-2 transition-all duration-200 overflow-hidden shrink-0 bg-[#0e0e0e] ${
                    activeImg === i
                      ? 'border-gold'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </Link>

        {/* ── Info zone ───────────────────────────────────── */}
        <div className="px-4 pt-4 pb-4 flex flex-col gap-3 flex-1">

          {/* Name */}
          <div>
            <Link to={`/product/${product.id}`}>
              <h3 className="font-serif text-jet text-[19px] leading-snug hover:text-gold transition-colors duration-300">
                {product.name}
              </h3>
            </Link>
            {product.brand && (
              <p className="font-sans text-[10px] text-gray-400 uppercase tracking-[0.18em] mt-0.5">
                {product.brand}
              </p>
            )}
          </div>

          {/* Category tag */}
          <span className={`w-fit font-sans text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border ${catStyle}`}>
            {CATEGORY_AR[product.category] || product.category}
          </span>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-auto pt-1 border-t border-gray-50">
            <span className="font-serif text-[26px] text-jet font-bold leading-none">
              {formatPrice(startingPrice)}
            </span>
            <span className="font-sans text-[10px] text-gray-400">تبدأ من</span>
          </div>

          {/* CTA button */}
          <Link
            to={`/product/${product.id}`}
            className="w-full bg-jet hover:bg-gold text-white hover:text-black font-sans text-[11px] font-extrabold uppercase tracking-[0.15em] py-3.5 flex items-center justify-center gap-2.5 transition-all duration-300 group/btn"
          >
            <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110" />
            اختر حجمك
          </Link>

        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
