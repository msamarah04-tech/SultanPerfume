import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const isError = type === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, x: '-100%', scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: '-100%', scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-jet text-white shadow-lg min-w-[300px] border-s-4 ${
        isError ? 'border-red-500' : 'border-gold'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
      )}
      <p className="font-sans text-sm font-medium flex-grow">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;
