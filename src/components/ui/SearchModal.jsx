import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowLeft } from 'lucide-react';
import productsData from '../../data/products.json';
import { getProducts } from '../../lib/storage';
import { formatPrice } from '../../lib/format';

const RECENT_KEY = 'recent_searches';
const MAX_RECENT = 5;
const MAX_RESULTS = 8;

const normalize = (s) => String(s || '').toLowerCase().replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState(productsData);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const list = getProducts(productsData, setAllProducts);
    /* eslint-disable react-hooks/set-state-in-effect */
    setAllProducts(list);
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      if (Array.isArray(r)) setRecent(r.slice(0, MAX_RECENT));
    } catch { /* ignore */ }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!isOpen) setQuery(''); }, [isOpen]);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const tokens = q.split(' ').filter(Boolean);
    const scored = [];
    for (const p of allProducts) {
      if (!p.active) continue;
      const hay = normalize(`${p.name} ${p.nameAr || ''} ${p.brand || ''} ${p.category || ''}`);
      let score = 0;
      let allHit = true;
      for (const t of tokens) {
        if (hay.includes(t)) {
          score += hay.startsWith(t) ? 10 : 3;
          if (normalize(p.name).startsWith(t) || normalize(p.brand || '').startsWith(t)) score += 5;
        } else {
          allHit = false;
          break;
        }
      }
      if (allHit) scored.push({ p, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RESULTS).map(s => s.p);
  }, [query, allProducts]);

  const pushRecent = (term) => {
    const v = term.trim();
    if (!v) return;
    const next = [v, ...recent.filter(r => r !== v)].slice(0, MAX_RECENT);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const v = query.trim();
    if (!v) return;
    pushRecent(v);
    navigate(`/shop?q=${encodeURIComponent(v)}`);
    onClose();
  };

  const onPickResult = (productId) => {
    pushRecent(query.trim());
    navigate(`/product/${productId}`);
    onClose();
  };

  const onPickRecent = (term) => {
    setQuery(term);
    navigate(`/shop?q=${encodeURIComponent(term)}`);
    onClose();
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[1200]"
          aria-modal="true"
          role="dialog"
          aria-label="بحث"
        >
          <div
            onClick={onClose}
            className="absolute inset-0 bg-jet/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="relative mx-auto w-full max-w-3xl bg-ivory shadow-[0_30px_80px_rgba(0,0,0,0.35)] mt-[8vh] md:mt-[12vh] border border-gold/15"
          >
            <form onSubmit={submit} className="flex items-center gap-2 px-4 md:px-6 py-4 border-b border-gold/15 bg-ivory/95">
              <Search className="w-5 h-5 text-gold shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن عطر، ماركة، أو فئة..."
                className="flex-1 bg-transparent outline-none font-sans text-sm md:text-base text-jet placeholder:text-charcoal/40"
                dir="rtl"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  className="p-1.5 text-charcoal/50 hover:text-gold transition-colors"
                  aria-label="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ms-1 px-2 py-1 text-[10px] font-sans font-bold tracking-widest text-charcoal/60 hover:text-gold border border-transparent hover:border-gold/30 transition-all"
                aria-label="إغلاق"
              >
                ESC
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto">
              {!query && recent.length > 0 && (
                <div className="px-4 md:px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-sans text-[10px] font-bold tracking-[0.25em] text-gold uppercase">بحث سابق</span>
                    <button onClick={clearRecent} className="font-sans text-[10px] text-charcoal/50 hover:text-gold transition-colors">مسح</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((t) => (
                      <button
                        key={t}
                        onClick={() => onPickRecent(t)}
                        className="px-3 py-1.5 font-sans text-xs border border-gold/20 hover:border-gold hover:bg-gold/[0.05] text-charcoal hover:text-gold transition-all"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!query && (
                <div className="px-4 md:px-6 py-6 text-center">
                  <p className="font-sans text-xs text-charcoal/50">ابدأ الكتابة للبحث بين أكثر من {allProducts.filter(p => p.active).length} عطر</p>
                </div>
              )}

              {query && results.length === 0 && (
                <div className="px-4 md:px-6 py-10 text-center">
                  <p className="font-serif text-lg text-jet mb-2">لا توجد نتائج</p>
                  <p className="font-sans text-xs text-charcoal/50">جرّب كلمات بحث مختلفة أو تصفّح المتجر كاملاً</p>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="inline-block mt-4 px-5 py-2.5 bg-gold text-white text-xs font-sans font-bold tracking-widest uppercase hover:bg-gold-light transition-colors"
                  >
                    تصفّح المتجر
                  </Link>
                </div>
              )}

              {query && results.length > 0 && (
                <ul className="py-2">
                  {results.map((p) => {
                    const startingPrice = Math.min(...p.sizes.map(s => s.price));
                    const img = p.images?.[0];
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => onPickResult(p.id)}
                          className="w-full flex items-center gap-4 px-4 md:px-6 py-3 hover:bg-gold/[0.04] transition-colors text-start group"
                        >
                          <div className="w-14 h-14 shrink-0 bg-[#0e0e0e] flex items-center justify-center overflow-hidden">
                            {img && <img src={img} alt={p.name} className="w-full h-full object-contain p-1.5" loading="lazy" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-serif text-sm md:text-base text-jet truncate group-hover:text-gold transition-colors">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.brand && <span className="font-sans text-[10px] text-charcoal/50 uppercase tracking-widest truncate">{p.brand}</span>}
                              <span className="font-sans text-[10px] text-gold/70">·</span>
                              <span className="font-sans text-xs text-gold font-bold">{formatPrice(startingPrice)}</span>
                            </div>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-charcoal/30 group-hover:text-gold rtl:rotate-180 transition-all group-hover:-translate-x-1 shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {query && results.length > 0 && (
                <button
                  onClick={submit}
                  className="w-full px-4 md:px-6 py-3 border-t border-gold/15 bg-jet text-white font-sans text-xs font-bold tracking-widest uppercase hover:bg-gold transition-colors"
                >
                  عرض كل النتائج عن &quot;{query}&quot;
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
