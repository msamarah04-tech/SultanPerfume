import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion, getStaggerContainer, getFadeUp } from '../lib/motion';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/format';
import { validateRequired, validateMinLength, validatePhone } from '../lib/validation';
import { ordersApi, offersApi } from '../lib/api';
import PageTransition from '../components/layout/PageTransition';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';

// Parse old-format bundle size strings: "العطور المختارة: [ 1. Name, 2. Name ]"
function parseBundleNames(sizeStr) {
  if (!sizeStr) return null;
  const match = sizeStr.match(/\[([^\]]+)\]/);
  if (!match) return null;
  return match[1]
    .split(',')
    .map(s => s.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean);
}

function SidebarBundleList({ item }) {
  const perfumes = item.bundlePerfumes
    ? item.bundlePerfumes.map(p => p.name)
    : parseBundleNames(item.size);

  if (!perfumes) return <p className="text-gray-400 text-[10px] mt-0.5"><bdi>{item.size}</bdi></p>;

  return (
    <div className="mt-2 border border-gold/20 bg-[#FBF8F0] divide-y divide-gold/10 rounded-sm overflow-hidden">
      {perfumes.map((name, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <span className="w-4 h-4 rounded-full bg-gold text-white text-[8px] font-bold flex items-center justify-center shrink-0 font-mono">
            {i + 1}
          </span>
          <span className="font-sans text-[10px] text-jet leading-tight truncate">{name}</span>
        </div>
      ))}
    </div>
  );
}

const JORDAN_CITIES = {
  amman: [
    'عبدون', 'شميساني', 'الرابية', 'تلاع العلي', 'الجبيهة', 'خلدا',
    'صويلح', 'دابوق', 'أبو نصير', 'مرج الحمام', 'أم السماق', 'أم أذينة',
    'الجندويل', 'وادي السير', 'شفا بدران', 'ناعور', 'الأشرفية', 'وسط البلد',
    'العبدلي', 'اليرموك', 'طارق', 'الهاشمي الشمالي', 'الهاشمي الجنوبي',
    'ماركا', 'ضاحية الرشيد', 'الصويفية', 'دير غبار', 'الروضة', 'حي نزال',
    'الزهور', 'بيادر وادي السير', 'القويسمة', 'الجاردنز', 'سحاب',
    'الدوار الأول', 'الدوار الثالث', 'الدوار الرابع', 'الدوار السابع', 'الدوار الثامن',
    'البيادر', 'الموقر', 'الرونق', 'أبو علندا', 'مادبا رود', 'الجزيرة',
  ],
  other: [
    'الزرقاء', 'الرصيفة', 'الهاشمية', 'البقعة', 'الزرقاء الجديدة',
    'إربد', 'الرمثا', 'المزار الشمالي', 'الكورة', 'بيت راس',
    'العقبة',
    'السلط', 'ماحص', 'عيون الباشا',
    'مادبا', 'ذيبان',
    'الكرك', 'مؤتة', 'قصبة الكرك',
    'معان', 'قصبة معان',
    'الطفيلة',
    'جرش', 'قصبة جرش',
    'عجلون',
    'المفرق', 'الأزرق', 'الرويشد', 'الزعتري',
    'الشونة الشمالية', 'الشونة الجنوبية', 'الكرامة', 'دير علا',
  ],
};

const SPARKLES = [
  { x: -90, y: -80, delay: 0.65, size: 14 },
  { x:  85, y: -85, delay: 0.70, size: 9  },
  { x: -108,y:   5, delay: 0.75, size: 11 },
  { x:  102, y:  15, delay: 0.68, size: 13 },
  { x: -68,  y:  88, delay: 0.80, size: 9  },
  { x:  72,  y:  82, delay: 0.73, size: 11 },
  { x:   4,  y: -102,delay: 0.78, size: 8  },
];

function StarSVG({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5Z" fill="#D4AF37" />
    </svg>
  );
}

