import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE, DURATION, useReducedMotion, getStaggerContainer, getFadeUp, isRTL } from '../lib/motion';
import ProductCard from '../components/product/ProductCard';
import PageTransition from '../components/layout/PageTransition';
import Button from '../components/ui/Button';
import productsData from '../data/products.json';
import { getProducts } from '../lib/storage';
import { offersApi, feedbackApi, settingsApi } from '../lib/api';
import { Sparkles } from 'lucide-react';
import SignatureHero from '../components/hero/SignatureHero';

const TESTIMONIALS = [
  {
    id: 1,
    name: "فيصل الحارثي",
    location: "عمان",
    product: "Sultan Absolute",
    rating: 5,
    text: "ثباتٌ أسطوري! قمت برشه على معطفي وظلت رائحة العود الفاخر والمسك تنبض بالدفء لثلاثة أيام متتالية. اختيار المكونات ينم عن خبرة ملكية عميقة.",
    glow: "from-gold/20 via-gold/5 to-transparent"
  },
  {
    id: 2,
    name: "سارة العبدالله",
    location: "إربد",
    product: "Oud Imperial",
    rating: 5,
    text: "العطر متوازن بشكل ساحر، عبق فواح يأسر القلوب من أول رشة. التوصيل كان سريعاً جداً والتغليف راقي كأنه هدية ملكية معدّة بعناية.",
    glow: "from-rose-500/10 via-gold/5 to-transparent"
  },
  {
    id: 3,
    name: "ياسر العتوم",
    location: "العقبة",
    product: "Sultan Selection",
    rating: 5,
    text: "تجربة باقة الـ 5 عطور كانت استثنائية! حصلت على تشكيلة مذهلة من الروائح اليومية والمناسبات بسعر رائع وثبات فوّاح يدوم طويلاً فعلاً.",
    glow: "from-blue-500/10 via-gold/5 to-transparent"
  }
];

