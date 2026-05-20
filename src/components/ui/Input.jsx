import React from 'react';

const Input = React.forwardRef(({
  label,
  error,
  id,
  className = '',
  type = 'text',
  multiline = false,
  rows = 4,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const baseStyles = `w-full bg-white border font-sans text-base md:text-sm p-3 transition-colors outline-none
    ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-gold'}
    ${className}`;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="font-sans font-medium text-xs text-gray-500">
          {label}
        </label>
      )}

      {multiline ? (
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={baseStyles}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={baseStyles}
          {...props}
        />
      )}

      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