function OrderSuccessPopup({ order, onContinue, onViewOrder }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-jet/88 backdrop-blur-md" />

      {/* Card */}
      <motion.div
        className="relative bg-white w-full max-w-sm mx-auto shadow-2xl overflow-hidden"
        initial={prefersReducedMotion ? {} : { scale: 0.82, opacity: 0, y: 48 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 290, damping: 22, delay: 0.12 }}
      >
        {/* Gold shimmer top */}
        <motion.div
          className="h-1 w-full bg-gradient-to-r from-transparent via-gold to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />

        <div className="px-8 pt-8 pb-7 text-center">

          {/* Checkmark + sparkles */}
          <div className="relative flex justify-center mb-6">
            {!prefersReducedMotion && (
              <motion.div
                className="absolute w-24 h-24 rounded-full border-2 border-gold/25"
                animate={{ scale: [1, 1.55, 1.9], opacity: [0.6, 0.2, 0] }}
                transition={{ duration: 1.4, delay: 0.75, ease: 'easeOut' }}
              />
            )}
            {!prefersReducedMotion && SPARKLES.map((s, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                style={{ top: '50%', left: '50%', marginTop: -s.size / 2, marginLeft: -s.size / 2 }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.4], x: s.x, y: s.y }}
                transition={{ duration: 0.9, delay: s.delay, ease: 'easeOut' }}
              >
                <StarSVG size={s.size} />
              </motion.div>
            ))}

            <svg className="w-24 h-24 relative z-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="#FBF8F0" />
              <motion.circle
                cx="50" cy="50" r="44"
                fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"
                style={{ transformOrigin: '50px 50px', rotate: '-90deg' }}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
              />
              <motion.path
                d="M28 50 L44 66 L72 34"
                fill="none" stroke="#D4AF37" strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.65, ease: 'easeOut' }}
              />
            </svg>
          </div>

          {/* Headline */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82 }}
          >
            <h2 className="font-serif text-3xl text-jet mb-1.5">تم استلام طلبك!</h2>
            <p className="font-sans text-sm text-gray-500">
              شكراً لك،{' '}
              <strong className="text-jet">{order.customer.name.split(' ')[0]}</strong>
            </p>
          </motion.div>

          {/* Order ID badge */}
          <motion.div
            className="my-5 inline-block bg-[#FBF8F0] border border-gold/40 px-5 py-2.5"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.98 }}
          >
            <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-gray-400 mb-1">رقم الطلب</p>
            <p className="font-mono text-sm text-jet font-bold tracking-wider">{order.id}</p>
          </motion.div>

          {/* Contact note */}
          <motion.p
            className="font-sans text-sm text-gray-500 mb-7 leading-relaxed"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            سنتواصل معك على{' '}
            <span dir="ltr" className="text-jet font-medium">{order.customer.phone}</span>
            {' '}لتنسيق التوصيل
          </motion.p>

          {/* Actions */}
          <motion.div
            className="flex flex-col gap-3"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Button variant="primary" fullWidth onClick={onContinue}>
              متابعة التسوّق
            </Button>
            <button
              onClick={onViewOrder}
              className="font-sans text-xs text-gray-400 hover:text-gold transition-colors underline underline-offset-4 py-1"
            >
              عرض تفاصيل الطلب
            </button>
          </motion.div>
        </div>

        {/* Gold shimmer bottom */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
      </motion.div>
    </motion.div>
  );
}