const DEFAULT_OFFERS = [{
  id: 'summer-5-for-25',
  titleAr: 'عرض الصيف الاستثنائي',
  titleEn: 'Exceptional Summer Offer',
  descriptionAr: 'دلل حواسك هذا الصيف مع عرضنا الحصري والأكثر طلباً. قمنا بتوفير إمكانية اختيار أي 5 زجاجات عطور من مجموعتنا الكاملة (أكثر من 300 نوع عطر عالمي ومنعش) بسعر موحد شامل التوصيل المجاني إلى باب منزلك الأردني وضمان رضا كامل.',
  descriptionEn: 'Select any 5 refreshing summer perfumes for 25 JOD only with free shipping',
  type: 'bundle',
  perfumeCount: 5,
  price: 25,
  image: '/offer.png'
}];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const prefersReducedMotion = useReducedMotion();

  const [activeBundleOffers, setActiveBundleOffers] = useState(DEFAULT_OFFERS);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const [showTestimonialsSection, setShowTestimonialsSection] = useState(true);
  const [homeSections, setHomeSections] = useState(['hero', 'featured', 'bundle_offer', 'testimonials']);

  const activeBundleOffer = activeBundleOffers[currentOfferIndex] || activeBundleOffers[0] || DEFAULT_OFFERS[0];

  useEffect(() => {
    offersApi.list()
      .then(items => {
        const bundles = items
          .filter(o => o.type === 'bundle')
          .map(o => ({
            ...o,
            titleAr: o.titleAr || o.title || '',
            descriptionAr: o.descriptionAr || o.description || '',
            image: o.imageUrl || '/offer.png',
          }));
        setActiveBundleOffers(bundles.length ? bundles : DEFAULT_OFFERS);
        setCurrentOfferIndex(0);
      })
      .catch(() => {
        setActiveBundleOffers(DEFAULT_OFFERS);
        setCurrentOfferIndex(0);
      });
  }, []);

  useEffect(() => {
    settingsApi.getPublic()
      .then(data => {
        if (Array.isArray(data.homeSections) && data.homeSections.length > 0) {
          setHomeSections(data.homeSections);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const applyProducts = (all) => {
      const active = all.filter(p => p.active);
      setFeaturedProducts(active.filter(p => p.featured).slice(0, 4));
      setBestSellers(active.slice(0, 6));
    };
    const allProducts = getProducts(productsData, applyProducts);
    applyProducts(allProducts);

    feedbackApi.list()
      .then(items => {
        if (items.length > 0) {
          setTestimonials(items.map(f => ({
            id: f.id,
            name: f.customerName,
            rating: f.rating,
            text: f.message,
            glow: 'from-gold/20 via-gold/5 to-transparent',
          })));
        } else {
          setTestimonials(TESTIMONIALS);
        }
      })
      .catch(() => setTestimonials(TESTIMONIALS));
  }, []);

  const storyX = prefersReducedMotion ? 0 : (isRTL() ? 32 : -32);

  // ── Section variables ────────────────────────────────────────────

  const sectionHero = (
    <div className="-mt-[72px]">
      <SignatureHero />
    </div>
  );

  const sectionFeatured = (
    <>
      {/* Featured Collection */}
      <section className="py-20 md:py-32 bg-ivory">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-jet mb-4">مجموعتنا المميزة</h2>
            <div className="w-16 h-px bg-gold mx-auto"></div>
          </div>

          <motion.div
            variants={getStaggerContainer()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-20%" }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8 lg:gap-12"
          >
            {featuredProducts.map(product => (
              <motion.div key={product.id} variants={getFadeUp(prefersReducedMotion)}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-16">
            <Link to="/shop">
              <Button variant="outline">عرض الكل</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers Row */}
      <section className="py-20 md:py-32 bg-ivory">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-jet mb-4">الأكثر مبيعاً</h2>
              <div className="w-16 h-px bg-gold"></div>
            </div>
            <Link to="/shop" className="font-sans text-xs text-gray-500 hover:text-gold transition-colors">
              تسوّق الكل &larr;
            </Link>
          </div>

          <motion.div
            variants={getStaggerContainer()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 gap-6 md:gap-8 snap-x scrollbar-hide"
          >
            {bestSellers.map(product => (
              <motion.div
                key={product.id}
                variants={getFadeUp(prefersReducedMotion)}
                className="min-w-[280px] w-[280px] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-1.5rem)] snap-start shrink-0"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );

  const sectionBundleOffer = (
    <>
      {/* Summer Offer Banner Section */}
      <section className="py-20 md:py-28 bg-white border-t border-gray-150 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">

          {/* Elegant Offer Tab Switchers (Multi-View) */}
          {activeBundleOffers.length > 1 && (
            <div className="flex flex-wrap gap-3 justify-center mb-16 max-w-2xl mx-auto">
              {activeBundleOffers.map((offer, idx) => {
                const isSelected = idx === currentOfferIndex;
                return (
                  <button
                    key={offer.id}
                    onClick={() => setCurrentOfferIndex(idx)}
                    className={`py-3 px-6 font-serif text-sm font-bold border transition-all duration-300 relative ${
                      isSelected
                        ? 'border-gold bg-gold/[0.03] text-gold shadow-sm'
                        : 'border-gold/10 text-charcoal hover:border-gold/40 hover:text-gold bg-white'
                    }`}
                  >
                    {offer.titleAr}{offer.perfumeCount != null ? ` (${offer.perfumeCount} عطور)` : ''}
                    {isSelected && (
                      <span className="absolute bottom-0 inset-x-0 h-[2px] bg-gold" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentOfferIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center"
            >

              {/* Offer Details Text (lg:col-span-7) */}
              <div className="lg:col-span-7 order-2 lg:order-1 text-start">
                <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-[10px] font-bold px-3 py-1 mb-4 tracking-widest border border-gold/20">
                  <Sparkles className="w-3 h-3" />
                  العروض الخاصة
                </span>

                <h2 className="font-serif text-3xl md:text-5xl text-jet mb-6 leading-tight">
                  {activeBundleOffer.titleAr} <br />
                  <span className="text-gold">
                    {activeBundleOffer.perfumeCount != null && activeBundleOffer.price != null
                      ? `${activeBundleOffer.perfumeCount} عطور بـ ${activeBundleOffer.price} دينار فقط!`
                      : activeBundleOffer.titleAr}
                  </span>
                </h2>

                <p className="font-sans text-gray-500 text-sm mb-8 leading-loose">
                  {activeBundleOffer.descriptionAr}
                </p>

                {/* Bullet Points with Gold Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">✓</span>
                    <span className="font-sans text-xs text-charcoal font-semibold">توصيل سريع ومجاني</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">✓</span>
                    <span className="font-sans text-xs text-charcoal font-semibold">ثبات وفوحان</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">✓</span>
                    <span className="font-sans text-xs text-charcoal font-semibold">٥ عطور من اختيارك</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">✓</span>
                    <span className="font-sans text-xs text-charcoal font-semibold">معاينة عند الاستلام</span>
                  </div>
                </div>

                <Link to={`/offer/${activeBundleOffer.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gold hover:bg-gold-light text-white font-sans text-xs font-bold py-4 px-8 shadow-lg shadow-gold/15 transition-all duration-300 flex items-center gap-2 rounded-none"
                  >
                    صمم باقتك الخاصة الآن
                    <span>←</span>
                  </motion.button>
                </Link>
              </div>

              {/* Offer Image (lg:col-span-5) */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative group p-2 bg-white border border-gold/15 shadow-[0_15px_45px_rgba(212,175,55,0.06)] overflow-hidden"
                >
                  <div className="absolute inset-2 border border-gold/20 z-10 pointer-events-none group-hover:scale-98 transition-transform duration-500" />
                  <img
                    src={activeBundleOffer.image || '/offer.png'}
                    alt={activeBundleOffer.titleAr}
                    className="w-full h-auto object-contain transition-transform duration-700"
                    draggable={false}
                  />
                  <div className="absolute top-4 start-4 w-4 h-4 border-t-2 border-s-2 border-gold z-25" />
                  <div className="absolute bottom-4 end-4 w-4 h-4 border-b-2 border-e-2 border-gold z-25" />
                </motion.div>
              </div>

            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* Our Story Teaser */}
      <section className="py-24 md:py-36 bg-jet text-white relative overflow-hidden border-y border-gold/10">
        <div className="absolute top-1/4 end-[-10%] w-[300px] h-[300px] rounded-full bg-gold/5 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: storyX }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: DURATION.cinematic, ease: EASE.cinematic }}
              className="relative aspect-[4/5] max-w-sm mx-auto w-full p-2 border border-gold/10"
            >
              <div className="absolute inset-0 border border-gold ltr:translate-x-3 rtl:-translate-x-3 translate-y-3 pointer-events-none"></div>
              <div className="relative w-full h-full overflow-hidden bg-charcoal">
                <motion.img
                  src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop"
                  alt="صناعة العطور"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: DURATION.standard, delay: 0.2 }}
              className="max-w-lg md:ps-12"
            >
              <span className="font-sans text-xs font-semibold text-gold tracking-widest uppercase mb-4 block">
                الحرفة اليدوية الفاخرة
              </span>
              <h2 className="font-serif text-3xl md:text-5xl mb-6 leading-tight">قصتنا</h2>
              <div className="w-12 h-[2px] bg-gold mb-8"></div>
              <p className="font-sans text-sm md:text-base text-gray-300 leading-loose mb-10">
                شغفٌ بالعطر يمتدّ لسنوات، ومجموعةٌ مختارة بعناية تجمع أرقى العطور الشرقية والغربية. نحن نسعى لتقديم تجارب عطرية تأخذكم في رحلة عبر الزمن لتروي قصصاً لا تُنسى.
              </p>
              <Link to="/about">
                <Button variant="outline" className="text-white border-white/40 hover:bg-white hover:text-jet hover:border-white">
                  اقرأ المزيد
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );

  const sectionTestimonials = (showTestimonialsSection && testimonials.length > 0) ? (
    <section className="relative bg-white py-24 md:py-36 border-t border-gold/10 overflow-hidden">
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      <style>{`
        @keyframes waveSlow {
          0% { transform: translate3d(0, 0, 0) scaleY(1); }
          50% { transform: translate3d(-40px, 20px, 0) scaleY(1.05); }
          100% { transform: translate3d(0, 0, 0) scaleY(1); }
        }
        @keyframes waveFast {
          0% { transform: translate3d(0, 0, 0) scaleY(1.05); }
          50% { transform: translate3d(40px, -15px, 0) scaleY(0.95); }
          100% { transform: translate3d(0, 0, 0) scaleY(1.05); }
        }
        @keyframes shimmerVertical {
          0% { transform: translate3d(0, -100%, 0); }
          100% { transform: translate3d(0, 400%, 0); }
        }
        .animate-wave-slow { animation: waveSlow 25s ease-in-out infinite; transform-origin: center; }
        .animate-wave-fast { animation: waveFast 18s ease-in-out infinite; transform-origin: center; }
        .animate-shimmer-vertical { animation: shimmerVertical 7s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>

      <div className="absolute inset-0 flex justify-around pointer-events-none opacity-[0.25]">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[1px] h-full bg-gradient-to-b from-transparent via-gold/20 to-transparent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-transparent via-gold to-transparent animate-shimmer-vertical" style={{ animationDelay: `${i * 1.8}s` }} />
          </div>
        ))}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
        <path d="M -100 150 C 300 350, 600 -50, 1000 250 C 1400 550, 1700 150, 2100 350" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5" className="animate-wave-slow" />
        <path d="M -100 350 C 400 150, 800 450, 1200 250 C 1600 50, 1800 350, 2200 150" fill="none" stroke="url(#goldGradient)" strokeWidth="1" className="animate-wave-fast" />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(212,175,55,0)" />
            <stop offset="25%" stopColor="rgba(212,175,55,0.15)" />
            <stop offset="50%" stopColor="rgba(212,175,55,0.4)" />
            <stop offset="75%" stopColor="rgba(212,175,55,0.15)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <span className="font-sans text-xs font-semibold text-gold tracking-[0.25em] uppercase mb-4 block">
            همسات الرضا / Aromatic Voices
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-jet mb-6 leading-tight">
            ماذا يقول عشاق السلطان؟
          </h2>
          <div className="w-16 h-px bg-gold mx-auto"></div>
        </div>

        <motion.div
          variants={getStaggerContainer()}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.id}
              variants={getFadeUp(prefersReducedMotion)}
              whileHover={{ y: -8 }}
              className="bg-gray-500/[0.06] backdrop-blur-md border border-gray-200/40 p-8 rounded-3xl relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:border-gold/35 hover:bg-gray-500/[0.12] flex flex-col justify-between min-h-[320px]"
            >
              <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-tr ${t.glow} blur-3xl opacity-20 group-hover:scale-125 transition-transform duration-700 pointer-events-none`} />

              <div className="flex justify-between items-start mb-6">
                <span className="text-gold/15 font-serif text-6xl leading-none select-none pointer-events-none">"</span>
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-gold text-sm drop-shadow-[0_0_4px_rgba(212,175,55,0.35)]">♦</span>
                  ))}
                </div>
              </div>

              <p className="font-sans text-sm text-charcoal/90 leading-relaxed mb-8 relative z-10 flex-grow">
                {t.text}
              </p>

              <div className="border-t border-gold/10 pt-6 mt-auto">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-serif text-base text-jet font-semibold mb-1">{t.name}</h4>
                    <p className="font-sans text-[10px] text-gray-400 tracking-wider uppercase">{t.location}</p>
                  </div>
                  {t.product && (
                    <span className="font-sans text-[10px] text-gold/90 bg-gold/5 border border-gold/15 px-3 py-1 rounded-full uppercase tracking-wider">
                      <bdi dir="ltr">{t.product}</bdi>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  ) : null;

  // ── Render ───────────────────────────────────────────────────────

  const sectionMap = {
    hero: sectionHero,
    featured: sectionFeatured,
    bundle_offer: sectionBundleOffer,
    testimonials: sectionTestimonials,
  };

  return (
    <>
      <PageTransition>
        {homeSections.map(key => {
          const section = sectionMap[key];
          return section ? <Fragment key={key}>{section}</Fragment> : null;
        })}
      </PageTransition>
    </>
  );
};

export default Home;
