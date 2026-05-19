import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, sizeObj, quantity) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.id === product.id && item.size === sizeObj.size
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        newCart[existingItemIndex].lineTotal = newCart[existingItemIndex].quantity * sizeObj.price;
        return newCart;
      }

      return [...prev, {
        id: product.id,
        name: product.name,
        image: product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image',
        size: sizeObj.size,
        price: sizeObj.price,
        quantity,
        lineTotal: sizeObj.price * quantity,
        ...(sizeObj.bundlePerfumes ? { bundlePerfumes: sizeObj.bundlePerfumes } : {}),
      }];
    });

    showToast('تمت الإضافة إلى السلة');
  };

  const removeFromCart = (id, size) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
    showToast('تمت الإزالة من السلة');
  };

  const updateQuantity = (id, size, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => {
      if (item.id === id && item.size === size) {
        return { ...item, quantity: newQuantity, lineTotal: newQuantity * item.price };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      cartItemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