const Checkout = () => {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Delivery fee and total are computed server-side on order submission.
  // Show client-side estimates from config for the summary sidebar.
  const isFreeDelivery = subtotal > 0 && false; // server decides
  const deliveryFee = 0;
  const total = Math.max(0, subtotal - discountAmount);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    street: '',
    building: '',
    landmark: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  if (cart.length === 0 && !confirmedOrder) {
    navigate('/cart');
    return null;
  }

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    let error = null;
    if (id === 'name')     error = validateMinLength(value, 2) || validateRequired(value);
    if (id === 'phone')    error = validatePhone(value) || validateRequired(value);
    if (id === 'city')     error = validateRequired(value);
    if (id === 'district') error = validateRequired(value);
    if (id === 'street')   error = validateRequired(value);
    if (error) setErrors(prev => ({ ...prev, [id]: error }));
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      showToast('يرجى إدخال كود الخصم أولاً', 'error');
      return;
    }

    try {
      const code = promoCodeInput.trim().toUpperCase();
      const offers = await offersApi.list();
      const matched = offers.find(
        o => o.promoCode === code && (o.type === 'percentage' || o.type === 'fixed')
      );

      if (matched) {
        setAppliedCoupon(matched);
        const computedDiscount = matched.type === 'percentage'
          ? Math.round((subtotal * matched.discountPercent) / 100)
          : (matched.discountAmount ?? 0);
        setDiscountAmount(computedDiscount);
        showToast(`تم تطبيق كود الخصم بنجاح! خصم بقيمة ${computedDiscount} د.أ`, 'success');
      } else {
        showToast('كود الخصم غير صالح أو منتهي الصلاحية', 'error');
      }
    } catch {
      showToast('تعذّر التحقق من كود الخصم، يرجى المحاولة مجدداً', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      name:     validateMinLength(formData.name, 2) || validateRequired(formData.name),
      phone:    validatePhone(formData.phone) || validateRequired(formData.phone),
      city:     validateRequired(formData.city),
      district: validateRequired(formData.district),
      street:   validateRequired(formData.street),
    };

    if (Object.values(newErrors).some(err => err !== null)) {
      setErrors(newErrors);
      showToast('يرجى تصحيح الأخطاء في النموذج.', 'error');
      window.scrollTo(0, 0);
      return;
    }

    const combinedAddress = [
      formData.city,
      formData.district,
      formData.street,
      formData.building,
      formData.landmark,
    ].filter(Boolean).join('، ');

    setIsSubmitting(true);

    try {
      const payload = {
        customer: { name: formData.name, phone: formData.phone, address: combinedAddress, notes: formData.notes },
        items: cart.map(item => ({
          productId: item.id,
          size: item.size,
          quantity: item.quantity,
        })),
      };

      const order = await ordersApi.create(payload);

      setConfirmedOrder(order);
      clearCart();
      setIsSubmitting(false);

    } catch (err) {
      console.error(err);
      if (err.code === 'PRODUCT_NOT_FOUND' || err.code === 'SIZE_NOT_FOUND') {
        showToast('أحد منتجات سلتك لم يعد متوفراً. يرجى مراجعة السلة وإعادة المحاولة.', 'error');
      } else if (err.code === 'OFFER_NOT_FOUND') {
        showToast('العرض المحدد لم يعد متاحاً. يرجى مراجعة السلة وإعادة المحاولة.', 'error');
      } else {
        showToast('حدث خطأ. يرجى المحاولة مجدداً.', 'error');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen pt-4 md:pt-8 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">

          <h1 className="font-serif text-4xl text-jet mb-8">إتمام الطلب</h1>

          <div className="flex flex-col lg:flex-row gap-12">

            {/* Summary Sidebar */}
            <div className="w-full lg:w-80 shrink-0 order-last lg:order-last">
              <div className="bg-white p-6 md:p-8 border border-gray-100 lg:sticky lg:top-24">
                <h2 className="font-serif text-xl text-jet mb-6">ملخّص الطلب</h2>

                <motion.div
                  variants={getStaggerContainer()}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-4 mb-6 max-h-80 overflow-y-auto pe-2"
                >
                  {cart.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.size}`}
                      variants={getFadeUp(prefersReducedMotion)}
                      className="flex justify-between items-start gap-2 font-sans text-sm pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                    >
                      {item.id?.startsWith('bundle:') ? (
                        /* ── Bundle item ── */
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-[8px] font-bold px-1.5 py-0.5 border border-gold/20 mb-1">
                                <Sparkles className="w-2 h-2" /> باقة خاصة
                              </span>
                              <p className="text-jet text-xs font-semibold leading-tight">{item.name}</p>
                            </div>
                            <span className="text-jet text-xs font-semibold shrink-0">{formatPrice(item.lineTotal)}</span>
                          </div>
                          <SidebarBundleList item={item} />
                        </div>
                      ) : (
                        /* ── Regular item ── */
                        <>
                          <div className="flex gap-3 items-center flex-1 min-w-0">
                            <div className="w-10 aspect-[4/5] bg-gray-100 shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-jet text-xs font-semibold truncate">{item.name}</p>
                              <p className="text-gray-400 text-[10px] mt-0.5"><bdi>{item.size}</bdi> × {item.quantity}</p>
                            </div>
                          </div>
                          <span className="text-jet text-xs font-medium shrink-0">{formatPrice(item.lineTotal)}</span>
                        </>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Promo Coupon Entry */}
                <div className="py-4 border-t border-gray-100 flex flex-col gap-2.5">
                  <span className="font-sans font-bold text-xs text-jet/70 text-start">هل لديك كوبون خصم؟</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="أدخل كود الخصم (مثال: SUMMER20)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      disabled={appliedCoupon !== null}
                      className="flex-grow font-sans text-base md:text-xs bg-white border border-gray-200 px-3 py-2.5 focus:border-gold focus:outline-none uppercase text-jet disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={() => {
                          setAppliedCoupon(null);
                          setDiscountAmount(0);
                          setPromoCodeInput('');
                          showToast('تمت إزالة كود الخصم', 'info');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-sans text-xs font-semibold px-4 py-3 transition-colors"
                      >
                        إلغاء
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyPromo}
                        className="bg-jet hover:bg-gold text-white font-sans text-xs font-semibold px-4 py-3 transition-colors shrink-0"
                      >
                        تطبيق
                      </button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="font-sans text-[10px] text-emerald-600 text-start font-bold">
                      ✓ تم تطبيق خصم {appliedCoupon.type === 'percentage' ? `${appliedCoupon.discountPercent}%` : `${appliedCoupon.discountAmount} د.أ`} بنجاح!
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 font-sans text-sm mb-6 pb-6 border-b border-gray-100 pt-6 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">المجموع الفرعي</span>
                    <span className="text-jet">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>خصم الكوبون ({appliedCoupon?.promoCode})</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">رسوم التوصيل</span>
                    <span className="text-jet">
                      {deliveryFee === 0 ? 'مجاني' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                  <span className="font-sans font-semibold text-xs text-gray-500">الإجمالي</span>
                  <span className="font-serif text-2xl text-gold">{formatPrice(total)}</span>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                >
                  تأكيد الطلب
                </Button>

                <p className="font-sans text-[10px] text-gray-400 text-center mt-4">
                  سيتم تأكيد طلبك فور إرساله
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="flex-grow order-first lg:order-first">
              <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 border border-gray-100 shadow-sm">

                <div>
                  <h2 className="font-serif text-2xl text-jet mb-6 pb-4 border-b border-gray-100">بيانات التوصيل</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      id="name"
                      label="الاسم الكامل"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.name}
                      placeholder="مثال: أحمد محمد"
                    />
                    <Input
                      id="phone"
                      label="رقم الهاتف"
                      type="tel"
                      dir="ltr"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.phone}
                      placeholder="0791234567"
                      className="text-start"
                    />
                    {/* City dropdown */}
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-1 w-full">
                      <label htmlFor="city" className="font-sans font-medium text-xs text-gray-500">
                        المدينة / المنطقة <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="city"
                          value={formData.city}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full appearance-none bg-white font-sans text-base md:text-sm py-3 ps-3 pe-10 outline-none transition-colors cursor-pointer text-jet border ${errors.city ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-gold'} ${!formData.city ? 'text-gray-400' : ''}`}
                        >
                          <option value="">اختر المدينة أو المنطقة...</option>
                          <optgroup label="── عمّان ──">
                            {JORDAN_CITIES.amman.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </optgroup>
                          <optgroup label="── محافظات أخرى ──">
                            {JORDAN_CITIES.other.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </optgroup>
                        </select>
                        <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.city && <span className="text-red-500 text-xs mt-0.5">{errors.city}</span>}
                    </div>

                    {/* District + Street */}
                    <div className="col-span-1">
                      <Input
                        id="district"
                        label="الحي / المنطقة الفرعية *"
                        value={formData.district}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.district}
                        placeholder="مثال: حي الورود"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        id="street"
                        label="اسم الشارع *"
                        value={formData.street}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.street}
                        placeholder="مثال: شارع الملك عبدالله"
                      />
                    </div>

                    {/* Building + Landmark */}
                    <div className="col-span-1">
                      <Input
                        id="building"
                        label="رقم المبنى / الشقة"
                        value={formData.building}
                        onChange={handleChange}
                        placeholder="مثال: بناية 12، شقة 3"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        id="landmark"
                        label="علامة مميزة قريبة"
                        value={formData.landmark}
                        onChange={handleChange}
                        placeholder="مثال: بجانب مسجد النور"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <Input
                        id="notes"
                        label="ملاحظات الطلب (اختياري)"
                        multiline
                        rows={2}
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="تعليمات خاصة للتوصيل..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-serif text-2xl text-jet mb-6 pb-4 border-b border-gray-100">الدفع عند الاستلام</h2>
                  <div className="bg-gray-50 border border-gray-200 p-6 flex gap-4 items-start">
                    <ShieldCheck className="w-6 h-6 text-gold shrink-0 mt-1" />
                    <div>
                      <h4 className="font-sans font-medium text-jet mb-2">الدفع عند الاستلام</h4>
                      <p className="font-sans text-sm text-gray-500 leading-loose">
                        يتم دفع المبلغ نقداً عند استلام الطلب.
                      </p>
                      <p className="font-sans text-xs text-gray-400 mt-2 leading-loose">
                        في حال لم يتم استلام الطلب، يتم دفع أجور التوصيل.
                      </p>
                    </div>
                  </div>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>
      <AnimatePresence>
        {confirmedOrder && (
          <OrderSuccessPopup
            order={confirmedOrder}
            onContinue={() => navigate('/shop')}
            onViewOrder={() => navigate(`/order-confirmed/${confirmedOrder.id}`)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default Checkout;
