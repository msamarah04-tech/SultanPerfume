import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../lib/format';
import { ordersApi } from '../lib/api';
import PageTransition from '../components/layout/PageTransition';
import { useReducedMotion } from '../lib/motion';
import Button from '../components/ui/Button';

const OrderConfirmed = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    ordersApi.getById(id).then(setOrder).catch(console.error);
  }, [id]);

  if (!order) return null;

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen py-20 flex flex-col items-center justify-center relative overflow-hidden">

        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 z-0 opacity-40 bg-[url('/generated/ui/light-leak.webp')] bg-cover bg-left mix-blend-multiply pointer-events-none"
            animate={{ x: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="container mx-auto px-4 max-w-2xl text-center relative z-10">

          {/* Animated Checkmark */}
          <div className="flex justify-center mb-8">
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <motion.path
                d="M30 50 L45 65 L70 35"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
              />
            </svg>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-jet mb-4">
            شكراً لك، {order.customer.name.split(' ')[0]}!
          </h1>

          <p className="font-sans text-gray-500 mb-8 max-w-md mx-auto leading-loose">
            تمّ استلام طلبك رقم <strong className="text-jet">{order.id}</strong> بنجاح.{' '}
            سنتواصل معك على <span dir="ltr" className="text-jet">{order.customer.phone}</span> لتنسيق التوصيل.
          </p>

          {/* Order Summary Card */}
          <div className="bg-white border border-gray-100 p-8 text-start mb-10 max-w-md mx-auto shadow-sm">
            <h3 className="font-serif text-xl text-jet mb-6 pb-4 border-b border-gray-100">ملخّص الطلب</h3>
            <div className="flex flex-col gap-4 mb-6">
              {order.items.map(item => (
                <div key={`${item.productId}-${item.size}`} className="flex justify-between items-center font-sans text-sm">
                  <span className="text-gray-500">{item.quantity} × {item.name} (<bdi>{item.size}</bdi>)</span>
                  <span className="text-jet">{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center font-sans pt-4 border-t border-gray-100">
              <span className="font-semibold text-xs text-gray-500">الإجمالي</span>
              <span className="font-serif text-2xl text-gold">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/shop">
              <Button variant="primary">متابعة التسوّق</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">تواصل معنا</Button>
            </Link>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default OrderConfirmed;
