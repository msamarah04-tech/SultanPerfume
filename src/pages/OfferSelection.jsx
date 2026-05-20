import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShoppingBag, Search, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useReducedMotion } from '../lib/motion';
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
  const prefersReducedMotion = useReducedMotion();

  const [currentOffer, setCurrentOffer] = useState(DEFAULT_SUMMER_OFFER);
  const [products, setProducts] = useState(() => productsData);
  const [selectedPerfumes, setSelectedPerfumes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const seed = getProducts(productsData, (fresh) => setProducts(fresh));
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

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen pt-4 pb-20">
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

          {/* Slots & Checkout Sticky Row */}
          <div className="sticky top-[80px] z-[500] mb-12">
            <div className="glass-premium p-6 border-gold/15 shadow-[0_10px_35px_rgba(212,175,55,0.04)] bg-ivory/95 backdrop-blur-md">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                
                {/* Visual Selection Progress (Dynamic Slots) */}
                <div className="flex-grow w-full">
                  <h3 className="font-sans font-bold text-xs text-jet/50 mb-3 text-start">عطور باقتك ({selectedPerfumes.length}/{currentOffer.perfumeCount})</h3>
                  {/* overflow-x-auto lets small screens scroll the slot row instead of squashing slots */}
                  <div className="overflow-x-auto -mx-1 px-1 pb-1">
                    <div
                      className="grid gap-2 sm:gap-3"
                      style={{ gridTemplateColumns: `repeat(${currentOffer.perfumeCount}, minmax(52px, 1fr))` }}
                    >
                      {[...Array(currentOffer.perfumeCount)].map((_, index) => {
                        const selected = selectedPerfumes[index];
                        return (
                          <div
                            key={index}
                            className={`relative aspect-square border transition-all duration-300 flex flex-col items-center justify-center ${
                              selected
                                ? 'border-gold bg-white shadow-sm'
                                : 'border-dashed border-gray-300 hover:border-gold/30 bg-gray-50/50'
                            }`}
                          >
                            {selected ? (
                              <>
                                <img
                                  src={selected.images?.[0]}
                                  alt={selected.name}
                                  className="w-full h-full object-cover p-1"
                                />
                                <div className="absolute inset-0 bg-jet/60 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                  <button
                                    onClick={() => handleRemovePerfume(index)}
                                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
                                    title="إزالة"
                                    style={{ minHeight: 'unset', minWidth: 'unset' }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                {/* Thumbnail Name Overlay for larger screens */}
                                <div className="absolute bottom-0 inset-x-0 bg-white/95 border-t border-gray-100 py-0.5 px-1 hidden sm:block truncate text-center text-[8px] font-sans font-semibold text-jet">
                                  <bdi>{selected.brand}</bdi>
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-300 flex flex-col items-center gap-1 select-none">
                                <Plus className="w-4 h-4 text-gray-400" />
                                <span className="text-[9px] font-sans font-bold">{index + 1}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bundle Summary & CTA Button */}
                <div className="shrink-0 w-full lg:w-80 border-t lg:border-t-0 lg:border-s border-gray-100 pt-6 lg:pt-0 lg:ps-8 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="font-sans font-semibold text-xs text-gray-400">سعر العرض الإجمالي</span>
                    <span className="font-serif text-3xl text-gold font-bold"><bdi>{currentOffer.price}</bdi> د.أ</span>
                  </div>
                  
                  {selectedPerfumes.length === currentOffer.perfumeCount ? (
                    <motion.button
                      initial={{ scale: 0.98 }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      onClick={handleAddBundleToCart}
                      className="w-full bg-gold hover:bg-gold-light text-white font-sans text-xs font-bold py-3.5 px-6 transition-all duration-300 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      أضف الباقة إلى السلة
                    </motion.button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-200 text-gray-400 cursor-not-allowed font-sans text-xs font-bold py-3.5 px-6"
                    >
                      اختر {currentOffer.perfumeCount - selectedPerfumes.length} عطور لتفعيل الباقة
                    </button>
                  )}
                  <span className="text-center text-[10px] font-sans text-gray-400 mt-2">شامل التوصيل المجاني لكافة المناطق</span>
                </div>

              </div>
            </div>
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
      </div>
    </PageTransition>
  );
};

export default OfferSelection;
