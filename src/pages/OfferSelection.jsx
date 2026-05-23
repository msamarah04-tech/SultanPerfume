import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ShoppingBag, Search, Sparkles, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/layout/PageTransition';
import productsData from '../data/products.json';
import { getProducts } from '../lib/storage';
import { offersApi } from '../lib/api';

const DEFAULT_SUMMER_OFFER = {
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

const OfferSelection = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { offerId } = useParams();
  const location = useLocation();

  const [currentOffer, setCurrentOffer] = useState(DEFAULT_SUMMER_OFFER);
  const [products, setProducts] = useState(() => productsData);
  const [selectedPerfumes, setSelectedPerfumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const seed = getProducts(productsData, (fresh) => setProducts(fresh));
    // eslint-disable-next-line
    setProducts(seed);
  }, []);

  useEffect(() => {
    offersApi.list()
      .then(items => {
        const matched = items.find(o => o.id === offerId && o.type === 'bundle');
        if (matched) {
          setCurrentOffer({
            ...matched,
            titleAr: matched.title,
            descriptionAr: matched.description,
            image: matched.imageUrl || '/offer.png',
          });
        } else {
          setCurrentOffer(DEFAULT_SUMMER_OFFER);
        }
      })
      .catch(() => setCurrentOffer(DEFAULT_SUMMER_OFFER));
  }, [offerId]);

  // Reset selected perfumes when offer shifts, but check for pre-selected product
  useEffect(() => {
    if (location.state && location.state.preSelectedProduct) {
      // eslint-disable-next-line
      setSelectedPerfumes([location.state.preSelectedProduct]);
      showToast(`تمت إضافة ${location.state.preSelectedProduct.name} كأول عطر في باقتك!`, 'success');
      // Clear location state so it doesn't re-add if they refresh or navigate
      navigate(location.pathname, { replace: true, state: null });
    } else {
      setSelectedPerfumes([]);
    }
  }, [currentOffer]);

  const activeProducts = products.filter(p => p.active);

  // Filter products by category and search term
  const filteredProducts = activeProducts.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddPerfume = (product) => {
    if (selectedPerfumes.length >= currentOffer.perfumeCount) {
      showToast(`لقد اخترت ${currentOffer.perfumeCount} عطور بالفعل! قم بإزالة عطر أولاً إذا كنت ترغب في التعديل.`, 'info');
      return;
    }
    
    setSelectedPerfumes(prev => [...prev, product]);
    showToast(`تمت إضافة ${product.name} إلى باقتك`, 'success');
  };

  const handleRemovePerfume = (index) => {
    const removed = selectedPerfumes[index];
    setSelectedPerfumes(prev => prev.filter((_, i) => i !== index));
    if (removed) {
      showToast(`تمت إزالة ${removed.name}`, 'info');
    }
  };

  const handleAddBundleToCart = () => {
    if (selectedPerfumes.length < currentOffer.perfumeCount) {
      showToast(`يرجى اختيار ${currentOffer.perfumeCount} عطور لتفعيل العرض.`, 'error');
      return;
    }

    const perfumeNames = selectedPerfumes.map((p, i) => `${i + 1}. ${p.name}`).join(', ');

    // Define the custom bundle product — prefix 'bundle:' lets the server identify and price it from DB
    const bundleProduct = {
      id: `bundle:${currentOffer.id}`,
      name: currentOffer.titleAr || 'عرض باقة مخصصة',
      images: [currentOffer.image || '/offer.png']
    };

    const bundleSize = {
      size: `العطور المختارة: [ ${perfumeNames} ]`,
      price: currentOffer.price,
      bundlePerfumes: selectedPerfumes.map(p => ({
        name: p.name,
        brand: p.brand || '',
        image: p.images?.[0] || '',
      })),
    };

    addToCart(bundleProduct, bundleSize, 1);
    navigate('/cart');
  };

  // Categories translation
  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'women', label: 'نسائي' },
    { id: 'men', label: 'رجالي' },
    { id: 'unisex', label: 'للجنسين' }
  ];

  const remaining = currentOffer.perfumeCount - selectedPerfumes.length;
  const isComplete = remaining <= 0;
  const progressPct = Math.min(100, (selectedPerfumes.length / currentOffer.perfumeCount) * 100);

  return (
    <PageTransition>
      {/* pb on mobile gives the catalog grid room to clear the fixed bottom
          bundle bar. On lg+ the bar is at the top, no extra padding needed. */}
      <div className="bg-ivory min-h-screen pt-4 pb-[180px] lg:pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">

          {/* Header Banner Section */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-[10px] font-bold px-3 py-1 mb-3 tracking-widest border border-gold/20">
              <Sparkles className="w-3 h-3" />
              العروض الخاصة
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-jet mb-4">{currentOffer.titleAr}</h1>
            <p className="font-sans text-gray-500 text-sm max-w-xl mx-auto leading-loose">
              {currentOffer.descriptionAr}
            </p>
          </div>

          {/* ── Desktop Bundle Bar (lg+) — sticky under the navbar ─────── */}
          <div className="hidden lg:block sticky top-[80px] z-[500] mb-12">
            <BundleBarDesktop
              selected={selectedPerfumes}
              count={currentOffer.perfumeCount}
              price={currentOffer.price}
              progressPct={progressPct}
              isComplete={isComplete}
              remaining={remaining}
              onRemove={handleRemovePerfume}
              onCheckout={handleAddBundleToCart}
            />
          </div>

          {/* Filtering and Searching Bar */}
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 mb-8">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`font-sans text-xs font-semibold px-5 py-2.5 transition-all duration-300 border ${
                    activeCategory === cat.id
                      ? 'bg-gold border-gold text-white shadow-sm'
                      : 'bg-white border-gray-150 text-charcoal hover:bg-gray-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="ابحث عن العطور الصيفية المفضلة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full font-sans text-base md:text-xs bg-white border border-gray-200 px-10 py-3 focus:border-gold focus:outline-none transition-colors text-jet placeholder-gray-400"
              />
              <Search className="w-4 h-4 text-gray-400 absolute start-3.5 top-3.5" />
            </div>
          </div>

          {/* Catalog Selection Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-100">
              <p className="font-sans text-sm text-gray-400">لم نجد أي عطر يطابق بحثك الحالي.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => {
                const countInBundle = selectedPerfumes.filter(p => p.id === product.id).length;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(idx * 0.04, 0.4) }}
                    className="bg-white border border-gray-100 shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] transition-shadow duration-500 flex flex-col group relative overflow-hidden"
                  >
                    {/* Count badge */}
                    {countInBundle > 0 && (
                      <div className="absolute top-2 start-2 bg-gold text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center font-sans shadow-sm ring-2 ring-white z-10">
                        {countInBundle}
                      </div>
                    )}

                    {/* Image zone — dark */}
                    <div className="relative aspect-square bg-[#0e0e0e] overflow-hidden shrink-0">
                      <img
                        src={product.images?.[0]}
                        alt={product.name}
                        draggable={false}
                        className="w-full h-full object-contain p-5 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.06]"
                      />
                    </div>

                    {/* Info zone — white */}
                    <div className="px-3 pt-3 pb-3 flex flex-col gap-2 flex-1">
                      <div>
                        <h4 className="font-serif text-jet text-[15px] leading-snug line-clamp-1">{product.name}</h4>
                        {product.brand && (
                          <p className="font-sans text-[9px] text-gray-400 uppercase tracking-[0.18em] mt-0.5"><bdi>{product.brand}</bdi></p>
                        )}
                      </div>

                      {/* Category pill */}
                      <span className={`w-fit font-sans text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                        product.category === 'men'    ? 'text-sky-600 bg-sky-50 border-sky-200' :
                        product.category === 'women'  ? 'text-rose-600 bg-rose-50 border-rose-200' :
                                                        'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {product.category === 'women' ? 'نسائي' : product.category === 'men' ? 'رجالي' : 'للجنسين'}
                      </span>

                      {/* Add button */}
                      <button
                        onClick={() => handleAddPerfume(product)}
                        disabled={selectedPerfumes.length >= currentOffer.perfumeCount}
                        className={`mt-auto w-full font-sans text-[10px] font-extrabold uppercase tracking-[0.12em] py-3 flex items-center justify-center gap-1.5 transition-all duration-300 ${
                          selectedPerfumes.length >= currentOffer.perfumeCount
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-jet hover:bg-gold text-white hover:text-black'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        أضف للباقة
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

        {/* ── Mobile Bundle Bar (< lg) — fixed at the bottom for thumb reach ── */}
        <div className="lg:hidden">
          <BundleBarMobile
            selected={selectedPerfumes}
            count={currentOffer.perfumeCount}
            price={currentOffer.price}
            progressPct={progressPct}
            isComplete={isComplete}
            remaining={remaining}
            onRemove={handleRemovePerfume}
            onCheckout={handleAddBundleToCart}
          />
        </div>
      </div>
    </PageTransition>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Bundle bar — desktop variant. Sticky just under the navbar. One row:
// progress + slot strip on the left, price + CTA on the right.
// ─────────────────────────────────────────────────────────────────────────
function BundleBarDesktop({ selected, count, price, progressPct, isComplete, remaining, onRemove, onCheckout }) {
  return (
    <div className="relative bg-white border border-gold/20 shadow-[0_10px_35px_rgba(212,175,55,0.08)] overflow-hidden">
      {/* Top progress strip */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gold/10 z-10">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-light via-gold to-gold-dark"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-2 start-2 w-3 h-3 border-s-2 border-t-2 border-gold/40 pointer-events-none" />
      <div className="absolute bottom-2 end-2 w-3 h-3 border-e-2 border-b-2 border-gold/40 pointer-events-none" />

      <div className="grid grid-cols-[1fr_auto] gap-8 p-6 pt-7">
        {/* LEFT: header + slots */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <h3 className="font-serif text-lg text-jet">بناء باقتك</h3>
              <span className="font-sans text-xs font-bold text-gold tracking-widest">
                <bdi>{selected.length}</bdi> / <bdi>{count}</bdi>
              </span>
            </div>
            {!isComplete && (
              <span className="font-sans text-[11px] text-charcoal/60">
                اختر <bdi>{remaining}</bdi> {remaining === 1 ? 'عطر آخر' : 'عطور أخرى'}
              </span>
            )}
            {isComplete && (
              <span className="inline-flex items-center gap-1 font-sans text-[11px] text-gold font-bold">
                <Check className="w-3.5 h-3.5" /> جاهز للإتمام
              </span>
            )}
          </div>

          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: count }).map((_, index) => {
              const item = selected[index];
              return (
                <SlotTile
                  key={index}
                  item={item}
                  index={index}
                  onRemove={onRemove}
                  size="desktop"
                />
              );
            })}
          </div>
        </div>

        {/* RIGHT: price + CTA */}
        <div className="w-72 border-s border-gold/15 ps-8 flex flex-col justify-center">
          <div className="mb-4">
            <div className="font-sans text-[10px] text-charcoal/50 uppercase tracking-widest mb-1">السعر الإجمالي</div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl text-gold font-bold leading-none">
                <bdi>{price}</bdi>
              </span>
              <span className="font-sans text-sm text-charcoal/60">د.أ</span>
            </div>
            <div className="font-sans text-[10px] text-charcoal/40 mt-1">شامل التوصيل المجاني</div>
          </div>

          {isComplete ? (
            <motion.button
              onClick={onCheckout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gold hover:bg-gold-light text-white font-sans text-xs font-bold tracking-widest uppercase py-3.5 px-6 shadow-lg shadow-gold/25 flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              أضف الباقة إلى السلة
            </motion.button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 cursor-not-allowed font-sans text-xs font-bold tracking-widest uppercase py-3.5 px-6"
            >
              اختر <bdi>{remaining}</bdi> {remaining === 1 ? 'عطر' : 'عطور'} لتفعيل العرض
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Bundle bar — mobile variant. Fixed at the bottom of the viewport so the
// CTA is always within thumb reach. Expand chip flips the slot strip open
// to give breathing room when many slots are filled.
// ─────────────────────────────────────────────────────────────────────────
function BundleBarMobile({ selected, count, price, progressPct, isComplete, remaining, onRemove, onCheckout }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[500] pointer-events-none">
      {/* Top fade so cards behind the bar dissolve cleanly */}
      <div className="h-6 bg-gradient-to-t from-ivory to-transparent pointer-events-none" />

      <div className="pointer-events-auto bg-white border-t border-gold/30 shadow-[0_-12px_40px_rgba(10,10,10,0.10)]">
        {/* Top progress strip */}
        <div className="relative h-1 bg-gold/10">
          <motion.div
            className="absolute inset-y-0 start-0 bg-gradient-to-r from-gold-light via-gold to-gold-dark"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          />
        </div>

        {/* Header row — counter + expand/collapse */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-2 -ms-1 px-1 py-1 active:opacity-70"
            aria-expanded={expanded}
            aria-label="تفاصيل الباقة"
          >
            <span className="font-sans text-xs font-bold text-jet">
              <bdi>{selected.length}</bdi> / <bdi>{count}</bdi>
            </span>
            <span className="font-sans text-[11px] text-charcoal/60">
              {isComplete ? 'جاهز للإتمام' : `اختر ${remaining} ${remaining === 1 ? 'عطر آخر' : 'عطور أخرى'}`}
            </span>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="w-4 h-4 inline-flex items-center justify-center text-gold"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          </button>

          <div className="flex items-baseline gap-1">
            <span className="font-serif text-xl text-gold font-bold leading-none"><bdi>{price}</bdi></span>
            <span className="font-sans text-[10px] text-charcoal/60">د.أ</span>
          </div>
        </div>

        {/* Slot strip — expandable */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="slot-strip"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto -mx-1 px-4 pb-3 scrollbar-none">
                <div
                  className="flex gap-2"
                  style={{ minWidth: 'max-content' }}
                >
                  {Array.from({ length: count }).map((_, index) => {
                    const item = selected[index];
                    return (
                      <SlotTile
                        key={index}
                        item={item}
                        index={index}
                        onRemove={onRemove}
                        size="mobile"
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky CTA — safe-area aware for iOS */}
        <div className="px-4 pb-safe-area-bottom">
          {isComplete ? (
            <motion.button
              onClick={onCheckout}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gold active:bg-gold-dark text-white font-sans text-sm font-bold tracking-widest uppercase py-3.5 shadow-lg shadow-gold/25 flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              أضف الباقة إلى السلة
            </motion.button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 cursor-not-allowed font-sans text-sm font-bold tracking-widest uppercase py-3.5"
            >
              اختر <bdi>{remaining}</bdi> {remaining === 1 ? 'عطر آخر' : 'عطور أخرى'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// A single bottle slot — used in both desktop and mobile bars. Always-visible
// × button on filled slots (touch-friendly — the old hover-only remove was
// completely unusable on iOS/Android).
// ─────────────────────────────────────────────────────────────────────────
function SlotTile({ item, index, onRemove, size }) {
  const dims = size === 'mobile' ? 'w-16 h-20' : 'aspect-square';
  const padding = size === 'mobile' ? 'p-1.5' : 'p-2';

  if (!item) {
    return (
      <div
        className={`${dims} shrink-0 relative border border-dashed border-gold/30 bg-gold/[0.02] flex flex-col items-center justify-center gap-1 select-none`}
      >
        <Plus className="w-4 h-4 text-gold/50" />
        <span className="text-[10px] font-sans font-bold text-charcoal/40">{index + 1}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`${dims} shrink-0 relative border border-gold bg-white shadow-sm`}
    >
      {/* Bottle thumb — contain so the bottle isn't cropped */}
      <div className="absolute inset-0 bg-[#0e0e0e]">
        <img
          src={item.images?.[0]}
          alt={item.name}
          className={`w-full h-full object-contain ${padding}`}
          draggable={false}
        />
      </div>

      {/* Brand strip — always visible at the bottom */}
      {item.brand && (
        <div className="absolute inset-x-0 bottom-0 bg-white/95 border-t border-gold/15 py-0.5 px-1 truncate text-center text-[8px] font-sans font-semibold text-jet">
          <bdi>{item.brand}</bdi>
        </div>
      )}

      {/* Always-visible × — 28px hit area for touch */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label={`إزالة ${item.name}`}
        className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-jet text-white flex items-center justify-center shadow-md active:scale-90 hover:bg-red-500 transition-colors"
        style={{ minHeight: 'unset', minWidth: 'unset' }}
      >
        <X className="w-3 h-3" strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

export default OfferSelection;
