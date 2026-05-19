import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useReducedMotion, getStaggerContainer, getFadeUp } from '../lib/motion';
import { formatPrice } from '../lib/format';
import PageTransition from '../components/layout/PageTransition';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import productsData from '../data/products.json';
import { getProducts } from '../lib/storage';
import { Minus, Plus } from 'lucide-react';

const CATEGORY_AR = {
  men: 'رجالي',
  women: 'نسائي',
  unisex: 'للجنسين',
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [activeBundleOffers, setActiveBundleOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('offers');
      let loadedOffers = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        loadedOffers = parsed.filter(o => o.active && o.type === 'bundle');
      }
      
      if (loadedOffers.length === 0) {
        loadedOffers = [{
          id: 'summer-5-for-25',
          titleAr: 'عرض الصيف الاستثنائي',
          titleEn: 'Exceptional Summer Offer',
          descriptionAr: 'اختر أي 5 عطور صيفية منعشة من الكولكشن الكامل بسعر 25 دينار فقط شامل التوصيل المجاني إلى باب بيتك!',
          descriptionEn: 'Select any 5 refreshing summer perfumes for 25 JOD only with free shipping',
          type: 'bundle',
          perfumeCount: 5,
          price: 25,
          image: '/offer.png'
        }];
      }
      
      setActiveBundleOffers(loadedOffers);
      setSelectedOfferId(loadedOffers[0].id);
    } catch (e) {
      console.warn('Error reading active offers in details page:', e);
      const fallback = {
        id: 'summer-5-for-25',
        titleAr: 'عرض الصيف الاستثنائي',
        titleEn: 'Exceptional Summer Offer',
        descriptionAr: 'اختر أي 5 عطور صيفية منعشة من الكولكشن الكامل بسعر 25 دينار فقط شامل التوصيل المجاني إلى باب بيتك!',
        descriptionEn: 'Select any 5 refreshing summer perfumes for 25 JOD only with free shipping',
        type: 'bundle',
        perfumeCount: 5,
        price: 25,
        image: '/offer.png'
      };
      setActiveBundleOffers([fallback]);
      setSelectedOfferId(fallback.id);
    }
  }, []);

  const handleAddToBundle = () => {
    navigate(`/offer/${selectedOfferId}`, { state: { preSelectedProduct: product } });
  };
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const imageScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const allProducts = getProducts(productsData, (fresh) => {
      const found = fresh.find(p => p.id === id && p.active);
      if (found) { setProduct(found); setSelectedSize(found.sizes[0]); }
    });

    const currentProduct = allProducts.find(p => p.id === id && p.active);

    if (!currentProduct) {
      navigate('/404');
      return;
    }

    setProduct(currentProduct);
    setSelectedSize(currentProduct.sizes[0]);
    setQuantity(1);
    setActiveImage(0);

    const related = allProducts
      .filter(p => p.active && p.category === currentProduct.category && p.id !== currentProduct.id)
      .slice(0, 4);
    setRelatedProducts(related);

  }, [id, navigate]);

  if (!product) return null;

  const selectedOffer = activeBundleOffers.find(o => o.id === selectedOfferId) || activeBundleOffers[0];

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

              <p className="font-serif text-2xl text-gold mb-8">
                متوفر حصرياً ضمن باقة عروض السلطان
              </p>

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

              {/* Luxury Offer-Only Promotion Box */}
              <div className="bg-gold/5 border border-gold/15 p-6 rounded-2xl mb-8 relative overflow-hidden">
                {/* Background ambient gold shine */}
                <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
                
                <h4 className="font-serif text-base text-gold font-bold mb-3 flex items-center gap-2">
                  ✨ عروض السلطان الحصرية / Sultan Exclusives
                </h4>
                
                <p className="font-sans text-xs md:text-sm text-charcoal leading-loose mb-6">
                  تأكيداً على تقديم أعلى درجات الفخامة وبأفضل قيمة، هذا العطر متوفر حصرياً ضمن باقة عروض عطور السلطان الملكية.
                </p>

                {/* Dynamic Offer Selector */}
                {activeBundleOffers.length > 1 && (
                  <div className="mb-6">
                    <span className="font-sans text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2.5 block text-start">
                      اختر العرض المفضل لتصميم باقتك / Select Offer Package
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeBundleOffers.map((offer) => {
                        const isSelected = selectedOfferId === offer.id;
                        return (
                          <button
                            key={offer.id}
                            onClick={() => setSelectedOfferId(offer.id)}
                            className={`p-3.5 border transition-all duration-300 text-start flex flex-col justify-between rounded-xl ${
                              isSelected
                                ? 'border-gold bg-gold/[0.04] shadow-sm'
                                : 'border-gold/10 hover:border-gold/30 bg-white/50'
                            }`}
                          >
                            <span className={`font-serif text-xs font-bold ${isSelected ? 'text-gold' : 'text-jet'}`}>
                              {offer.titleAr}
                            </span>
                            <span className="font-sans text-[9px] text-gray-400 mt-2 block">
                              {offer.perfumeCount} عطور بقيمة {offer.price} د.أ
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="font-sans text-xs md:text-sm text-charcoal leading-loose mb-6">
                  <strong className="block text-gold mt-2 font-bold font-serif text-sm">
                    العرض المختار: اختر {selectedOffer ? selectedOffer.perfumeCount : 5} عطور بقيمة {selectedOffer ? selectedOffer.price : 25} د.أ فقط شاملة التوصيل المجاني بالكامل!
                  </strong>
                </p>

                <Button
                  variant="primary"
                  fullWidth
                  className="shadow-[0_4px_25px_rgba(212,175,55,0.15)] py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform duration-300 font-bold"
                  onClick={handleAddToBundle}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'نفذت الكمية' : 'أضف هذا العطر وابدأ تصميم باقتك الخاصة'}
                </Button>
              </div>

              {product.stock <= 5 && product.stock > 0 && (
                <p className="mt-4 font-sans text-xs font-semibold text-red-500">
                  متبقي {product.stock} فقط
                </p>
              )}
              {product.stock === 0 && (
                <p className="mt-4 font-sans text-xs font-semibold text-red-500">
                  نفذت الكمية من المخزن
                </p>
              )}

            </div>
          </div>

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
