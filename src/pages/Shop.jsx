import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion, getStaggerContainer, getFadeUp } from '../lib/motion';
import PageTransition from '../components/layout/PageTransition';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import productsData from '../data/products.json';
import { getProducts } from '../lib/storage';
import { offersApi } from '../lib/api';

const PAGE_SIZE = 12;

const CATEGORIES = [
  { value: 'all', label: 'الكل' },
  { value: 'women', label: 'نسائي' },
  { value: 'men', label: 'رجالي' },
  { value: 'unisex', label: 'للجنسين' },
];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [allProductsRaw, setAllProductsRaw] = useState(productsData);
  const prefersReducedMotion = useReducedMotion();

  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [bundleOffers, setBundleOffers] = useState([]);

  // Derived from API-loaded products, updated when the API responds
  const uniqueBrands = Array.from(
    new Set(allProductsRaw.filter(p => p.active && p.brand).map(p => p.brand))
  ).sort();

  const featuredProducts = allProductsRaw.filter(p => p.active && p.featured).slice(0, 4);

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) setCategory(catParam);
    const brandParam = searchParams.get('brand');
    if (brandParam) setSelectedBrand(brandParam);
  }, [searchParams]);

  const applyFilters = (allProducts) => {
    let filtered = allProducts.filter(p => p.active);
    if (category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (selectedBrand !== 'all') filtered = filtered.filter(p => p.brand === selectedBrand);
    const getStartingPrice = (p) => Math.min(...p.sizes.map(s => s.price));
    filtered.sort((a, b) => {
      switch (sort) {
        case 'price_asc': return getStartingPrice(a) - getStartingPrice(b);
        case 'price_desc': return getStartingPrice(b) - getStartingPrice(a);
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        default: return (b.featured === true) - (a.featured === true);
      }
    });
    return filtered;
  };

  useEffect(() => {
    const allProducts = getProducts(productsData, (fresh) => {
      setAllProductsRaw(fresh);
      setProducts(applyFilters(fresh));
    });
    setAllProductsRaw(allProducts);
    setProducts(applyFilters(allProducts));
    setVisibleCount(PAGE_SIZE);

    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (selectedBrand !== 'all') params.set('brand', selectedBrand);
    if (sort !== 'featured') params.set('sort', sort);
    setSearchParams(params);

  }, [category, selectedBrand, sort, setSearchParams]);

  useEffect(() => {
    offersApi.list()
      .then(items => {
        const bundles = items
          .filter(o => o.type === 'bundle')
          .map(o => ({ ...o, image: o.imageUrl || '/offer.png' }));
        setBundleOffers(bundles);
      })
      .catch(() => {});
  }, []);

  const clearFilters = () => {
    setCategory('all');
    setSelectedBrand('all');
    setSort('featured');
  };

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen">
        <div className="container mx-auto px-4 md:px-8 pt-4 pb-12 md:pt-8 md:pb-20">

          <div className="mb-10">
            <h1 className="font-serif text-4xl md:text-5xl text-jet mb-4">المتجر</h1>
            <div className="w-16 h-px bg-gold"></div>
          </div>

          {/* Featured Perfumes */}
          {featuredProducts.length > 0 && (
            <section className="mb-14">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl text-jet mb-2">العطور المميزة</h2>
                  <div className="w-10 h-px bg-gold"></div>
                </div>
                <Link to="/shop" className="font-sans text-xs text-gold hover:text-jet transition-colors font-semibold tracking-wide">
                  عرض الكل
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 sm:gap-x-6 md:gap-x-8 gap-y-8">
                {featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Special Offers */}
          {bundleOffers.length > 0 && (
            <section className="mb-14">
              <div className="mb-6">
                <h2 className="font-serif text-2xl md:text-3xl text-jet mb-2">العروض الخاصة</h2>
                <div className="w-10 h-px bg-gold"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bundleOffers.map(offer => (
                  <Link
                    key={offer.id}
                    to={`/offer/${offer.id}`}
                    className="group flex items-center justify-between gap-6 bg-jet text-white p-6 hover:bg-gold transition-colors duration-300"
                  >
                    <div>
                      <p className="font-sans text-[10px] text-gold group-hover:text-jet/60 mb-2 font-bold tracking-[0.2em] uppercase">عرض خاص</p>
                      <h3 className="font-serif text-xl mb-2">{offer.titleAr}</h3>
                      <p className="font-sans text-xs text-gray-300 group-hover:text-jet/70">
                        اختر {offer.perfumeCount} عطور بـ {offer.price} دينار مع توصيل مجاني
                      </p>
                    </div>
                    <span className="font-serif text-3xl text-gold group-hover:text-jet shrink-0 transition-transform duration-300 group-hover:-translate-x-1">←</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Top Filter Bar */}
          <div className="bg-ivory/95 backdrop-blur-md border border-gold/10 p-5 md:p-6 mb-12 shadow-[0_4px_30px_rgba(212,175,55,0.02)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 z-30 relative">
            
            {/* Category Pills (Horizontal) */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-6 py-3 font-sans text-xs font-semibold transition-all duration-300 border rounded-none ${
                    category === c.value
                      ? 'border-gold bg-gold text-white shadow-[0_4px_15px_rgba(212,175,55,0.15)]'
                      : 'border-gold/15 bg-white text-charcoal hover:border-gold/40'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Brand and Sort Selectors */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">

              {/* Brand Select */}
              <div className="relative w-full sm:min-w-[200px] sm:w-auto">
                <span className="absolute -top-2 start-4 bg-ivory px-2 font-sans text-[9px] font-semibold text-gold tracking-widest uppercase z-10">الماركة</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-white border border-gold/15 hover:border-gold/35 px-4 py-3.5 font-sans text-base md:text-xs font-semibold outline-none focus:border-gold transition-all duration-300 rounded-none shadow-sm cursor-pointer"
                >
                  <option value="all">كل الماركات</option>
                  {uniqueBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Sort Select */}
              <div className="relative w-full sm:min-w-[200px] sm:w-auto">
                <span className="absolute -top-2 start-4 bg-ivory px-2 font-sans text-[9px] font-semibold text-gold tracking-widest uppercase z-10">ترتيب المنتجات</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full bg-white border border-gold/15 hover:border-gold/35 px-4 py-3.5 font-sans text-base md:text-xs font-semibold outline-none focus:border-gold transition-all duration-300 rounded-none shadow-sm cursor-pointer"
                >
                  <option value="featured">مميز</option>
                  <option value="newest">الأحدث</option>
                  <option value="price_asc">السعر: من الأقل</option>
                  <option value="price_desc">السعر: من الأعلى</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(category !== 'all' || selectedBrand !== 'all' || sort !== 'featured') && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-3.5 font-sans text-xs font-semibold text-gold hover:text-white border border-gold/15 hover:bg-gold bg-white transition-all duration-300 rounded-none shrink-0"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>

          </div>

          {/* Product Grid */}
          <main className="w-full">
            {products.length === 0 ? (
              <div onClick={clearFilters}>
                <EmptyState
                  title="لا توجد عطور مطابقة"
                  description="لم نجد عطوراً تطابق الفلاتر الحالية. جرّب تعديل معايير البحث أو مسح الفلاتر."
                  actionText="مسح الفلاتر"
                />
              </div>
            ) : (
              <>
                <motion.div
                  variants={getStaggerContainer()}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 md:gap-x-8 gap-y-8 sm:gap-y-10 md:gap-y-16"
                >
                  {products.slice(0, visibleCount).map(product => (
                    <motion.div key={product.id} variants={getFadeUp(prefersReducedMotion)}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>

                {visibleCount < products.length && (
                  <div className="flex justify-center mt-16">
                    <button
                      onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      className="px-10 py-4 font-sans text-xs font-semibold border border-gold/40 text-gold hover:bg-gold hover:text-white transition-all duration-300"
                    >
                      تحميل المزيد ({products.length - visibleCount} عطر متبقٍ)
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

        </div>
      </div>
    </PageTransition>
  );
};

export default Shop;
