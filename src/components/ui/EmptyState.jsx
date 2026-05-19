import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReducedMotion, DURATION, EASE } from '../../lib/motion';

const EmptyState = ({ 
  icon: Icon = PackageOpen, 
  title = "Nothing to see here", 
  description = "There are no items to display at this time.",
  actionText,
  actionTo
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <motion.img 
        src="/generated/ui/empty-state.webp"
        alt="Empty"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1, 
          y: prefersReducedMotion ? 0 : [0, -10, 0] 
        }}
        transition={{
          opacity: { duration: DURATION.standard, ease: EASE.standard },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="w-48 h-48 object-contain mb-8 mix-blend-multiply opacity-80"
      />
      <h3 className="font-serif text-2xl text-jet mb-2">{title}</h3>
      <p className="font-sans text-gray-500 max-w-md mb-6 leading-relaxed">{description}</p>
      
      {actionText && actionTo && (
        <Link to={actionTo}>
          <Button variant="primary">{actionText}</Button>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
