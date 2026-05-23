import { useState, useEffect, Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE } from '../lib/motion';
import PageTransition from '../components/layout/PageTransition';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import productsData from '../data/products.json';
import { getProducts } from '../lib/storage';
import { offersApi, feedbackApi, settingsApi } from '../lib/api';
import { Sparkles, X } from 'lucide-react';
import SignatureHero from '../components/hero/SignatureHero';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_OFFER_FEATURES = [
  'توصيل سريع ومجاني',
  'ثبات وفوحان',
  '٥ عطور من اختيارك',
  'معاينة عند الاستلام',
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
  image: '/offer.png',
  features: DEFAULT_OFFER_FEATURES,
}];

const Home = () => {
  const container = useRef(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  const [activeBundleOffers, setActiveBundleOffers] = useState(DEFAULT_OFFERS);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const [showTestimonialsSection] = useState(true);
  const [feedbackLightbox, setFeedbackLightbox] = useState(null);
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
            features: Array.isArray(o.features) ? o.features.filter(Boolean) : [],
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
        const withImages = items.filter(f => f.imageUrl);
        if (withImages.length > 0) {
          setTestimonials(withImages.map(f => ({
            id: f.id,
            name: f.customerName || 'عميل كريم',
            imageUrl: f.imageUrl,
          })));
        } else {
          setTestimonials([]);
        }
      })
      .catch(() => setTestimonials([]));
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Simple fade fallback for reduced motion
      if (isReduced) {
        gsap.utils.toArray('.gsap-section').forEach(sec => {
          gsap.fromTo(sec, 
            { opacity: 0 }, 
            { 
              opacity: 1, 
              duration: 0.3,
              scrollTrigger: {
                trigger: sec,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          );
        });
        return;
      }

      gsap.utils.toArray('.gsap-section').forEach(section => {
        // 1. Headings - line mask reveal
        const headingLines = section.querySelectorAll('.gsap-heading-line');
        if (headingLines.length) {
          gsap.fromTo(headingLines,
            { y: '100%' },
            {
              y: '0%',
              duration: 1.2,
              ease: 'power3.out',
              stagger: 0.1,
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none none'
              }
            }
          );
        }

        // 2. Body fade reveal
        const bodyEls = section.querySelectorAll('.gsap-body');
        if (bodyEls.length) {
          gsap.fromTo(bodyEls,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.2,
              ease: 'power3.out',
              delay: 0.1,
              stagger: 0.1,
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none none'
              }
            }
          );
        }

        // 3. Grid items stagger
        const gridItems = section.querySelectorAll('.gsap-grid-item');
        if (gridItems.length) {
          gsap.fromTo(gridItems,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: 'power3.out',
              stagger: 0.08,
              scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none none'
              }
            }
          );
        }

        // 4. Images entrance (scale + opacity)
        const images = section.querySelectorAll('.gsap-image-reveal');
        if (images.length) {
          gsap.fromTo(images,
            { scale: 0.95, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 1.4,
              ease: 'power3.out',
              stagger: 0.1,
              scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none none'
              }
            }
          );
        }

        // 5. Image expansion on scroll
        const expandImages = section.querySelectorAll('.gsap-image-expand');
        if (expandImages.length) {
          expandImages.forEach(img => {
            gsap.fromTo(img,
              { scale: 1 },
              {
                scale: 1.08,
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true
                }
              }
            );
          });
        }
      });

      // 6. Parallax (disable on mobile)
      if (!isMobile) {
        gsap.utils.toArray('.gsap-parallax-bg').forEach(bg => {
          gsap.fromTo(bg,
            { y: '-15%' },
            {
              y: '15%',
              ease: 'none',
              scrollTrigger: {
                trigger: bg.closest('.gsap-section') || bg.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
              }
            }
          );
        });

        gsap.utils.toArray('.gsap-parallax-fg').forEach(fg => {
          gsap.fromTo(fg,
            { y: '10%' },
            {
              y: '-10%',
              ease: 'none',
              scrollTrigger: {
                trigger: fg.closest('.gsap-section') || fg.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
              }
            }
          );
        });
      }

    }, container);

    return () => ctx.revert();
  }, [featuredProducts, bestSellers, activeBundleOffer, testimonials]);

  // ── Section variables ────────────────────────────────────────────

  const sectionHero = (
    <div className="-mt-[72px]">
      <SignatureHero />
    </div>
  );

  const sectionFeatured = (
    <>
      {/* Featured Collection */}
      <section className="gsap-section py-20 md:py-32 bg-ivory">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl text-jet mb-4">
              <span className="block overflow-hidden"><span className="gsap-heading-line block">مجموعتنا المميزة</span></span>
            </h2>
            <div className="w-16 h-px bg-gold mx-auto gsap-body"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8 lg:gap-12">
            {featuredProducts.map(product => (
              <div key={product.id} className="gsap-grid-item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="text-center mt-16 gsap-body">
            <Link to="/shop">
              <Button variant="outline">عرض الكل</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers Row */}
      <section className="gsap-section py-20 md:py-32 bg-ivory">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl text-jet mb-4">
                <span className="block overflow-hidden"><span className="gsap-heading-line block">الأكثر مبيعاً</span></span>
              </h2>
              <div className="w-16 h-px bg-gold gsap-body"></div>
            </div>
            <Link to="/shop" className="font-sans text-xs text-gray-500 hover:text-gold transition-colors gsap-body">
              تسوّق الكل &larr;
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 gap-6 md:gap-8 snap-x scrollbar-hide">
            {bestSellers.map(product => (
              <div
                key={product.id}
                className="gsap-grid-item min-w-[280px] w-[280px] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-1.5rem)] snap-start shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const sectionBundleOffer = (
    <>
      {/* Summer Offer Banner Section */}
      <section className="gsap-section py-20 md:py-28 bg-white border-t border-gray-150 overflow-hidden relative">
        <div className="container mx-auto px-4 md:px-8 relative z-10">

          {/* Elegant Offer Tab Switchers (Multi-View) */}
          {activeBundleOffers.length > 1 && (
            <div className="flex flex-wrap gap-3 justify-center mb-16 max-w-2xl mx-auto gsap-body">
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
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center"
            >

              {/* Offer Details Text (lg:col-span-7) */}
              <div className="lg:col-span-7 order-2 lg:order-1 text-start">
                <span className="gsap-body inline-flex items-center gap-1 bg-gold/10 text-gold text-[10px] font-bold px-3 py-1 mb-4 tracking-widest border border-gold/20">
                  <Sparkles className="w-3 h-3" />
                  العروض الخاصة
                </span>

                <h2 className="font-serif text-3xl md:text-5xl text-jet mb-6 leading-tight">
                  <span className="block overflow-hidden"><span className="gsap-heading-line block">{activeBundleOffer.titleAr}</span></span>
                  <span className="block overflow-hidden text-gold mt-2"><span className="gsap-heading-line block">
                    {activeBundleOffer.perfumeCount != null && activeBundleOffer.price != null
                      ? `${activeBundleOffer.perfumeCount} عطور بـ ${activeBundleOffer.price} دينار فقط!`
                      : activeBundleOffer.titleAr}
                  </span></span>
                </h2>

                <p className="gsap-body font-sans text-gray-500 text-sm mb-8 leading-loose">
                  {activeBundleOffer.descriptionAr}
                </p>

                {/* Bullet Points with Gold Icons */}
                {(activeBundleOffer.features?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    {activeBundleOffer.features.map((text, i) => (
                      <div key={i} className="gsap-body flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">✓</span>
                        <span className="font-sans text-xs text-charcoal font-semibold">{text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="gsap-body">
                  <Link to={`/offer/${activeBundleOffer.id}`}>
                    <Button
                      className="bg-gold hover:bg-gold-light text-white font-sans text-xs font-bold py-4 px-8 shadow-lg shadow-gold/15 transition-all duration-300 flex items-center gap-2 rounded-none"
                    >
                      صمم باقتك الخاصة الآن
                      <span>←</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Offer Image (lg:col-span-5) */}
              <div className="lg:col-span-5 order-1 lg:order-2">
                <div
                  className="relative group p-2 bg-white border border-gold/15 shadow-[0_15px_45px_rgba(212,175,55,0.06)] overflow-hidden gsap-image-reveal"
                >
                  <div className="absolute inset-2 border border-gold/20 z-10 pointer-events-none group-hover:scale-98 transition-transform duration-800" />
                  <img
                    src={activeBundleOffer.image || '/offer.png'}
                    alt={activeBundleOffer.titleAr}
                    className="w-full h-auto object-contain gsap-image-expand"
                    draggable={false}
                  />
                  <div className="absolute top-4 start-4 w-4 h-4 border-t-2 border-s-2 border-gold z-25" />
                  <div className="absolute bottom-4 end-4 w-4 h-4 border-b-2 border-e-2 border-gold z-25" />
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* Our Story Teaser */}
      <section className="gsap-section py-24 md:py-36 bg-jet text-white relative overflow-hidden border-y border-gold/10">
        <div className="gsap-parallax-fg absolute top-1/4 end-[-10%] w-[300px] h-[300px] rounded-full bg-gold/5 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div
              className="gsap-image-reveal relative aspect-[4/5] max-w-sm mx-auto w-full p-2 border border-gold/10"
            >
              <div className="absolute inset-0 border border-gold ltr:translate-x-3 rtl:-translate-x-3 translate-y-3 pointer-events-none gsap-parallax-fg"></div>
              <div className="relative w-full h-full overflow-hidden bg-charcoal">
                <img
                  src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop"
                  alt="صناعة العطور"
                  className="gsap-image-expand w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="max-w-lg md:ps-12">
              <span className="gsap-body font-sans text-xs font-semibold text-gold tracking-widest uppercase mb-4 block">
                الحرفة اليدوية الفاخرة
              </span>
              <h2 className="font-serif text-3xl md:text-5xl mb-6 leading-tight text-white">
                <span className="block overflow-hidden"><span className="gsap-heading-line block">قصتنا</span></span>
              </h2>
              <div className="gsap-body w-12 h-[2px] bg-gold mb-8"></div>
              <p className="gsap-body font-sans text-sm md:text-base text-gray-300 leading-loose mb-10">
                شغفٌ بالعطر يمتدّ لسنوات، ومجموعةٌ مختارة بعناية تجمع أرقى العطور الشرقية والغربية. نحن نسعى لتقديم تجارب عطرية تأخذكم في رحلة عبر الزمن لتروي قصصاً لا تُنسى.
              </p>
              <div className="gsap-body">
                <Link to="/about">
                  <Button variant="outline" className="text-white border-white/40 hover:bg-white hover:text-jet hover:border-white">
                    اقرأ المزيد
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const sectionTestimonials = (showTestimonialsSection && testimonials.length > 0) ? (
    <section className="gsap-section relative bg-white py-24 md:py-36 border-t border-gold/10 overflow-hidden">
      <div className="gsap-parallax-fg absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

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
        @keyframes feedbackScroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .animate-wave-slow { animation: waveSlow 25s ease-in-out infinite; transform-origin: center; }
        .animate-wave-fast { animation: waveFast 18s ease-in-out infinite; transform-origin: center; }
        .animate-shimmer-vertical { animation: shimmerVertical 7s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .feedback-track {
          animation: feedbackScroll 70s linear infinite;
          width: max-content;
        }
        .feedback-strip:hover .feedback-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .feedback-track { animation: none; }
        }
      `}</style>

      <div className="absolute inset-0 flex justify-around pointer-events-none opacity-[0.25]">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[1px] h-full bg-gradient-to-b from-transparent via-gold/20 to-transparent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-transparent via-gold to-transparent animate-shimmer-vertical" style={{ animationDelay: `${i * 1.8}s` }} />
          </div>
        ))}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18] gsap-parallax-bg" xmlns="http://www.w3.org/2000/svg">
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
        <div className="text-center mb-12 md:mb-16">
          <span className="gsap-body font-sans text-xs font-semibold text-gold tracking-[0.25em] uppercase mb-4 block">
            همسات الرضا / Aromatic Voices
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-jet mb-6 leading-tight">
            <span className="block overflow-hidden"><span className="gsap-heading-line block">شهادات حقيقية من عملائنا</span></span>
          </h2>
          <p className="gsap-body font-sans text-sm text-charcoal/70 max-w-xl mx-auto mb-6">
            لقطات أصلية من محادثات الواتساب — كل صورة تحكي قصة عميل راضٍ
          </p>
          <div className="gsap-body w-16 h-px bg-gold mx-auto"></div>
        </div>
      </div>

      {/* Polaroid marquee — auto-scrolls, pauses on hover */}
      <div className="gsap-grid-item feedback-strip relative z-10 py-10 md:py-14">
        {/* Side fade masks so cards melt into the background at the edges */}
        <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

        <div className="feedback-track flex items-center gap-6 md:gap-10 px-6">
          {[...testimonials, ...testimonials].map((t, idx) => {
            const rotate = idx % 4 === 0 ? -2.2 : idx % 4 === 1 ? 1.6 : idx % 4 === 2 ? -1.2 : 2.4;
            return (
              <button
                key={`${t.id}-${idx}`}
                type="button"
                onClick={() => setFeedbackLightbox(t.imageUrl)}
                style={{ '--rot': `${rotate}deg` }}
                className="group relative shrink-0 w-[200px] sm:w-[230px] md:w-[260px] bg-white p-3 pb-12 shadow-[0_18px_45px_-12px_rgba(0,0,0,0.18)] hover:shadow-[0_28px_60px_-10px_rgba(212,175,55,0.35)] transition-[transform,box-shadow] duration-500 ease-out [transform:rotate(var(--rot))] hover:[transform:rotate(0deg)_translateY(-8px)_scale(1.02)] cursor-zoom-in"
              >
                {/* Tape accent at top-center */}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-gold/25 backdrop-blur-sm rotate-[-3deg] shadow-sm" aria-hidden />

                {/* Image — phone aspect, fully visible (no crop) */}
                <div className="relative aspect-[9/16] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <img
                    src={t.imageUrl}
                    alt={t.name}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    draggable={false}
                  />
                  {/* Verified chip */}
                  <span className="absolute top-2 end-2 inline-flex items-center gap-1 bg-jet/90 text-gold text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 backdrop-blur-sm z-10">
                    موثّق
                  </span>
                </div>

                {/* Polaroid caption */}
                <div className="absolute bottom-2 inset-x-3 flex items-center justify-between gap-2" dir="rtl">
                  <span className="font-sans text-[12px] text-jet font-semibold truncate">
                    {t.name}
                  </span>
                  <span className="font-serif text-[11px] text-gold/80 italic shrink-0">
                    شكراً
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Helper hint */}
        <p className="text-center font-sans text-[11px] text-charcoal/50 mt-8 tracking-wider">
          مرّر فوق الصور للإيقاف · انقر لعرضها بالكامل
        </p>
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
    <div ref={container}>
      <PageTransition>
        {homeSections.map(key => {
          const section = sectionMap[key];
          return section ? <Fragment key={key}>{section}</Fragment> : null;
        })}
      </PageTransition>

      {feedbackLightbox && (
        <div
          className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-4"
          onClick={() => setFeedbackLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setFeedbackLightbox(null)}
            className="absolute top-4 end-4 text-white/80 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={feedbackLightbox}
            alt="تقييم"
            className="max-w-full max-h-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
