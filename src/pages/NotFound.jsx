import { motion } from 'framer-motion';
import { getFadeUp, getStaggerContainer, useReducedMotion } from '../lib/motion';
import PageTransition from '../components/layout/PageTransition';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen py-20 flex flex-col justify-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            variants={getStaggerContainer()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            className="text-center"
          >
            <motion.h1 variants={getFadeUp(prefersReducedMotion)} className="font-serif text-6xl md:text-8xl text-jet mb-6">
              404
            </motion.h1>
            <motion.h2 variants={getFadeUp(prefersReducedMotion)} className="font-serif text-2xl text-jet mb-4">
              الصفحة غير موجودة
            </motion.h2>
            <motion.p variants={getFadeUp(prefersReducedMotion)} className="font-sans text-gray-600 leading-loose mb-8">
              يبدو أنك تهت في عالم العطور.
            </motion.p>
            <motion.div variants={getFadeUp(prefersReducedMotion)}>
              <Link to="/">
                <Button variant="primary">العودة إلى الرئيسية</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFound;
