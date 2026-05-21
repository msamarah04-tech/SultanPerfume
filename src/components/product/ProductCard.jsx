import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../lib/format';
import { useReducedMotion } from '../../lib/motion';
import { ShoppingBag, Sparkles } from 'lucide-react';

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

const ProductCard = ({ product, variant = 'grid', offerId = 'summer-5-for-25' }) => {

  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState(0);

  const goToOffer = () => navigate(`/offer/${offerId}`, { state: { preSelectedProduct: product } });

  const startingPrice = Math.min(...product.sizes.map(s => s.price));
  const images = product.images?.length
    ? product.images
    : ['https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=400&auto=format&fit=crop'];
  const catStyle = CATEGORY_STYLE[product.category] || CATEGORY_STYLE.unisex;

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="w-full group"
      >
        <div className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-row overflow-hidden">
          {/* Image */}
          <Link to={`/product/${product.id}`} className="shrink-0 w-28 sm:w-36 bg-[#0e0e0e] relative">
            <div className="h-full aspect-[3/4]">
              <img
                src={images[activeImg]}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-contain p-2 sm:p-3"
              />
            </div>
            {product.stock <= 5 && product.stock > 0 && (
              <div className="absolute top-2 start-2 bg-gold text-black font-sans text-[8px] font-extrabold px-1.5 py-0.5 tracking-wider z-10">
                كمية محدودة
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute top-2 start-2 bg-white text-jet font-sans text-[8px] font-bold px-1.5 py-0.5 z-10">
                نفذت الكمية
              </div>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 min-w-0">
            <div>
              <Link to={`/product/${product.id}`} className="inline-block group/title">
                <h3 className="font-serif text-jet text-base sm:text-lg leading-tight group-hover/title:text-[#D4AF37] transition-colors duration-300 mb-0.5 line-clamp-2 relative">
                  {product.name}
                  <span className="absolute -bottom-1 ltr:left-0 rtl:right-0 h-[1px] bg-[#D4AF37] w-0 group-hover/title:w-full transition-all duration-[400ms] ease-out" />
                </h3>
              </Link>
              {product.brand && (
                <p className="font-sans text-[10px] text-gray-400 uppercase tracking-[0.18em] mb-2">{product.brand}</p>
              )}
              <span className={`inline-block font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${catStyle}`}>
                {CATEGORY_AR[product.category] || product.category}
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 flex flex-col gap-1.5">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-serif text-xl sm:text-2xl text-jet font-bold leading-none">
                  {formatPrice(startingPrice)}
                </span>
                <span className="font-sans text-[10px] text-gray-400">تبدأ من</span>
              </div>
              <Link
                to={`/product/${product.id}`}
                className="w-full bg-jet hover:bg-gold text-white hover:text-black font-sans text-[10px] font-extrabold uppercase tracking-[0.12em] px-3 py-2.5 flex items-center justify-center gap-1.5 transition-all duration-300"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                شراء العطر
              </Link>
              <button
                onClick={goToOffer}
                className="w-full bg-gold/8 hover:bg-gold border border-gold/25 hover:border-gold text-gold hover:text-white font-sans text-[10px] font-extrabold uppercase tracking-[0.12em] px-3 py-2.5 flex items-center justify-center gap-1.5 transition-all duration-300"
              >
                <Sparkles className="w-3.5 h-3.5" />
                أضف للعرض
              </button>
              <p className="font-sans text-[9px] text-red-600 text-center leading-snug pt-0.5">
                جميع العطور تركيب مطابقة للأصلية
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

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
                className="w-full h-full object-contain p-3 sm:p-5 transition-transform duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.05]"
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
        <div className="px-2.5 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-4 flex flex-col gap-2 sm:gap-3 flex-1">

          {/* Name */}
          <div>
            <Link to={`/product/${product.id}`} className="inline-block group/title">
              <h3 className="font-serif text-jet text-sm sm:text-[19px] leading-tight sm:leading-snug group-hover/title:text-[#D4AF37] transition-colors duration-300 relative">
                {product.name}
                <span className="absolute -bottom-1 ltr:left-0 rtl:right-0 h-[1px] bg-[#D4AF37] w-0 group-hover/title:w-full transition-all duration-[400ms] ease-out" />
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
            <span className="font-serif text-xl sm:text-[26px] text-jet font-bold leading-none">
              {formatPrice(startingPrice)}
            </span>
            <span className="font-sans text-[10px] text-gray-400">تبدأ من</span>
          </div>

          {/* CTA buttons */}
          <Link
            to={`/product/${product.id}`}
            className="w-full bg-jet hover:bg-gold text-white hover:text-black font-sans text-[11px] font-extrabold uppercase tracking-[0.15em] py-3.5 flex items-center justify-center gap-2 transition-all duration-300 group/btn"
          >
            <ShoppingBag className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:scale-110" />
            شراء العطر
          </Link>
          <button
            onClick={goToOffer}
            className="w-full bg-gold/[0.08] hover:bg-gold border border-gold/25 hover:border-gold text-gold hover:text-white font-sans text-[11px] font-extrabold uppercase tracking-[0.12em] py-3 flex items-center justify-center gap-2 transition-all duration-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            أضف للعرض
          </button>
          <p className="font-sans text-[10px] text-red-600 text-center leading-snug">
            جميع العطور تركيب مطابقة للأصلية
          </p>

        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
