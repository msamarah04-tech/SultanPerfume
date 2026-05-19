import { motion } from 'framer-motion';
import { getFadeUp, getStaggerContainer, useReducedMotion } from '../lib/motion';
import PageTransition from '../components/layout/PageTransition';

const About = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageTransition>
      <div className="bg-ivory min-h-screen pt-4 pb-12 md:pt-8 md:pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            variants={getStaggerContainer()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            className="text-center"
          >
            <motion.h1 variants={getFadeUp(prefersReducedMotion)} className="font-serif text-4xl md:text-5xl text-jet mb-6">
              عن السلطان للعطور
            </motion.h1>
            <motion.div variants={getFadeUp(prefersReducedMotion)} className="w-16 h-px bg-gold mx-auto mb-10"></motion.div>
            <motion.p variants={getFadeUp(prefersReducedMotion)} className="font-sans text-gray-600 leading-loose mb-6">
              في قلب الأردن، وُلدت السلطان للعطور من شغفٍ بالرائحة وفنّ الجمع بين عبق الشرق وأناقة الغرب. نقدّم مجموعةً مختارةً بعناية من العطور الفاخرة — من العود والمسك الأصيل إلى أرقى العطور العالمية. كل عطرٍ يحمل قصة، وكل زجاجةٍ دعوةٌ لتجربةٍ جديدة.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default About;
