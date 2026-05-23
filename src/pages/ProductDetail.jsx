import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useReducedMotion, getStaggerContainer, getFadeUp } from '../lib/motion';
import { formatPrice } from '../lib/format';
import { resolveTieredLineTotal, describeTiers } from '../lib/pricing';
import PageTransition from '../components/layout/PageTransition';
import ProductCard from '../components/product/ProductCard';
import productsData from '../data/products.json';
import { getProducts } from '../lib/storage';
import { productsApi } from '../lib/api';
import { Minus, Plus, ShoppingBag, Zap } from 'lucide-react';

const CATEGORY_AR = {
  men: 'رجالي',
  women: 'نسائي',
  unisex: 'للجنسين',
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, globalPricing } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const imageScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;

    const hydrate = (p, allProducts) => {
      if (cancelled || !p) return;
      setProduct(p);
      setSelectedSize(p.sizes[0]);
      setQuantity(1);
      setActiveImage(0);
      const related = (allProducts || [])
        .filter(x => x.active && x.category === p.category && x.id !== p.id)
        .slice(0, 4);
      setRelatedProducts(related);
    };

    // 1) Synchronous paint from cache/seed if the product is already known.
    const allProducts = getProducts(productsData, (fresh) => {
      const found = fresh.find(p => p.id === id && p.active);
      if (found) hydrate(found, fresh);
    });
    const fromSeed = allProducts.find(p => p.id === id && p.active);
    if (fromSeed) hydrate(fromSeed, allProducts);

    // 2) Authoritative lookup against the API. Only 404 after the API confirms
    //    the product really doesn't exist — otherwise newly-created products
    //    would redirect to /404 on first navigation (before the cache catches up).
    productsApi.getById(id)
      .then(p => {
        if (cancelled) return;
        if (p && p.active) hydrate(p, allProducts);
        else navigate('/404');
      })
      .catch(err => {
        if (cancelled) return;
        if (err?.status === 404) navigate('/404');
        // Other errors: keep whatever we painted from seed/cache; no redirect.
      });

    return () => { cancelled = true; };
  }, [id, navigate]);

  if (!product) return null;

  const basePrice = selectedSize?.price ?? 0;
  const effectiveLineTotal = resolveTieredLineTotal(
    basePrice,
    quantity,
    product.quantityTiers,
    globalPricing,
  );
  const effectiveUnitPrice = quantity > 0 ? effectiveLineTotal / quantity : effectiveLineTotal;
  const tierLadder = describeTiers(basePrice, product.quantityTiers, globalPricing);
  const hasDiscount = effectiveUnitPrice < basePrice;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen pt-4 md:pt-8 pb-20">
        <div className="container mx-auto px-4 md:px-8">

          {/* Main Product Area */}
          <div className="flex flex-col md:flex-row gap-12 lg:gap-24 mb-24">

            {/* Gallery */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
                <motion.img
                  style={{ scale: prefersReducedMotion ? 1 : imageScale }}
                  src={product.images[activeImage] || 'https://via.placeholder.com/600x750?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-cover origin-center"
                />
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-20 aspect-[4/5] shrink-0 border transition-colors ${activeImage === idx ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <p className="font-sans text-xs text-gray-500 mb-4">
                {CATEGORY_AR[product.category] || product.category}
              </p>

              <h1 className="font-serif text-4xl md:text-5xl text-jet mb-4">
                {product.name}
              </h1>

              <p className="font-sans text-gray-600 leading-loose mb-10">
                {product.description}
              </p>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 pb-10 border-b border-gold/15">
                <div className="border border-gold/10 p-4 text-center bg-gold/[0.01]">
                  <h4 className="font-sans text-[10px] text-gold uppercase tracking-wider mb-2">مقدمة العطر</h4>
                  <p className="font-sans text-xs sm:text-sm font-semibold text-charcoal">{product.topNotes}</p>
                </div>
                <div className="border border-gold/10 p-4 text-center bg-gold/[0.01]">
                  <h4 className="font-sans text-[10px] text-gold uppercase tracking-wider mb-2">قلب العطر</h4>
                  <p className="font-sans text-xs sm:text-sm font-semibold text-charcoal">{product.heartNotes}</p>
                </div>
                <div className="border border-gold/10 p-4 text-center bg-gold/[0.01]">
                  <h4 className="font-sans text-[10px] text-gold uppercase tracking-wider mb-2">قاعدة العطر</h4>
                  <p className="font-sans text-xs sm:text-sm font-semibold text-charcoal">{product.baseNotes}</p>
                </div>
              </div>

              {/* Size selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-xs text-gray-500 uppercase tracking-widest">الحجم</span>
                  <span className="font-serif text-2xl text-gold font-bold flex items-baseline gap-2">
                    {formatPrice(Number(effectiveUnitPrice.toFixed(3)))}
                    {hasDiscount && (
                      <span className="font-sans text-sm text-gray-400 line-through">
                        {formatPrice(basePrice)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 border font-sans text-xs font-semibold transition-all duration-200 ${
                        selectedSize?.label === size.label
                          ? 'border-gold bg-gold text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gold/50 hover:text-gold'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100">
                <span className="font-sans text-xs text-gray-500 uppercase tracking-widest">الكمية</span>
                <div className="flex items-center border border-gray-200 bg-white">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-3 text-gray-400 hover:text-jet transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-sans text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-3 text-gray-400 hover:text-jet transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {tierLadder.length > 0 && (
                <div className="mb-8 border border-gold/20 bg-gold/[0.04] p-4">
                  <p className="font-sans text-xs font-bold text-gold tracking-wider mb-3">
                    خصومات الكمية
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {tierLadder.map((t, i) => (
                      <li
                        key={i}
                        className={`flex items-baseline justify-between gap-2 px-3 py-2 border ${
                          quantity >= t.minQty ? 'border-gold bg-white' : 'border-gold/15 bg-white/60'
                        }`}
                      >
                        <span className="font-sans text-xs text-gray-600">
                          اشترِ {t.minQty}
                        </span>
                        <span className="flex items-baseline gap-1">
                          <span className="font-serif text-sm font-bold text-jet">
                            {formatPrice(Number(t.lineTotal.toFixed(3)))}
                          </span>
                          {t.savingsPercent > 0 && (
                            <span className="font-sans text-[10px] text-gold font-bold">
                              -{t.savingsPercent}%
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-gold hover:bg-gold/90 text-white font-sans text-sm font-extrabold uppercase tracking-[0.15em] py-4 flex items-center justify-center gap-2.5 transition-all duration-300"
                >
                  <Zap className="w-4 h-4" />
                  اشتر الآن
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-jet hover:bg-jet/80 text-white font-sans text-sm font-extrabold uppercase tracking-[0.15em] py-4 flex items-center justify-center gap-2.5 transition-all duration-300"
                >
                  <ShoppingBag className="w-4 h-4" />
                  أضف إلى السلة
                </button>
              </div>

            </div>
          </div>

          {/* Custom Sections */}
          {product.sections && product.sections.length > 0 && (
            <div className="mb-24">
              <motion.div
                variants={getStaggerContainer()}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-10%" }}
                className="flex flex-col gap-px border-t border-gold/15"
              >
                {product.sections.map((section, idx) => (
                  <motion.div
                    key={idx}
                    variants={getFadeUp(prefersReducedMotion)}
                    className="border-b border-gold/15 py-10"
                  >
                    {section.title && (
                      <h3 className="font-serif text-2xl text-jet mb-4">{section.title}</h3>
                    )}
                    <p className="font-sans text-gray-600 leading-loose whitespace-pre-line">{section.content}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="pt-20 border-t border-gold/30">
              <h2 className="font-serif text-3xl text-jet mb-12 text-center">قد يعجبك أيضاً</h2>
              <motion.div
                variants={getStaggerContainer()}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-10%" }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {relatedProducts.map(p => (
                  <motion.div key={p.id} variants={getFadeUp(prefersReducedMotion)}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
};

export default ProductDetail;
