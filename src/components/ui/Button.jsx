import React from 'react';
import { motion } from 'framer-motion';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  fullWidth = false, 
  isLoading = false,
  disabled,
  ...props 
}, ref) => {
  
  const baseStyles = "inline-flex items-center justify-center font-sans font-medium transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:opacity-50 disabled:cursor-not-allowed outline-none select-none rounded-none relative overflow-hidden";
  
  const variants = {
    primary: "bg-gold text-white border border-gold hover:bg-gold-light hover:border-gold-light shadow-[0_4px_20px_rgba(212,175,55,0.15)] hover:shadow-[0_10px_25px_rgba(212,175,55,0.3)] hover:-translate-y-[2px] active:translate-y-0",
    outline: "bg-transparent border border-jet/40 text-jet hover:border-gold hover:text-gold hover:bg-gold/[0.03] hover:-translate-y-[2px] active:translate-y-0",
    outlineLight: "bg-transparent border border-white/40 text-white hover:border-gold hover:text-gold hover:bg-gold/[0.05] hover:-translate-y-[2px] active:translate-y-0",
    ghost: "bg-transparent text-jet hover:text-gold hover:bg-gold/[0.02]"
  };

  const sizes = {
    sm: "text-xs py-2.5 px-5",
    md: "text-sm py-3.5 px-8",
    lg: "text-base py-4 px-10"
  };

  return (
    <motion.button
      ref={ref}
      disabled={disabled || isLoading}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
      transition={{ duration: 0.15 }}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ms-1 me-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Cinematic hover shimmer line */}
      {!disabled && !isLoading && (
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-shimmer pointer-events-none" />
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
