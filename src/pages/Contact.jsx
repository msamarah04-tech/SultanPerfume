import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFadeUp, getStaggerContainer, useReducedMotion } from '../lib/motion';
import PageTransition from '../components/layout/PageTransition';
import { CONFIG } from '../config';
import { settingsApi } from '../lib/api';

const Contact = () => {
  const prefersReducedMotion = useReducedMotion();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    settingsApi.getPublic().then(setSettings).catch(() => {});
  }, []);

  const contactEmail = settings?.contactEmail ?? CONFIG.contactEmail;
  const contactPhone = settings?.contactPhone ?? CONFIG.contactPhone;
  const whatsappNumber = settings?.whatsappNumber ?? CONFIG.whatsappNumber;

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
              تواصل معنا
            </motion.h1>
            <motion.div variants={getFadeUp(prefersReducedMotion)} className="w-16 h-px bg-gold mx-auto mb-10"></motion.div>
            <motion.p variants={getFadeUp(prefersReducedMotion)} className="font-sans text-gray-600 leading-loose mb-6">
              هل لديك سؤال أو تحتاج مساعدة؟ نحن هنا لمساعدتك.
            </motion.p>
            <motion.div variants={getFadeUp(prefersReducedMotion)} className="flex flex-col gap-4">
              <a href={`mailto:${contactEmail}`} className="font-sans text-jet hover:text-gold transition-colors">
                <bdi>{contactEmail}</bdi>
              </a>
              <a href={`tel:${contactPhone}`} className="font-sans text-jet hover:text-gold transition-colors">
                <bdi dir="ltr">{contactPhone}</bdi>
              </a>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 font-sans text-sm bg-jet text-white px-6 py-3 hover:bg-gold transition-colors mx-auto"
                >
                  تواصل عبر واتساب
                </a>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Contact;
