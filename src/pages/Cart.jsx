import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion, getStaggerContainer, getFadeUp } from '../lib/motion';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/format';
import { CONFIG } from '../config';
import PageTransition from '../components/layout/PageTransition';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { ShoppingBag, Minus, Plus, Trash2, Sparkles } from 'lucide-react';

function parseBundleNames(sizeStr) {
  if (!sizeStr) return null;
  const match = sizeStr.match(/\[([^\]]+)\]/);
  if (!match) return null;
  return match[1]
    .split(',')
    .map(s => s.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean)
    .map(name => ({ name }));
}

function BundlePerfumeList({ item }) {
  const perfumes = item.bundlePerfumes || parseBundleNames(item.size);
  if (!perfumes) return null;

  return (
    <div className="mt-3 border border-gold/20 bg-[#FBF8F0] divide-y divide-gold/10 rounded-sm overflow-hidden">
      {perfumes.map((p, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <span className="w-5 h-5 rounded-full bg-gold text-white text-[9px] font-bold flex items-center justify-center shrink-0 font-mono shadow-sm">
            {i + 1}
          </span>
          {p.image && (
            <div className="w-7 h-8 bg-white border border-gold/10 shrink-0 overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-sans text-xs text-jet truncate leading-tight">{p.name}</p>
            {p.brand && (
              <p className="font-sans text-[10px] text-gold/80 truncate">{p.brand}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, subtotal } = useCart();
  const prefersReducedMotion = useReducedMotion();

  const isFreeDelivery = CONFIG.freeDeliveryThreshold > 0 && subtotal >= CONFIG.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : CONFIG.deliveryFee;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <PageTransition>
        <div className="bg-ivory min-h-screen py-20 flex items-center justify-center">
          <EmptyState
            icon={ShoppingBag}
            title="سلتك فارغة"
            description="لم تضف أي عطور إلى سلتك بعد."
            actionText="ابدأ التسوّق"
            actionTo="/shop"
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen pt-4 md:pt-8 pb-20">
        <div className="container mx-auto px-4 md:px-8">

          <h1 className="font-serif text-4xl text-jet mb-8">سلة المشتريات</h1>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

            {/* Order Summary — shows FIRST on mobile so the CTA is above the fold */}
            <div className="w-full lg:w-80 shrink-0 order-first lg:order-last">
              <div className="bg-white p-6 md:p-8 border border-gray-100 lg:sticky lg:top-24">
                <h2 className="font-serif text-2xl text-jet mb-6">ملخّص الطلب</h2>

                <div className="flex flex-col gap-4 font-sans text-sm mb-6 pb-6 border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">المجموع الفرعي</span>
                    <span className="text-jet">{formatPrice(subtotal)}</span>
                  </div>
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

                <Link to="/checkout">
                  <Button variant="primary" fullWidth>متابعة الطلب</Button>
                </Link>

                <div className="flex items-center justify-center gap-1.5 mt-4 bg-gold/5 border border-gold/10 py-2">
                  <span className="text-[10px] font-sans text-gold font-bold">✨ التوصيل مجاني بالكامل لكافة الطلبات!</span>
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-grow order-last lg:order-first">
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 font-sans text-[10px] text-gray-500">
                <div className="col-span-6">المنتج</div>
                <div className="col-span-3 text-center">الكمية</div>
                <div className="col-span-3 text-end">الإجمالي</div>
              </div>

              <motion.div
                variants={getStaggerContainer()}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-6 pt-6"
              >
                {cart.map((item) => (
                  <motion.div
                    key={`${item.id}-${item.size}`}
                    variants={getFadeUp(prefersReducedMotion)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start border-b border-gray-100 pb-6 last:border-0"
                  >

                    {/* Product Info */}
                    <div className="col-span-1 md:col-span-6 flex gap-4 items-start">
                      <div className="w-20 aspect-[4/5] bg-gray-100 shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.id?.startsWith('bundle:') && (
                          <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-[9px] font-bold px-2 py-0.5 mb-2 border border-gold/25 tracking-wider">
                            <Sparkles className="w-2.5 h-2.5" /> باقة خاصة
                          </span>
                        )}
                        <h3 className="font-serif text-lg text-jet mb-1">{item.name}</h3>
                        {item.id?.startsWith('bundle:') ? (
                          <BundlePerfumeList item={item} />
                        ) : (
                          <p className="font-sans text-xs text-gray-500 mb-2"><bdi>{item.size}</bdi></p>
                        )}
                        <p className="font-sans text-sm text-gold mt-3">{formatPrice(item.price)}</p>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 md:col-span-3 flex justify-start md:justify-center">
                      <div className="flex items-center border border-gray-200 bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="p-2 text-gray-400 hover:text-jet transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-sans text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="p-2 text-gray-400 hover:text-jet transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Total & Remove */}
                    <div className="col-span-1 md:col-span-3 flex justify-between md:justify-end items-center">
                      <p className="font-serif text-lg text-jet md:hidden font-medium">الإجمالي: {formatPrice(item.lineTotal)}</p>
                      <p className="hidden md:block font-serif text-lg text-jet">{formatPrice(item.lineTotal)}</p>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors md:ms-4"
                        title="إزالة"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                  </motion.div>
                ))}
              </motion.div>
            </div>


          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Cart;
