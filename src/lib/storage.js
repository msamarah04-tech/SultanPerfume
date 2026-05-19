import { productsApi } from './api';

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  },
  remove: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }
};

// ─── Products ────────────────────────────────────────────────────────────────

// Returns cached products immediately (fast first paint), then fetches fresh
// data from the API in the background and calls onUpdate(products) when ready.
export function getProducts(seedData, onUpdate) {
  const CACHE_KEY = 'products_cache';
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Kick off background revalidation
      if (onUpdate) {
        productsApi.list({ limit: 200 })
          .then(data => {
            const fresh = data.items;
            localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
            onUpdate(fresh);
          })
          .catch(() => {}); // fallback: keep showing cached data
      }
      return parsed;
    }
  } catch {}

  // No cache: return seed data immediately and hydrate from API
  if (onUpdate) {
    productsApi.list({ limit: 200 })
      .then(data => {
        const fresh = data.items;
        localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        onUpdate(fresh);
      })
      .catch(() => onUpdate(seedData));
  }
  return seedData;
}

// Used by admin pages — retained for compatibility but admin pages now call the API directly.
export const persistProducts = (products) => {
  try {
    localStorage.setItem('products_cache', JSON.stringify(products));
  } catch {}
};
