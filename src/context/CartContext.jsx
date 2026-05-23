/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastContext';
import { settingsApi, productsApi } from '../lib/api';
import { resolveTieredLineTotal, resolveCartTier } from '../lib/pricing';

const CartContext = createContext(null);

// Apply pricing to all cart items. Steps:
//   1) Per line, compute baseline line total via per-product tier / global %.
//   2) If a cart-wide tier matches the total non-bundle qty, replace the
//      non-bundle subtotal with the tier's totalPrice and distribute it
//      proportionally across non-bundle lines.
// Bundles are always fixed-price and never participate in cart-tier math.
function priceCart(stored, gp, cartTiers) {
  // First pass: baseline per-line price
  const lines = stored.map(item => {
    if (item.id?.startsWith('bundle:')) {
      return {
        ...item,
        isBundle: true,
        price: item.basePrice,
        lineTotal: item.basePrice * item.quantity,
      };
    }
    const base = item.basePrice ?? item.price ?? 0;
    const lineTotal = resolveTieredLineTotal(base, item.quantity, item.quantityTiers, gp);
    return {
      ...item,
      isBundle: false,
      price: item.quantity > 0 ? lineTotal / item.quantity : lineTotal,
      lineTotal,
      rawCatalog: base * item.quantity,
    };
  });

  // Second pass: cart-wide tier on total non-bundle qty. The deal caps at the
  // highest configured tier's minQty — every bottle beyond costs
  // `excessUnitPrice` JOD (default 5). Mirrors server/src/lib/pricing.js.
  const nonBundle = lines.filter(l => !l.isBundle);
  const cartQty = nonBundle.reduce((s, l) => s + l.quantity, 0);
  const match = resolveCartTier(cartQty, cartTiers);

  if (match && nonBundle.length) {
    const tierTotal = Number(match.totalPrice) || 0;
    const rawSum = nonBundle.reduce((s, l) => s + l.rawCatalog, 0);
    const cap = cartTiers?.enabled && Array.isArray(cartTiers.tiers) && cartTiers.tiers.length
      ? Math.max(...cartTiers.tiers.map(t => Math.max(1, Math.floor(Number(t.minQty) || 1))))
      : null;
    const excessUnit = cartTiers?.excessUnitPrice != null
      ? Number(cartTiers.excessUnitPrice) || 0
      : 5;

    let effectiveSubtotal;
    if (!cap || cartQty <= cap) {
      effectiveSubtotal = tierTotal;
    } else {
      effectiveSubtotal = tierTotal + (cartQty - cap) * excessUnit;
    }

    let allocated = 0;
    nonBundle.forEach((l, idx) => {
      const isLast = idx === nonBundle.length - 1;
      let share;
      if (isLast) {
        share = effectiveSubtotal - allocated;
      } else if (rawSum > 0) {
        share = (l.rawCatalog / rawSum) * effectiveSubtotal;
      } else {
        share = effectiveSubtotal / nonBundle.length;
      }
      allocated += share;
      l.cartTierApplied = true;
      l.lineTotal = share;
      l.price = l.quantity > 0 ? share / l.quantity : share;
    });
  }

  // Strip helper flags and return
  // eslint-disable-next-line no-unused-vars
  return lines.map(({ isBundle, rawCatalog, ...rest }) => rest);
}

export const CartProvider = ({ children }) => {
  // We only persist the *stored* shape (no derived price/lineTotal).
  const [stored, setStored] = useState(() => {
    const saved = localStorage.getItem('cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Back-fill basePrice for items saved by the older shape.
      return parsed.map(item => ({
        ...item,
        basePrice: item.basePrice ?? item.price ?? 0,
        quantityTiers: item.quantityTiers ?? [],
      }));
    } catch {
      return [];
    }
  });
  const [globalPricing, setGlobalPricing] = useState(null);
  const [cartTiers, setCartTiers] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(stored));
  }, [stored]);

  const reloadSettings = async () => {
    const s = await settingsApi.getPublic().catch(() => null);
    if (!s) return;
    setGlobalPricing(s.quantityPricing ?? null);
    setCartTiers(s.cartQuantityTiers ?? null);
  };

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    reloadSettings();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  // Re-fetch each non-bundle item's basePrice + quantityTiers from the server,
  // plus reload settings (cart-wide tier + global %).
  // Call from any page that displays prices (Cart, Checkout) so stale
  // localStorage values get overwritten with the current backend state.
  const refreshPrices = async () => {
    await reloadSettings();
    const ids = [...new Set(
      stored
        .filter(i => !String(i.id).startsWith('bundle:'))
        .map(i => i.id)
    )];
    if (!ids.length) return;

    const products = await Promise.all(
      ids.map(id => productsApi.getById(id).catch(() => null))
    );
    const byId = new Map(products.filter(Boolean).map(p => [p.id, p]));

    setStored(prev => {
      let dirty = false;
      const next = prev.map(item => {
        const fresh = byId.get(item.id);
        if (!fresh) return item;
        const size = fresh.sizes.find(s => s.size === item.size) ?? fresh.sizes[0];
        const newBase = size?.price ?? item.basePrice;
        const newTiers = fresh.quantityTiers ?? [];
        if (
          item.basePrice === newBase &&
          JSON.stringify(item.quantityTiers ?? []) === JSON.stringify(newTiers)
        ) {
          return item;
        }
        dirty = true;
        return { ...item, basePrice: newBase, quantityTiers: newTiers };
      });
      return dirty ? next : prev;
    });
  };

  // Initial mount: refresh prices once so stale localStorage values get
  // overwritten on first app load. refreshPrices only calls setStored when
  // something actually changed, so no cascading-render loop.
  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    refreshPrices();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  // Derive priced cart on demand — recomputed when inputs change.
  const cart = useMemo(
    () => priceCart(stored, globalPricing, cartTiers),
    [stored, globalPricing, cartTiers],
  );

  const addToCart = (product, sizeObj, quantity) => {
    setStored(prev => {
      const idx = prev.findIndex(i => i.id === product.id && i.size === sizeObj.size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      const isBundle = String(product.id).startsWith('bundle:');
      return [...prev, {
        id: product.id,
        name: product.name,
        image: product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image',
        size: sizeObj.size,
        basePrice: sizeObj.price,
        quantityTiers: isBundle ? [] : (product.quantityTiers || []),
        quantity,
        ...(sizeObj.bundlePerfumes ? { bundlePerfumes: sizeObj.bundlePerfumes } : {}),
      }];
    });
    showToast('تمت الإضافة إلى السلة');
  };

  const removeFromCart = (id, size) => {
    setStored(prev => prev.filter(item => !(item.id === id && item.size === size)));
    showToast('تمت الإزالة من السلة');
  };

  const updateQuantity = (id, size, newQuantity) => {
    if (newQuantity < 1) return;
    setStored(prev => prev.map(item =>
      item.id === id && item.size === size
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const clearCart = () => setStored([]);

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const nonBundleQty = cart
    .filter(i => !String(i.id).startsWith('bundle:'))
    .reduce((s, i) => s + i.quantity, 0);
  const activeCartTier = resolveCartTier(nonBundleQty, cartTiers);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      cartItemCount,
      globalPricing,
      cartTiers,
      activeCartTier,
      refreshPrices,
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
