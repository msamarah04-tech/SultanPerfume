

const Skeleton = ({ className = '', dark = false }) => {
  return (
    <div className={`relative overflow-hidden ${dark ? 'bg-charcoal/30' : 'bg-gray-200'} ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
  );
};

export default Skeleton;
